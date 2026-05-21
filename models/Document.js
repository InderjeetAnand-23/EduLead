const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  documentType: {
    type: String,
    required: true,
    enum: ['passport', 'marksheet', 'id_proof', 'offer_letter', 'other']
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  status: {
    type: String,
    enum: ['uploaded', 'verified', 'rejected'],
    default: 'uploaded'
  },
  adminNote: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Document', documentSchema);
