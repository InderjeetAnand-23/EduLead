const mongoose = require('mongoose');
const jsonDb = require('../config/jsonDb');

const leadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  courseInterested: {
    type: String,
    required: [true, 'Course interested is required'],
    trim: true
  },
  budget: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  leadSource: {
    type: String,
    trim: true,
    default: 'Website Inquiry Form'
  },
  status: {
    type: String,
    enum: [
      'New Inquiry',
      'Contacted',
      'Interested',
      'Documents Pending',
      'Documents Verified',
      'Application Submitted',
      'Offer Letter Issued',
      'Fee Pending',
      'Admitted',
      'Rejected',
      'Not Interested'
    ],
    default: 'New Inquiry'
  },
  followUpDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index fields for fast search lookup on name, email, phone, country, and course
leadSchema.index({ fullName: 'text', email: 'text', phone: 'text', country: 'text', courseInterested: 'text' });

const MongooseLead = mongoose.model('Lead', leadSchema);

// Create a wrapper proxy that intercepts database operations
const LeadProxy = new Proxy(MongooseLead, {
  get(target, prop, receiver) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.get(jsonDb.Lead, prop, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
  construct(target, args, newTarget) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.construct(jsonDb.Lead, args, newTarget);
    }
    return Reflect.construct(target, args, newTarget);
  }
});

module.exports = LeadProxy;

