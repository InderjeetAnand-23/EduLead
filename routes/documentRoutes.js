const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');
const {
  requireAuth,
  requireStudentAuth,
  blockStudentFromAdmin
} = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DOCUMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// View all documents
router.get('/my-documents', requireStudentAuth, documentController.getMyDocuments);

// Upload a document (multer processes the file, then controller saves to DB)
router.post(
  '/my-documents/upload',
  requireStudentAuth,
  (req, res, next) => {
    // Wrap multer to catch file size / type errors gracefully
    upload.single('documentFile')(req, res, (err) => {
      if (err) {
        const msg = encodeURIComponent(err.message || 'File upload error');
        return res.redirect(`/my-documents?error=${msg}`);
      }
      next();
    });
  },
  documentController.uploadDocument
);

// Delete a document
router.post('/my-documents/:id/delete', requireStudentAuth, documentController.deleteDocument);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DOCUMENT REVIEW ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Verify a document
router.post(
  '/admin/documents/:id/verify',
  blockStudentFromAdmin,
  requireAuth,
  documentController.adminVerifyDocument
);

// Reject a document
router.post(
  '/admin/documents/:id/reject',
  blockStudentFromAdmin,
  requireAuth,
  documentController.adminRejectDocument
);

module.exports = router;
