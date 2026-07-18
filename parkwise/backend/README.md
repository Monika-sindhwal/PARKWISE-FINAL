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
