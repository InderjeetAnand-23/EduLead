const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfLoggedIn } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ADMIN REGISTRATION IS DISABLED FOR SECURITY.
// Use the seed script to create the default counsellor account:
//   node seed.js
// Default login: admin@edulead.com / admin123
// ─────────────────────────────────────────────────────────────────────────────

// Redirect /auth/register to login — registration is closed
router.get('/register', (req, res) => {
  res.redirect('/auth/login?error=Public+registration+is+disabled.+Contact+your+system+administrator.');
});
router.post('/register', (req, res) => {
  res.redirect('/auth/login?error=Public+registration+is+disabled.+Contact+your+system+administrator.');
});

// Login routes
router.get('/login', redirectIfLoggedIn, authController.getLogin);
router.post('/login', redirectIfLoggedIn, authController.postLogin);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;
