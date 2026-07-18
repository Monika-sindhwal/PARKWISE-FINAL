const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.JWT_EXPIRES_IN = "1h";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Helper: registers a user with a given role and returns { token, user }
const registerUser = async (overrides = {}) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test",
      email: `${Math.random()}@example.com`,
      password: "password123",
      role: "customer",
      ...overrides,
    });
  return res.body;
};

// Admins are never created through the public /register endpoint (by design -
// see auth.controller.js). In real usage you'd seed the first admin with a
// script or set role="admin" directly in the database. For tests, we do the
// same: create the user via the model, then log in normally to get a real token.
const createAdminAndLogin = async () => {
  const email = `admin_${Math.random()}@example.com`;
  await User.create({
    name: "Admin",
    email,
    password: "password123",
    role: "admin",
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });

  return loginRes.body.token;
};

const sampleLot = {
  name: "Downtown Mall Parking",
  address: "123 Main St",
  city: "Ludhiana",
  lat: 30.901,
  lng: 75.8573,
  openingTime: "08:00",
  closingTime: "22:00",
};

describe("Parking Lot Module", () => {
  test("owner can create a parking lot (defaults to pending)", async () => {
    const { token } = await registerUser({ role: "owner" });

    const res = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);

    expect(res.statusCode).toBe(201);
    expect(res.body.parkingLot.status).toBe("pending");
  });

  test("customer cannot create a parking lot", async () => {
    const { token } = await registerUser({ role: "customer" });

    const res = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);

    expect(res.statusCode).toBe(403);
  });

  test("pending lots are hidden from the public list until admin approves", async () => {
    const { token } = await registerUser({ role: "owner" });
    const createRes = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);

    // Still pending - should not show publicly yet
    let listRes = await request(app).get("/api/parking-lots");
    expect(listRes.body.count).toBe(0);

    const adminToken = await createAdminAndLogin();

    const approveRes = await request(app)
      .patch(`/api/parking-lots/${createRes.body.parkingLot._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.parkingLot.status).toBe("approved");

    listRes = await request(app).get("/api/parking-lots");
    expect(listRes.body.count).toBe(1);
  });

  test("non-admin cannot approve a lot", async () => {
    const { token } = await registerUser({ role: "owner" });
    const createRes = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);

    // The owner tries to approve their own lot - should be blocked
    const res = await request(app)
      .patch(`/api/parking-lots/${createRes.body.parkingLot._id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    expect(res.statusCode).toBe(403);
  });

  test("nearby search finds a lot within radius and excludes a far-away one", async () => {
    const { token } = await registerUser({ role: "owner" });
    const adminToken = await createAdminAndLogin();

    // Lot A: ~1km from the search point
    const nearLot = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...sampleLot, name: "Near Lot", lat: 30.905, lng: 75.86 });

    // Lot B: far away (different city, hundreds of km away)
    const farLot = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...sampleLot, name: "Far Lot", city: "Delhi", lat: 28.7041, lng: 77.1025 });

    // Both need approval before they're publicly searchable
    await request(app)
      .patch(`/api/parking-lots/${nearLot.body.parkingLot._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    await request(app)
      .patch(`/api/parking-lots/${farLot.body.parkingLot._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });

    // Search from a point near "Near Lot", with a 10km radius
    const res = await request(app).get(
      "/api/parking-lots/nearby?lat=30.901&lng=75.8573&radius=10"
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.parkingLots[0].name).toBe("Near Lot");
  });

  test("nearby search requires lat and lng", async () => {
    const res = await request(app).get("/api/parking-lots/nearby");
    expect(res.statusCode).toBe(400);
  });

  test("owner can update their own lot", async () => {
    const { token } = await registerUser({ role: "owner" });
    const createRes = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);

    const res = await request(app)
      .put(`/api/parking-lots/${createRes.body.parkingLot._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });

    expect(res.statusCode).toBe(200);
    expect(res.body.parkingLot.name).toBe("Updated Name");
  });

  test("a different owner cannot update someone else's lot", async () => {
    const { token: ownerA } = await registerUser({ role: "owner" });
    const { token: ownerB } = await registerUser({ role: "owner" });

    const createRes = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${ownerA}`)
      .send(sampleLot);

    const res = await request(app)
      .put(`/api/parking-lots/${createRes.body.parkingLot._id}`)
      .set("Authorization", `Bearer ${ownerB}`)
      .send({ name: "Hijacked" });

    expect(res.statusCode).toBe(403);
  });

  test("owner can add, update and delete a slot", async () => {
    const { token } = await registerUser({ role: "owner" });
    const createRes = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);
    const lotId = createRes.body.parkingLot._id;

    const addRes = await request(app)
      .post(`/api/parking-lots/${lotId}/slots`)
      .set("Authorization", `Bearer ${token}`)
      .send({ slotNumber: "A1", vehicleType: "car", pricePerHour: 20 });

    expect(addRes.statusCode).toBe(201);
    const slotId = addRes.body.slot._id;

    const updateRes = await request(app)
      .put(`/api/parking-lots/${lotId}/slots/${slotId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "occupied" });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.slot.status).toBe("occupied");

    const deleteRes = await request(app)
      .delete(`/api/parking-lots/${lotId}/slots/${slotId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
  });

  test("cannot add duplicate slot number on the same floor", async () => {
    const { token } = await registerUser({ role: "owner" });
    const createRes = await request(app)
      .post("/api/parking-lots")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleLot);
    const lotId = createRes.body.parkingLot._id;

    await request(app)
      .post(`/api/parking-lots/${lotId}/slots`)
      .set("Authorization", `Bearer ${token}`)
      .send({ slotNumber: "A1", vehicleType: "car", pricePerHour: 20 });

    const dupRes = await request(app)
      .post(`/api/parking-lots/${lotId}/slots`)
      .set("Authorization", `Bearer ${token}`)
      .send({ slotNumber: "A1", vehicleType: "car", pricePerHour: 25 });

    expect(dupRes.statusCode).toBe(400);
  });
});
