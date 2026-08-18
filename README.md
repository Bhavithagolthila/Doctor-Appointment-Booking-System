# MediCare — Doctor Appointment Booking System

MediCare is a full-stack doctor appointment booking application that allows
patients to register, log in, browse doctors, select available appointment
slots, complete a demo payment, and manage appointments.
It also includes an admin dashboard for managing users, doctors, and
appointments.

> **Note:** Payment and refund features are demo only. No real money is
> charged or refunded.

## Features
- Patient registration and login
- Input validation and bcrypt password hashing
- JWT authentication and protected routes
- Browse doctors and view doctor details
- Appointment slot selection and booking
- Demo payment and appointment confirmation
- View and cancel eligible appointments
- Patient profile management
- Admin dashboard for users, doctors, and appointments
- Double-booking prevention and appointment validation

## Technology Stack
- **Frontend:** React, Vite, JavaScript, CSS, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt

## Application Flow
Register → Login → Browse Doctors → Select Doctor
→ Select Date & Slot → Demo Payment → Appointment Confirmation
→ My Appointments → Logout

Admin Flow
Admin Login → Dashboard → Manage Users / Doctors / Appointments → Logout

## Credentials

- **Admin Panel (localhost:5174):** `admin@medicare.com` / `admin123`
- **Test Patient:** Register at `localhost:5173/register` using an Indian
  phone number with 10 digits, starting with 6, 7, 8, or 9.

> **Warning:** These are demo credentials for local testing only. Change the
> admin password in `backend/seeder.js` before any public deployment.

## Architecture
React Frontend
      ↓
REST APIs
      ↓
Node.js + Express.js
      ↓
MongoDB

## Security
- bcrypt password hashing
- JWT authentication
- Protected routes
- Server-side validation
- Role-based admin authorization
- User ownership checks
- Double-booking protection
- NoSQL injection protection
- Login rate limiting

## Run Locally

### Prerequisites

- MongoDB must be running locally (or `MONGO_URI` updated to point elsewhere)
- Copy `.env.example` to `.env` in `backend/`, `frontend/`, and `admin/`
- Run `node seeder.js` once inside `backend/` to seed the database

### Backend
cd backend
npm install
npm run dev

### Frontend
cd frontend
npm install
npm run dev

### Admin
cd admin
npm install
npm run dev

Configure the required MongoDB, JWT, and API URL environment variables using
the provided `.env.example` files.