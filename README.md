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
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_USER` = your Gmail address
   - `EMAIL_PASS` = your Gmail App Password *(see below)*
   - `EMAIL_FROM` = `EduLead <yourgmail@gmail.com>`
   - `APP_URL` = your Render app URL (e.g. `https://edulead.onrender.com`)
4. Build command: `npm install`
5. Start command: `npm start`
6. Run `node seed.js` once to create the admin account

---

## 📧 Email Notification System

EduLead automatically sends HTML email notifications using **Nodemailer** for key admission events.

### Emails Sent

| Trigger | Subject | Recipient |
|---------|---------|-----------|
| Student registers | `Welcome to EduLead` | New student |
| Student submits inquiry | `Admission Inquiry Received - EduLead` | Student |
| Counsellor updates lead status | `Admission Status Updated - EduLead` | Student |

### Environment Variables Required

Add these to your `.env` file (copy from `.env.example`):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_google_app_password
EMAIL_FROM=EduLead <yourgmail@gmail.com>

# Optional: for email CTA links to point to the correct URL
APP_URL=https://your-edulead-app.onrender.com
```

> ⚠️ **NEVER** commit your real `.env` file. It is already listed in `.gitignore`.

### Gmail App Password Setup

Standard Gmail passwords will **not** work with SMTP. You must create an **App Password**:

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Search for **"App passwords"** in the search bar
4. Select App: **Mail** → Device: **Other** (type "EduLead")
5. Click **Generate** — copy the 16-character password
6. Paste it as `EMAIL_PASS` in your `.env` file

### Fail-Safe Design

- If `EMAIL_USER` or `EMAIL_PASS` are not configured, the system **skips** sending emails silently (logs a warning only).
- If an email send fails for any reason (network error, wrong password, etc.), the app **continues normally** — registration, inquiry submission, and status updates are **never blocked**.
- All email errors are logged to the console with the prefix `[EduLead Email]` for easy filtering.

### Email Utility Location

```
utils/
└── sendEmail.js     ← Nodemailer config + HTML templates (Welcome, Inquiry, Status Update)
```
