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
  process.env.RAZORPAY_KEY_SECRET = "test_secret"; // matches controller's fallback
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

const hour = (h) => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

// Creates an approved lot + slot + a pending, unpaid booking for a fresh customer.
// Returns everything needed to test payment flows.
const setupPendingBooking = async () => {
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

  const { token: customerToken } = await registerUser({ role: "customer" });

  const bookingRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ parkingLotId: lotId, slotId, entryTime: hour(10), exitTime: hour(13) });

  return {
    ownerToken,
    customerToken,
    bookingId: bookingRes.body.booking._id,
    totalAmount: bookingRes.body.booking.totalAmount,
  };
};

describe("Payment Module", () => {
  test("customer can create a payment order for their own pending booking", async () => {
    const { customerToken, bookingId, totalAmount } = await setupPendingBooking();

    const res = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    expect(res.statusCode).toBe(201);
    expect(res.body.payment.status).toBe("created");
    expect(res.body.payment.amount).toBe(totalAmount);
    expect(res.body.razorpayOrder.id).toMatch(/^order_mock_/);
  });

  test("cannot create an order for someone else's booking", async () => {
    const { bookingId } = await setupPendingBooking();
    const { token: otherCustomer } = await registerUser({ role: "customer" });

    const res = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${otherCustomer}`)
      .send({ bookingId });

    expect(res.statusCode).toBe(403);
  });

  test("correct signature confirms payment and booking", async () => {
    const { customerToken, bookingId } = await setupPendingBooking();

    const orderRes = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    const razorpay_order_id = orderRes.body.razorpayOrder.id;
    const razorpay_payment_id = "pay_mock_12345";
    const razorpay_signature = crypto
      .createHmac("sha256", "test_secret")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verifyRes = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.payment.status).toBe("success");
    expect(verifyRes.body.booking.paymentStatus).toBe("paid");
    expect(verifyRes.body.booking.bookingStatus).toBe("confirmed");
  });

  test("tampered signature is rejected and does not confirm the booking", async () => {
    const { customerToken, bookingId } = await setupPendingBooking();

    const orderRes = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    const razorpay_order_id = orderRes.body.razorpayOrder.id;

    const verifyRes = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        razorpay_order_id,
        razorpay_payment_id: "pay_mock_12345",
        razorpay_signature: "clearly_fake_signature",
      });

    expect(verifyRes.statusCode).toBe(400);

    // Confirm the booking was NOT confirmed as a side effect of the failed attempt
    const bookingCheck = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(bookingCheck.body.booking.paymentStatus).toBe("unpaid");
    expect(bookingCheck.body.booking.bookingStatus).toBe("pending");
  });

  test("cannot pay twice for an already-paid booking", async () => {
    const { customerToken, bookingId } = await setupPendingBooking();

    const orderRes = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    const razorpay_order_id = orderRes.body.razorpayOrder.id;
    const razorpay_payment_id = "pay_mock_12345";
    const razorpay_signature = crypto
      .createHmac("sha256", "test_secret")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    const secondOrderRes = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    expect(secondOrderRes.statusCode).toBe(400);
  });

  test("owner of the lot can view the payment for a booking on their lot", async () => {
    const { customerToken, ownerToken, bookingId } = await setupPendingBooking();

    await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    const res = await request(app)
      .get(`/api/payments/booking/${bookingId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.payment).toBeDefined();
  });

  test("an unrelated user cannot view the payment", async () => {
    const { customerToken, bookingId } = await setupPendingBooking();
    const { token: stranger } = await registerUser({ role: "customer" });

    await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    const res = await request(app)
      .get(`/api/payments/booking/${bookingId}`)
      .set("Authorization", `Bearer ${stranger}`);

    expect(res.statusCode).toBe(403);
  });
});
