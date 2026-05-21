const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const {
  requireAuth,
  requireStudentAuth,
  blockStudentFromAdmin
} = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', leadController.renderLanding);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT-PROTECTED ROUTES (student session required)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/inquiry', requireStudentAuth, leadController.renderInquiryForm);
router.post('/inquire', requireStudentAuth, leadController.submitInquiry);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN/COUNSELLOR-PROTECTED ROUTES
// blockStudentFromAdmin: ensures a logged-in student cannot access these URLs
// requireAuth: ensures a valid admin session exists
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard',      blockStudentFromAdmin, requireAuth, leadController.renderDashboard);
router.get('/leads',          blockStudentFromAdmin, requireAuth, leadController.renderLeads);
router.get('/leads/add',      blockStudentFromAdmin, requireAuth, leadController.renderAddForm);
router.post('/leads',         blockStudentFromAdmin, requireAuth, leadController.createLead);
router.get('/leads/export',   blockStudentFromAdmin, requireAuth, leadController.exportLeads);
router.get('/leads/:id',      blockStudentFromAdmin, requireAuth, leadController.renderLeadDetails);
router.get('/leads/:id/edit', blockStudentFromAdmin, requireAuth, leadController.renderEditForm);
router.put('/leads/:id',      blockStudentFromAdmin, requireAuth, leadController.updateLead);
router.post('/leads/:id/status', blockStudentFromAdmin, requireAuth, leadController.updateStatus);
router.delete('/leads/:id',   blockStudentFromAdmin, requireAuth, leadController.deleteLead);

module.exports = router;
