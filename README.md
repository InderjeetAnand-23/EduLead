# EduLead CRM — Admission Lead Management System

A modern, full-stack CRM web application for academic admission teams to capture student inquiries, track follow-ups, manage pipelines, and view analytics.

---

## Default Admin Login

> **Public registration is disabled for security. The counsellor/admin account is created via seed script only.**

### Step 1 — Seed the Database (First time only)
```bash
node seed.js
```
This creates the default admin account and 10 sample student leads.

### Step 2 — Login Credentials
| Field    | Value               |
|----------|---------------------|
| Email    | `admin@edulead.com` |
| Password | `admin123`          |

Login at: **http://localhost:5000/auth/login**

---

## Security Model

| Rule | Details |
|------|---------|
| Public registration | **Disabled** — `/auth/register` redirects to login |
| Admin creation | Only via `node seed.js` |
| Student vs Admin sessions | Completely independent |
| Student accessing `/dashboard` | Blocked → redirected to `/auth/login` with "Access denied" |
| Route protection | All `/dashboard`, `/leads/*` require `blockStudentFromAdmin` + `requireAuth` |

---

## Project Structure

```text
├── config/
│   ├── db.js                     # MongoDB connection (JSON fallback if offline)
│   ├── jsonDb.js                 # Local JSON file database engine
│   └── jsonSeeder.js             # Auto-seeder for offline mode
├── controllers/
│   ├── authController.js         # Admin login/logout
│   ├── leadController.js         # CRM CRUD, analytics, inquiry
│   └── studentAuthController.js  # Student register/login/logout
├── middleware/
│   └── authMiddleware.js         # requireAuth, requireStudentAuth,
│                                 # blockStudentFromAdmin, globalLocals
├── models/
│   ├── Admin.js                  # Admin schema
│   ├── Lead.js                   # Lead schema
│   └── Student.js                # Student schema
├── routes/
│   ├── authRoutes.js             # /auth/login, /auth/logout (register disabled)
│   ├── leadRoutes.js             # Public + admin-protected CRM routes
│   └── studentRoutes.js          # Student register/login/logout/status
├── views/
│   ├── partials/
│   │   ├── header.ejs            # Navbar (light public / admin-theme for dashboard)
│   │   └── footer.ejs
│   ├── dashboard.ejs             # Admin analytics panel
│   ├── leads.ejs                 # Lead table with search/filter
│   ├── leadDetails.ejs           # Lead dossier and timeline
│   ├── addLead.ejs               # Manual lead entry form
│   ├── editLead.ejs              # Lead edit form
│   ├── index.ejs                 # Student landing page
│   ├── inquiry.ejs               # Student inquiry form (student login required)
│   ├── login.ejs                 # Counsellor login
│   ├── student-login.ejs         # Student login
│   ├── student-register.ejs      # Student register
│   └── my-inquiry-status.ejs     # Student inquiry status page
├── seed.js                       # Seeder: creates admin + sample leads
├── .env                          # Environment variables
├── app.js                        # Server entry point
└── README.md
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Rename `.env.example` to `.env` and set:
```env
MONGO_URI=mongodb://127.0.0.1:27017/admission-crm
SESSION_SECRET=your_long_secret_key_here
PORT=5000
```

### 3. Seed the database
```bash
node seed.js
```

### 4. Start the server
```bash
npm start
```

Open **http://localhost:5000**

---

## User Roles

| Role | Access | Login URL |
|------|--------|-----------|
| **Student** | Landing page, inquiry form, inquiry status | `/student/login` |
| **Counsellor/Admin** | Dashboard, leads, analytics, add/edit/delete leads | `/auth/login` |

Students **cannot** access admin routes even with direct URL.
Admins **cannot** impersonate students.

---

## Security Testing Checklist

1. Login as student → try visiting `/dashboard` → should be blocked ("Access denied")
2. Visit `/auth/register` → should redirect to login with error
3. Enter wrong password at `/auth/login` → should show "Invalid email or password"
4. After logout, visit `/dashboard` → should redirect to `/auth/login`
5. Student submits inquiry → lead appears in admin dashboard
6. Admin edits lead status → updates in student's inquiry status page

---

## Deployment (Render)

1. Push project to GitHub
2. Create Web Service on [Render](https://render.com)
3. Set environment variables:
   - `MONGO_URI` = MongoDB Atlas connection string
   - `SESSION_SECRET` = a long random secret
   - `PORT` = 5000
4. Build command: `npm install`
5. Start command: `npm start`
6. Run `node seed.js` once to create the admin account
