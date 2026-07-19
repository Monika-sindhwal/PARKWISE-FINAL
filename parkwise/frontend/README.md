# ParkWise Frontend — Module 1: Setup + Authentication

## Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env just needs VITE_API_URL - defaults to http://localhost:5000/api (your backend)
npm run dev
```

Opens at `http://localhost:5173`. **Make sure your backend is running on port 5000 first** (`cd ../backend && npm run dev`), otherwise login/register will fail with a network error.

## What's in this module

```
src/
├── api/axios.js            # Pre-configured HTTP client, auto-attaches JWT to every request
├── context/AuthContext.jsx # Global auth state: login, register, logout, session restore
├── components/
│   ├── Navbar.jsx           # Responsive nav (desktop + mobile hamburger menu)
│   ├── ProtectedRoute.jsx   # Redirects to /login if not authenticated (or wrong role)
│   └── ui/                  # Reusable primitives every future module will use:
│       ├── Button.jsx        # variants, loading spinner, icon support
│       ├── Input.jsx         # icon + label + error state
│       ├── Card.jsx          # shadow/border container, optional hover-lift
│       ├── Skeleton.jsx      # loading shimmer placeholder
│       └── EmptyState.jsx    # "nothing here yet" pattern for lists
├── pages/
│   ├── Landing.jsx          # Public homepage - hero, how it works, features, owner CTA
│   ├── Login.jsx
│   ├── Register.jsx        # role picker (Customer / Owner), optional phone + vehicle number
│   └── Home.jsx             # role-aware dashboard welcome (after login), quick-action cards
```

**Routing:** `/` is the public landing page (anyone can see it, logged in or not). `/login` and `/register` are public. `/home` is the protected, authenticated dashboard. Logging in/registering redirects you to `/home`; the navbar logo takes you back to `/home` if logged in, or `/` if not.

**Design system:** CSS variables in `index.css` — signage-blue primary, green/red slot-availability signals, amber hazard-stripe accent used as a signature motif under the navbar. Fonts: Space Grotesk (display) + Inter (body).

## How to test it

### 1. Automated checks (fast, catches real bugs)
```bash
npm run lint     # code quality - should show 0 warnings, 0 errors
npm run build    # production build - should complete with no errors
```

### 2. Manual walkthrough (the real test)
1. `npm run dev`, open `http://localhost:5173`
2. You should land on `/login` (since you're not authenticated) — try submitting empty → should show inline validation, not a blank failure
3. Click **Sign up** → toggle between "Find parking" / "List my lot" → the vehicle number field should only appear for "Find parking"
4. Register a new account → you should see a **success toast**, then land on the Home page with role-appropriate quick-action cards
5. Click **Log out** → should redirect to `/login`
6. Log back in with the same credentials → success toast, back to Home
7. Try logging in with a wrong password → should show an **error toast**, not crash
8. **Resize your browser to mobile width** → the navbar should collapse into a hamburger menu
9. Refresh the page while logged in → you should stay logged in (session restore via `/api/auth/me`)

If anything looks off (spacing, colors, a broken layout at some screen width), tell me exactly what and I'll fix it before we move to Module 2.

## Module 2: Browse & Search Parking (adds)

New pages (both public, no login required — matches your backend, which lets anyone browse):
- **`/search`** — search by city, or tap "Near me" to use your browser's geolocation and hit the `/nearby` endpoint
- **`/parking/:id`** — lot details with a live-style slot grid (green = available, red = occupied, grey = maintenance), color-coded by vehicle type icon

Clicking an available slot currently shows a "coming in the next update" toast — booking itself is Module 3.

### How to test
1. Make sure you have at least one **approved** lot with slots (from your backend testing) — if not, use your seeded admin + an owner account to create and approve one first
2. `/search` → search by the city you used → should show results
3. Click **Near me** → allow location access in the browser prompt → should show nearby results (needs a lot with real lat/lng within ~10km of your actual location, or you can test by picking coordinates close to a lot you made)
4. Try denying location permission → should show a clear error toast, not a silent failure
5. Search a city with no lots → should show the "No parking lots found" empty state
6. Click into a lot → see the slot grid; click an **available** (green) slot → toast appears; click an occupied/maintenance slot → nothing happens (it's disabled)
7. Visit `/parking/some-fake-id` directly → should show the "not found" empty state, not a crash

## Module 3: Booking Flow (adds)

New pages (both protected, customer-only):
- **`/book/:lotId/:slotId`** — date + entry/exit time picker with a live price estimate that updates as you type; submits to your backend's overlap-checked booking endpoint
- **`/bookings`** — "My Bookings" using your `/api/dashboard/customer` endpoint: total spent, upcoming bookings, history, with a Cancel button on anything still pending/confirmed

Also: logging in now returns you to whatever page you were trying to reach (e.g. click an available slot while logged out → prompted to log in → land right back on the booking page, not just the homepage).

### How to test
1. From a lot's details page, click an **available** slot → should take you to the booking form
2. Pick a date/time where exit is before entry → should show an inline warning, not let you submit
3. Pick a valid range → watch the price estimate update live (hours × price/hour)
4. Submit → should redirect to `/bookings` with your new booking **highlighted** with a blue border
5. **Test the overlap check**: book the same slot/time again from a second account (or after cancelling and un-cancelling isn't possible, so just try re-booking the exact same window) → should get a clear "already booked for that time" toast, not a generic error
6. On `/bookings`, click **Cancel** on an upcoming booking → should disappear from upcoming (status becomes cancelled)
7. Log out, then click an available slot from a lot's page while logged out → should prompt login, then land you back on that exact booking page afterward

## Module 4: Payment (adds)

The **Pay now** button appears on any booking that's `pending` + `unpaid`. Two modes, auto-detected — you don't configure anything:

- **No real Razorpay keys on your backend** (your current setup) → clicking Pay now shows a "🧪 Test mode" toast and simulates a real payment using the exact same signature-verification endpoint your backend uses for genuine payments. This isn't a shortcut around the real logic — it produces a byte-identical HMAC signature to what Razorpay itself would generate, just computed in the browser using the Web Crypto API instead of on Razorpay's servers.
- **Real Razorpay test-mode keys added to your `.env`** → clicking Pay now instead opens the actual Razorpay checkout widget (loaded from `checkout.razorpay.com`), and after you complete a real (test-mode) card payment, Razorpay itself returns the signature, verified the same way.

### How to test (with your current no-real-keys setup)
1. Create a booking (Module 3) → go to `/bookings` → it should show `pending` / `unpaid` with a **Pay now** button
2. Click **Pay now** → should show the "🧪 Test mode" toast, then briefly show "Payment successful!"
3. The booking should now show `confirmed` / `paid`, and the **Pay now** button should disappear
4. Check **Total spent** at the top of the page — should now include this booking's amount

### If/when you add real Razorpay test keys later
5. Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test mode) to your **backend's** `.env`, restart the backend
6. Create a fresh booking, click **Pay now** → should now open the real Razorpay checkout popup instead of the test-mode toast
7. Complete a test-mode card payment (Razorpay provides test card numbers in their docs) → booking should confirm the same way

## Module 5: QR Code Display (adds)

- **`/bookings/:id/qr`** (customer) — once a booking is `confirmed`, a "View QR" button appears on it; this page shows the actual QR image large enough to scan
- **`/owner/verify`** (owner/admin) — paste the QR token, see the customer's name/email, vehicle, slot, and lot; confirms entry or reports "already checked in"

**Honest limitation:** this is a paste-token verify screen, not real camera scanning — building camera-based QR scanning needs a dedicated library and camera permissions I can't meaningfully test in this environment. The verification logic itself is fully real and tested; only the "point a camera at it" step is simulated by copy-pasting the token for now.

### How to test
1. Get a booking to `confirmed` (pay for it via Module 4's test-mode flow)
2. Click **View QR** on that booking → should show a large QR image
3. As the lot's owner, go to `/owner/verify` (via the new "Verify entry" card on the owner's home page)
4. You'll need the raw `qrToken` string to paste — for now, open your browser's dev tools (F12) → Network tab → find the `/qr` request → copy the `qrToken` field from the response (not the image)
5. Paste it into the verify form → submit → should show "Entry verified" with the customer's name, vehicle, slot, and lot
6. Submit the exact same token again → should show "Already checked in" instead of an error
7. Try pasting garbage text as the token → should show a clear error toast, not crash

### Real camera scanning (added)
`/owner/verify` now defaults to a **Camera** tab using your device's actual camera (via the `qr-scanner` library) — point it at a real rendered QR code (e.g. the image from `/bookings/:id/qr` shown on another device or printed) and it auto-verifies on detection. Toggle to **Paste token** for the manual fallback described above.

**Important:** browsers only allow camera access on `https://` or `localhost` — this works fine on `http://localhost:5173`, but if you test from your phone using your computer's IP address (e.g. `http://192.168.1.5:5173`), the camera will be blocked by the browser for security reasons unless you set up HTTPS. Test on `localhost` first.

## Module 6: Owner Dashboard (adds)

- **`/owner/lots`** — stats overview (total lots, revenue, available/occupied slots) + list of owned lots with approval-status badges + a form to add a new lot (with a "Use my location" button, same geolocation pattern as Module 2's search)
- **`/owner/lots/:id`** — manage a lot's slots: add new slots, toggle a slot to/from `maintenance`, delete a slot (both disabled while a slot is `occupied`, to avoid disrupting an active booking)
- **`/owner/bookings`** — every booking across all owned lots, with customer name/email, slot, dates, amount, and status

### How to test
1. Log in as an owner → `/owner/lots` → stats should all show `0` if you have no lots yet
2. Click **Add lot** → use "Use my location" to fill coordinates → submit → new lot appears with a `pending` badge
3. Click into that lot → **Add slot** → fill in slot number, price, vehicle type → submit → appears in the slot grid
4. Click **Maintenance** on a slot → badge changes to `maintenance`; click **Reopen** → back to `available`
5. Get your seeded admin to approve the lot (`PATCH /api/parking-lots/:id/approve` or however you did it before) → refresh `/owner/lots` → badge updates to `approved`
6. Have a customer book and pay for a slot on that lot → refresh `/owner/lots` → **Revenue** and **Occupied slots** stats should update
7. Check `/owner/bookings` → that booking should appear with the customer's name and email
8. Try deleting or setting maintenance on an **occupied** slot → both buttons should be disabled

## Module 7: Admin Dashboard (adds)

- **`/admin/dashboard`** — total users, parking lots, bookings, revenue, plus breakdowns by lot status and user role
- **`/admin/lots`** — filterable list (Pending/Approved/Rejected/All) with one-click Approve/Reject buttons

### How to test
1. Log in as your seeded admin → `/admin/lots` → defaults to the **Pending** filter
2. Approve or reject a pending lot → toast confirms, it disappears from the Pending tab, appears under its new status
3. `/admin/dashboard` → numbers should match what you've created across your testing so far

**This completes every page from your original spec.** No more placeholder links anywhere in the app.

## Automated frontend tests (new)

```bash
npm test          # runs once, shows pass/fail
npm run test:watch  # re-runs on file changes while you work
```

**39 tests across 6 files**, focused on the logic most likely to actually break:

- **`bookingCalculations.test.js`** (8 tests) — the price/duration math extracted from the booking page, including a check that it matches the backend's exact rounding formula
- **`AuthContext.test.jsx`** (6 tests) — login/register/logout, localStorage persistence, and session restore/invalidation on page load — mocked against a fake API, no real backend needed
- **`ProtectedRoute.test.jsx`** (5 tests) — loading state, login redirect, role-based blocking, and correct access when allowed
- **`Button.test.jsx`** / **`Input.test.jsx`** / **`StatusBadge.test.jsx`** — the shared UI kit every page depends on

**A real bug was caught while writing these tests:** the `Input` component's `<label>` wasn't programmatically linked to its `<input>` (missing `htmlFor`/`id`) — meaning screen readers couldn't associate labels with fields correctly across every form in the app (Login, Register, booking, lot creation, etc.). Fixed using React's `useId()` hook so every input now gets a unique, stable id automatically.

These tests don't touch your real backend or database — everything's mocked, so they run in about a second and are safe to run constantly while developing.
