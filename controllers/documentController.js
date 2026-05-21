const Document = require('../models/Document');
const Lead = require('../models/Lead');
const path = require('path');
const fs = require('fs');

// Document type labels for display
const DOC_LABELS = {
  passport:     { label: 'Passport', icon: 'bi-passport' },
  marksheet:    { label: 'Marksheet / Transcript', icon: 'bi-file-earmark-text' },
  id_proof:     { label: 'ID Proof', icon: 'bi-person-badge' },
  offer_letter: { label: 'Offer Letter', icon: 'bi-envelope-paper' },
  other:        { label: 'Other Document', icon: 'bi-paperclip' }
};

const DOC_TYPES = ['passport', 'marksheet', 'id_proof', 'offer_letter', 'other'];

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: View all uploaded documents
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyDocuments = async (req, res) => {
  try {
    const studentId = req.session.studentId;

    // Get all documents for this student
    const docs = await Document.find({ studentId }).sort({ uploadedAt: -1 });

    // Build a map: documentType → array of docs
    const docsByType = {};
    DOC_TYPES.forEach(type => {
      docsByType[type] = docs.filter(d => d.documentType === type);
    });

    res.render('myDocuments', {
      pageTitle: 'My Documents — EduLead',
      docsByType,
      docLabels: DOC_LABELS,
      docTypes: DOC_TYPES,
      student: req.student
    });
  } catch (err) {
    console.error('getMyDocuments error:', err);
    res.render('myDocuments', {
      pageTitle: 'My Documents — EduLead',
      docsByType: {},
      docLabels: DOC_LABELS,
      docTypes: DOC_TYPES,
      student: req.student,
      error: 'Could not load documents. Please try again.'
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: Upload a document
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/my-documents?error=No+file+was+uploaded');
    }

    const { documentType } = req.body;
    if (!DOC_TYPES.includes(documentType)) {
      return res.redirect('/my-documents?error=Invalid+document+type');
    }

    const studentId = req.session.studentId;

    // Try to find the student's latest lead to link the document
    let leadId = null;
    try {
      const lead = await Lead.findOne({ email: req.session.studentEmail }).sort({ createdAt: -1 });
      if (lead) leadId = lead._id;
    } catch (_) {}

    // Save document record
    const doc = new Document({
      studentId,
      leadId,
      documentType,
      originalName: req.file.originalname,
      filePath: `uploads/documents/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'uploaded'
    });

    await doc.save();

    res.redirect('/my-documents?success=Document+uploaded+successfully');
  } catch (err) {
    console.error('uploadDocument error:', err);
    // Clean up uploaded file if DB save failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
    res.redirect('/my-documents?error=Upload+failed.+Please+try+again.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: Delete their own document (only uploaded/rejected)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteDocument = async (req, res) => {
  try {
    const studentId = req.session.studentId;
    const doc = await Document.findOne({ _id: req.params.id, studentId });

    if (!doc) {
      return res.redirect('/my-documents?error=Document+not+found');
    }

    if (doc.status === 'verified') {
      return res.redirect('/my-documents?error=Verified+documents+cannot+be+deleted');
    }

    // Delete physical file
    const fullPath = path.join(__dirname, '../public', doc.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await Document.deleteOne({ _id: doc._id });
    res.redirect('/my-documents?success=Document+deleted+successfully');
  } catch (err) {
    console.error('deleteDocument error:', err);
    res.redirect('/my-documents?error=Could+not+delete+document');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Verify a document
// ─────────────────────────────────────────────────────────────────────────────
exports.adminVerifyDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.redirect('back');

    doc.status = 'verified';
    doc.adminNote = req.body.adminNote || '';
    doc.reviewedAt = new Date();
    await doc.save();

    // Redirect back to lead details if leadId available
    if (doc.leadId) {
      return res.redirect(`/leads/${doc.leadId}?success=Document+verified+successfully`);
    }
    res.redirect('/leads');
  } catch (err) {
    console.error('adminVerifyDocument error:', err);
    res.redirect('back');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Reject a document
// ─────────────────────────────────────────────────────────────────────────────
exports.adminRejectDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.redirect('back');

    doc.status = 'rejected';
    doc.adminNote = req.body.adminNote || 'Document rejected. Please re-upload.';
    doc.reviewedAt = new Date();
    await doc.save();

    if (doc.leadId) {
      return res.redirect(`/leads/${doc.leadId}?success=Document+rejected+with+reason`);
    }
    res.redirect('/leads');
  } catch (err) {
    console.error('adminRejectDocument error:', err);
    res.redirect('back');
  }
};
