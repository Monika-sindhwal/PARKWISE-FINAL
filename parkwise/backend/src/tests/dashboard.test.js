const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
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

const hour = (h, daysFromNow = 1) => {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

// Sets up an approved lot with 2 slots, one paid+confirmed booking (past-tense via
// direct DB manipulation isn't needed - we just use future bookings and check status fields)
const setupWorld = async () => {
  const { token: ownerToken } = await registerUser({ role: "owner" });
  const adminToken = await createAdminAndLogin();

  const lotRes = await request(app)
    .post("/api/parking-lots")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      name: "Dashboard Test Lot",
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

  const slotARes = await request(app)
    .post(`/api/parking-lots/${lotId}/slots`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ slotNumber: "A1", vehicleType: "car", pricePerHour: 20 });
  const slotAId = slotARes.body.slot._id;

  const slotBRes = await request(app)
    .post(`/api/parking-lots/${lotId}/slots`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ slotNumber: "A2", vehicleType: "car", pricePerHour: 20 });
  const slotBId = slotBRes.body.slot._id;

  // Mark slot B occupied directly to test slot-count aggregation
  await request(app)
    .put(`/api/parking-lots/${lotId}/slots/${slotBId}`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ status: "occupied" });

  const { token: customerToken } = await registerUser({ role: "customer" });

  const bookingRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ parkingLotId: lotId, slotId: slotAId, entryTime: hour(10), exitTime: hour(13) });
  const bookingId = bookingRes.body.booking._id;

  // Pay for it via the real payment flow so paymentStatus/bookingStatus both update correctly
  const orderRes = await request(app)
    .post("/api/payments/create-order")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ bookingId });

  const razorpay_order_id = orderRes.body.razorpayOrder.id;
  const razorpay_payment_id = "pay_mock_1";
  const razorpay_signature = crypto
    .createHmac("sha256", "test_secret")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  await request(app)
    .post("/api/payments/verify")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

  return { ownerToken, adminToken, customerToken, lotId, bookingId };
};

describe("Dashboard Module", () => {
  test("customer dashboard shows upcoming booking and correct total spent", async () => {
    const { customerToken } = await setupWorld();

    const res = await request(app)
      .get("/api/dashboard/customer")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.upcomingBookings.length).toBe(1);
    expect(res.body.totalSpent).toBe(60); // 3 hrs * $20
  });

  test("owner dashboard shows correct revenue and slot counts", async () => {
    const { ownerToken } = await setupWorld();

    const res = await request(app)
      .get("/api/dashboard/owner")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalBookings).toBe(1);
    expect(res.body.revenue).toBe(60);
    expect(res.body.availableSlots).toBe(1); // slot A still available
    expect(res.body.occupiedSlots).toBe(1); // slot B manually set occupied
  });

  test("admin dashboard shows platform-wide totals", async () => {
    const { adminToken } = await setupWorld();

    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalParkingLots).toBe(1);
    expect(res.body.totalBookings).toBe(1);
    expect(res.body.totalRevenue).toBe(60);
    expect(res.body.lotsByStatus.approved).toBe(1);
  });

  test("customer cannot access the owner dashboard", async () => {
    const { customerToken } = await setupWorld();

    const res = await request(app)
      .get("/api/dashboard/owner")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("owner cannot access the admin dashboard", async () => {
    const { ownerToken } = await setupWorld();

    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("dashboards require authentication", async () => {
    const res = await request(app).get("/api/dashboard/customer");
    expect(res.statusCode).toBe(401);
  });
});
