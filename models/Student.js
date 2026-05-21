const mongoose = require('mongoose');
const jsonDb = require('../config/jsonDb');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseStudent = mongoose.model('Student', studentSchema);

// Wrapper proxy that intercepts database operations for fallback JSON database
const StudentProxy = new Proxy(MongooseStudent, {
  get(target, prop, receiver) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.get(jsonDb.Student, prop, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
  construct(target, args, newTarget) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.construct(jsonDb.Student, args, newTarget);
    }
    return Reflect.construct(target, args, newTarget);
  }
});

module.exports = StudentProxy;
