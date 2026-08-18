# 🚀 Setup Guide — Step by Step

## Prerequisites
- Node.js installed
- MongoDB running locally (MongoDB Compass is fine — just make sure the service is running)

---

## Step 1 — Start MongoDB
Open **MongoDB Compass** → click **Connect** (default `mongodb://localhost:27017`)
OR make sure the MongoDB Windows service is running (search "Services" → MongoDB).

---

## Step 2 — Backend Setup
Open a terminal in the `backend/` folder:

```bash
cd backend
npm install
node seeder.js
```
You should see:
```
MongoDB connected
Doctors seeded
Admin user seeded — email: admin@medicare.com / password: admin123
Done
```

Then start the backend:
```bash
node server.js
```
You should see: `Server running on port 5000` and `MongoDB connected`

**⚠️ Keep this terminal open!**

---

## Step 3 — Frontend (Patient App)
Open a NEW terminal in the `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```
Opens at → **http://localhost:5173**

---

## Step 4 — Admin Dashboard
Open a NEW terminal in the `admin/` folder:

```bash
cd admin
npm install
npm run dev
```
Opens at → **http://localhost:5174**

**Admin Login:**
- Email: `admin@medicare.com`
- Password: `admin123`

---

## Common Problems

| Problem | Fix |
|---------|-----|
| Admin login fails | Make sure `node seeder.js` was run in backend folder |
| 0 doctors showing | Make sure backend is running on port 5000 |
| MongoDB connection error | Start MongoDB service / open Compass and connect first |
| Port already in use | Close other terminals running the app |

