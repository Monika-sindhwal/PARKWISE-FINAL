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

const createAdminAndLogin = async () => {
  const email = `admin_${Math.random()}@example.com`;
  await User.create({ name: "Admin", email, password: "password123", role: "admin" });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });
  return res.body.token;
};

// Helper: creates an approved lot with one slot ($20/hr), returns { ownerToken, lotId, slotId }
const setupApprovedLotWithSlot = async () => {
  const { token: ownerToken } = await registerUser({ role: "owner" });
  const adminToken = await createAdminAndLogin();

  const lotRes = await request(app)
    .post("/api/parking-lots")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      name: "Test Lot",
      address: "123 St",
      city: "Ludhiana",
      lat: 30.9,
      lng: 75.85,
      openingTime: "08:00",
      closingTime: "22:00",
    });
  const lotId = lotRes.body.parkingLot._id;

  await request(app)
    .patch(`/api/parking-lots/${lotId}/approve`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "approved" });

  const slotRes = await request(app)
    .post(`/api/parking-lots/${lotId}/slots`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ slotNumber: "A1", vehicleType: "car", pricePerHour: 20 });
  const slotId = slotRes.body.slot._id;

  return { ownerToken, lotId, slotId };
};

// Fixed future times so tests are deterministic
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const hour = (h) => {
  const d = new Date(tomorrow);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

describe("Booking Module", () => {
  test("customer can create a booking with correct auto-calculated amount", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerToken } = await registerUser({ role: "customer" });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        parkingLotId: lotId,
        slotId,
        entryTime: hour(10), // 10:00
        exitTime: hour(13), // 13:00 -> 3 hours
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.booking.totalAmount).toBe(60); // 3 hours * $20
    expect(res.body.booking.bookingStatus).toBe("pending");
  });

  test("rejects an overlapping booking on the same slot", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerA } = await registerUser({ role: "customer" });
    const { token: customerB } = await registerUser({ role: "customer" });

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerA}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    // Overlaps: 12:00-14:00 intersects 10:00-13:00
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerB}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(12), exitTime: hour(14) });

    expect(res.statusCode).toBe(409);
  });

  test("allows a back-to-back booking that does not actually overlap", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerA } = await registerUser({ role: "customer" });
    const { token: customerB } = await registerUser({ role: "customer" });

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerA}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    // Starts exactly when the first one ends - should be allowed
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerB}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(13), exitTime: hour(15) });

    expect(res.statusCode).toBe(201);
  });

  test("allows a new booking on a slot whose previous booking was cancelled", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerA } = await registerUser({ role: "customer" });
    const { token: customerB } = await registerUser({ role: "customer" });

    const first = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerA}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    await request(app)
      .patch(`/api/bookings/${first.body.booking._id}/cancel`)
      .set("Authorization", `Bearer ${customerA}`);

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerB}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    expect(res.statusCode).toBe(201);
  });

  test("rejects booking where exitTime is before entryTime", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerToken } = await registerUser({ role: "customer" });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(13), exitTime: hour(10) });

    expect(res.statusCode).toBe(400);
  });

  test("customer can view their own booking history", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerToken } = await registerUser({ role: "customer" });

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    const res = await request(app)
      .get("/api/bookings/my")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test("owner can view bookings across their lots", async () => {
    const { ownerToken, lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerToken } = await registerUser({ role: "customer" });

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    const res = await request(app)
      .get("/api/bookings/owner")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test("a customer cannot cancel someone else's booking", async () => {
    const { lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerA } = await registerUser({ role: "customer" });
    const { token: customerB } = await registerUser({ role: "customer" });

    const booking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerA}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    const res = await request(app)
      .patch(`/api/bookings/${booking.body.booking._id}/cancel`)
      .set("Authorization", `Bearer ${customerB}`);

    expect(res.statusCode).toBe(403);
  });

  test("owner can mark a booking as completed", async () => {
    const { ownerToken, lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerToken } = await registerUser({ role: "customer" });

    const booking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    const res = await request(app)
      .patch(`/api/bookings/${booking.body.booking._id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "completed" });

    expect(res.statusCode).toBe(200);
    expect(res.body.booking.bookingStatus).toBe("completed");
  });

  test("cannot cancel an already-completed booking", async () => {
    const { ownerToken, lotId, slotId } = await setupApprovedLotWithSlot();
    const { token: customerToken } = await registerUser({ role: "customer" });

    const booking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

    await request(app)
      .patch(`/api/bookings/${booking.body.booking._id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "completed" });

    const res = await request(app)
      .patch(`/api/bookings/${booking.body.booking._id}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(400);
  });
});
