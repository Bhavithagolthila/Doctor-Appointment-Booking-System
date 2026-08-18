# 🏥 MediCare — Doctor Appointment Booking System
**MERN Stack** | React + Node.js + Express + MongoDB

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

### Step 1 — Backend
```bash
cd backend
npm install
cp .env.example .env          # create your .env from the template
# Edit .env and set a strong JWT_SECRET (run: openssl rand -base64 64)
node seeder.js                # seeds 12 Indian doctors + admin user
npm run dev                   # starts on http://localhost:5000
```

### Step 2 — Frontend (Patient App)
```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # starts on http://localhost:5173
```

### Step 3 — Admin Panel
```bash
cd admin
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # starts on http://localhost:5174
```

---

## 🔐 Credentials

### Admin Panel (localhost:5174)
- Email: `admin@medicare.com`
- Password: `admin123`

### Test User
- Register any account at localhost:5173/register
- Indian phone: 10 digits starting with 6, 7, 8, or 9

---

## 💰 Payment Flow
| Method | Status After Booking |
|--------|---------------------|
| UPI | ✅ Confirmed + Paid |
| Card | ✅ Confirmed + Paid |
| Net Banking | ✅ Confirmed + Paid |
| Cash (Pay at Hospital) | ⏳ Pending + Unpaid |

**Cancellation Refund:** If cancelled after online payment → "Refund in 3–4 working days" shown.

---

## 🗂️ Project Structure
```
medicare/
├── backend/      → Node.js + Express API (port 5000)
├── frontend/     → React user app (port 5173)
└── admin/        → React admin panel (port 5174)
```

---

## 🔧 Fixes Applied (v2)

| # | Fix | Where |
|---|-----|-------|
| 1 | `.env` removed from repo; use `.env.example` as template | `backend/`, `frontend/`, `admin/` |
| 2 | Slot conflict check: same doctor + date + time rejects with 409 | `backend/routes/appointments.js` |
| 2+ | New `GET /api/appointments/slots/booked` endpoint for frontend greying out taken slots | `backend/routes/appointments.js` |
| 3 | `baseURL` now reads from `VITE_API_URL` env var, not hardcoded localhost | `frontend/src/api/axiosInstance.js`, `admin/src/api/admin.js` |
| 4 | Loading skeletons + error states with retry button on Doctors and DoctorDetail pages | `frontend/src/pages/Doctors.jsx`, `DoctorDetail.jsx` |
| 5 | All brand color references unified to `#7c3aed` (was split between `#5b21b6` and `#7c3aed`) | All frontend + admin components |

## 🔧 Fixes Applied (v3)

| # | Fix | Where |
|---|-----|-------|
| 6 | Booking date was computed with `toISOString()`, which converts to UTC first — for any UTC+ timezone (e.g. India) this silently booked the *previous* day. Now built from local Y/M/D components. | `frontend/src/components/SlotPicker.jsx` |
| 7 | Booked-slot endpoint (already built in v2) is now actually wired up — taken time slots are greyed out and disabled in the picker | `frontend/src/components/SlotPicker.jsx`, `frontend/src/api/appointments.js`, `DoctorDetail.jsx` |
| 8 | Profile "Save Changes" used to write to an unused `localStorage` key and never really persisted. Added a real `PATCH /api/auth/me` endpoint and wired the page to it. | `backend/routes/auth.js`, `frontend/src/api/auth.js`, `frontend/src/pages/Profile.jsx` |
| 9 | Doctor photos uploaded via the admin panel (`/uploads/...`) resolved correctly on the doctor grid but 404'd on Doctor Detail / My Appointments / Payment. Added one shared `resolveImageUrl()` helper (env-driven, no hardcoded host) used everywhere. | `frontend/src/utils/imageUrl.js`, `admin/src/utils/imageUrl.js` + pages using doctor images |
| 10 | Payment page now clearly labeled **Demo Payment** throughout (banner, processing overlay, success screen, demo transaction ID) — copy no longer implies real SSL/encryption processing | `frontend/src/pages/Payment.jsx` |
| 11 | `SETUP.md` said the admin panel runs on port 3001; it actually runs on 5174 (matches `vite.config.js`) | `SETUP.md` |

## 🔧 Fixes Applied (v4)

| # | Fix | Where |
|---|-----|-------|
| 12 | **The big one:** the axios response interceptor redirected to `/login` (patient app) or `/` (admin) on *every* 401, including a failed login/register attempt itself. Result: entering a wrong password triggered a full page reload before the "Invalid credentials" message could ever be shown. Interceptor now only auto-logs-out on a 401 from a request that actually carried an auth token (i.e. an expired session), not on a plain login attempt. | `frontend/src/api/axiosInstance.js`, `admin/src/api/admin.js` |
| 13 | `getAllDoctors()` / `getDoctorById()` silently fell back to bundled mock data on **any** error, including real 500s from the backend — which could hide genuine bugs behind what looked like a normal doctor list. Now only falls back when the backend is unreachable (network error); real backend errors are thrown and surfaced by the existing loading/error UI (fix #4). | `frontend/src/api/doctors.js` |
| 14 | Stale `http://localhost:3001` entry left in the backend's CORS allow-list from before fix #11 corrected the admin panel's actual port (5174). Removed. | `backend/app.js` |
| 15 | `.env` files (with placeholder secrets) were being shipped inside the project zip despite `.gitignore` excluding them from git. Removed from the distributed copy — use `.env.example` as the template, per the existing setup instructions. | `backend/`, `frontend/`, `admin/` |

## 🔧 Fixes Applied (v5)

| # | Fix | Where |
|---|-----|-------|
| 16 | **"Related Doctors" was pulling from a completely different, leftover dataset.** The doctor profile itself loaded from the real database (e.g. "Dr. Arjun Sharma"), but the Related Doctors section below it hardcoded an import of `frontend/src/data/doctors.js` — an old mock file with different (English) names — and filtered *that* by specialty. Because both datasets reuse the same image filenames (`doc1.png`...`doc14.png`) for different people, the same photo showed up under two different names depending on which section of the page you were looking at. Related Doctors now queries the same real doctor list (`getAllDoctors()`) the rest of the app uses, filtered by specialty and excluding the current doctor, so it always matches what's actually in the database — including correctly showing only 1 related doctor per specialty (2 doctors seeded per specialty, minus the one currently open), instead of a fake count of 2–3 borrowed from the old mock file. | `frontend/src/pages/DoctorDetail.jsx` |

## 🔧 Fixes Applied (v6)

| # | Fix | Where |
|---|-----|-------|
| 17 | **No limit on appointments per day.** The only conflict check was per doctor+date+time slot, so a user could book several appointments on the same date — with different doctors, or even the same doctor at different times. Added a check: a user can have at most one active (pending/confirmed) appointment per calendar date; booking a second one on a date that already has an active appointment now returns a clear error naming the existing doctor. A cancelled appointment doesn't count, so the user can freely rebook that day after cancelling. | `backend/routes/appointments.js` |

## 🔧 Fixes Applied (v7 — post-audit)

| # | Fix | Where |
|---|-----|-------|
| 18 | **Home page search did nothing.** The search bar linked to `/doctors?search=...`, but the Doctors page never read that query param — only `speciality`. Now seeded from the URL on load. | `frontend/src/pages/Doctors.jsx` |
| 19 | **Malformed IDs returned raw 500s.** `GET /api/doctors/:id` and `PATCH /api/appointments/:id/status` passed any string straight to `findById()`, so a non-ObjectId id (or a stale/typo'd link) threw an uncaught Mongoose CastError, leaking an internal error message with a 500. Both now validate the 24-char hex ObjectId format first and return a clean 404. | `backend/routes/doctors.js`, `backend/routes/appointments.js` |
| 20 | **No past-date/past-time validation, anywhere.** The backend accepted a booking for any date/time string, including the past. The calendar already disabled past *dates*, but not already-passed *time slots* on today's date. Added a same-day-and-later-than-now check on both the backend (source of truth) and the slot picker (so the greyed-out UI matches what the API will actually accept). | `backend/routes/appointments.js`, `frontend/src/components/SlotPicker.jsx` |
| 21 | **Double-booking race condition.** The only protection against two people booking the same doctor/date/time was an app-level `findOne()` check before `create()` — a check-then-act race with no atomicity, so two near-simultaneous requests could both pass the check and both succeed. Added a partial unique index on `{doctorId, date, time}` (scoped to active statuses only, so cancelled slots remain freely rebookable) so MongoDB itself rejects the second write; the resulting duplicate-key error is caught and returned as the same clean 409 a sequential conflict gets. | `backend/models/Appointment.js`, `backend/routes/appointments.js` |
| 22 | **Two seeded doctor bios used the wrong pronoun** for the doctor's name (Dr. Gaurav Iyer, Dr. Raj Desai — both male names, both described as "She"). Corrected; re-run `node seeder.js` to pick this up. | `backend/seeder.js` |
| 23 | **Admin couldn't activate/deactivate users from the UI**, even though the backend endpoint (`PATCH /api/admin/users/:id/status`) and its API wrapper already existed — the Users page only displayed the status badge with no control to change it. Added an Activate/Deactivate button per row. | `admin/src/pages/Users.jsx` |
