require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const { globalLocals } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// EJS View Engine Configurations
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Support HTTP method overrides via "_method" query/body parameters
app.use(methodOverride('_method'));

// Expose public static folder
app.use(express.static(path.join(__dirname, 'public')));

const FileSessionStore = require('./config/sessionStore');

// Configure Express Session Storage
app.use(
  session({
    store: new FileSessionStore(),
    secret: process.env.SESSION_SECRET || 'admissions_lead_dashboard_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true when running on HTTPS (production)
      maxAge: 24 * 60 * 60 * 1000 // 1 day session lifecycle
    }
  })
);

// Inject global variables for EJS rendering (success/error alerts, admin sessions, routes)
app.use(globalLocals);

// Route mappings
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const leadRoutes = require('./routes/leadRoutes');
const documentRoutes = require('./routes/documentRoutes');

app.use('/auth', authRoutes);
app.use('/', studentRoutes);
app.use('/', leadRoutes);
app.use('/', documentRoutes);

// Global 404 Routing Fallback
app.use((req, res) => {
  res.status(404).render('index', {
    pageTitle: 'Page Not Found',
    error: 'The requested page or resource could not be found.',
    success: null
  });
});

// Run server
const server = app.listen(PORT, () => {
  console.log(`EduLead Server is active on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your web browser`);
});

// Handle port already in use gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use.`);
    console.error(`Run this command to fix it, then try again:\n`);
    console.error(`  PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
