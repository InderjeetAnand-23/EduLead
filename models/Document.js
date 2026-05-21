const mongoose = require('mongoose');
const jsonDb = require('../config/jsonDb');

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

const MongooseDocument = mongoose.model('Document', documentSchema);

// Wrapper proxy that intercepts database operations for fallback JSON database
const DocumentProxy = new Proxy(MongooseDocument, {
  get(target, prop, receiver) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.get(jsonDb.Document, prop, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
  construct(target, args, newTarget) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.construct(jsonDb.Document, args, newTarget);
    }
    return Reflect.construct(target, args, newTarget);
  }
});

module.exports = DocumentProxy;
