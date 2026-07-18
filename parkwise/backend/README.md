# ParkWise Backend — Module 1: Authentication

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm run dev
```

Server runs at `http://localhost:5000`. Health check: `GET /api/health`.

## Endpoints (this module)

| Method | Route                              | Access  | Description             |
|--------|-------------------------------------|---------|--------------------------|
| POST   | /api/auth/register                  | Public  | Create a new account     |
| POST   | /api/auth/login                     | Public  | Log in, get JWT          |
| GET    | /api/auth/me                        | Private | Get current user profile|

## Module 2: Parking Management (adds)

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/parking-lots | Owner | Create a lot (needs `lat`, `lng`) — starts as `pending` |
| GET  | /api/parking-lots/nearby?lat=&lng=&radius= | Public | Find approved lots near a location (radius in km, default 5) |
| GET  | /api/parking-lots?city=&search= | Public | Browse approved lots |
| GET  | /api/parking-lots/:id | Public | Lot details + slots + occupancy |
| GET  | /api/parking-lots/my | Owner | Your own lots |
| PUT/DELETE | /api/parking-lots/:id | Owner (own)/Admin | Edit/delete a lot |
| GET  | /api/parking-lots/admin/all?status= | Admin | All lots, any status |
| PATCH | /api/parking-lots/:id/approve | Admin | Approve/reject a lot |
| POST/PUT/DELETE | /api/parking-lots/:lotId/slots(/:slotId) | Owner (own)/Admin | Manage slots |
| GET  | /api/parking-lots/:lotId/slots?status=&vehicleType= | Public | List slots |

First admin: `node src/utils/seedAdmin.js "Name" email password`

## Module 3: Booking (adds)

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/bookings | Customer | Create a booking (auto-computes totalAmount, blocks overlaps) |
| GET  | /api/bookings/my | Customer | Own booking history |
| GET  | /api/bookings/owner | Owner | All bookings across owned lots |
| GET  | /api/bookings/:id | Booking's customer / lot owner / admin | Booking detail |
| PATCH | /api/bookings/:id/cancel | Customer (own booking) | Cancel a pending/confirmed booking |
| PATCH | /api/bookings/:id/status | Owner/admin | Change status (confirmed/completed/cancelled) — will be automated by Payment module next |

## Module 4: Payment (adds)

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/payments/create-order | Customer (own booking) | Creates a Razorpay order for a pending, unpaid booking |
| POST | /api/payments/verify | Customer | Verifies payment signature; on success sets booking to `paid`/`confirmed` |
| GET  | /api/payments/booking/:bookingId | Customer/lot owner/admin | View payment for a booking |

**Test mode by default:** if `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` aren't set in `.env` (or `NODE_ENV=test`), a mock Razorpay client is used automatically — `npm test` and local dev both work with zero setup, no real Razorpay account needed yet. Add real test-mode keys from the [Razorpay dashboard](https://dashboard.razorpay.com/app/keys) whenever you're ready to test the real checkout flow.

## Module 5: QR Code (adds)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/bookings/:id/qr | Customer (own booking) | Generates a signed-token QR code — only for `confirmed` bookings |
| POST | /api/bookings/verify-qr | Owner/admin | Scans/verifies a QR code, records `checkInTime` on first scan |

The QR encodes a signed JWT (not a plain booking ID), so it can't be forged. It uses `QR_SECRET` if set, otherwise falls back to `JWT_SECRET`.

## Module 6: Dashboards (adds)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/dashboard/customer | Customer | Upcoming bookings, history, total spent |
| GET | /api/dashboard/owner | Owner | Total bookings, revenue, available/occupied slot counts across owned lots |
| GET | /api/dashboard/admin | Admin | Platform-wide totals: users, lots, bookings, revenue, lots-by-status, users-by-role |

No new dependencies in this module.
| POST   | /api/auth/forgot-password           | Public  | Generate reset token     |
| POST   | /api/auth/reset-password/:token     | Public  | Set new password         |

## Testing — two layers

### 1. Automated tests (fast, run anytime, no setup needed)
```bash
npm test
```
This uses `mongodb-memory-server`, so it spins up a temporary in-memory MongoDB —
no real database required, and nothing touches your dev data. Covers: register,
duplicate email, missing fields, login (correct/incorrect), and protected route access.

### 2. Manual testing (to see it behave like a real API)
Import `ParkWise_Auth.postman_collection.json` into Postman (or Thunder Client in VS Code).
Run in this order: Health Check → Register → Login → copy the `token` from the
Login response into the `token` collection variable → Get Me.

Or with curl:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```
