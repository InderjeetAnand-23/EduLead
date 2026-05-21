const express = require('express');
const router = express.Router();
const studentAuthController = require('../controllers/studentAuthController');
const leadController = require('../controllers/leadController');
const { requireStudentAuth, redirectIfStudentLoggedIn } = require('../middleware/authMiddleware');

// Student Auth GET/POST Routes
router.get('/student/register', redirectIfStudentLoggedIn, studentAuthController.getRegister);
router.post('/student/register', redirectIfStudentLoggedIn, studentAuthController.postRegister);

router.get('/student/login', redirectIfStudentLoggedIn, studentAuthController.getLogin);
router.post('/student/login', redirectIfStudentLoggedIn, studentAuthController.postLogin);

router.get('/student/logout', studentAuthController.logout);

// Student Inquiry Status Dashboard
router.get('/my-inquiry-status', requireStudentAuth, leadController.getInquiryStatus);

module.exports = router;
