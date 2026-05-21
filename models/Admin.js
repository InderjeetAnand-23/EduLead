const mongoose = require('mongoose');
const jsonDb = require('../config/jsonDb');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
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

const MongooseAdmin = mongoose.model('Admin', adminSchema);

// Create a wrapper proxy that intercepts database operations
const AdminProxy = new Proxy(MongooseAdmin, {
  get(target, prop, receiver) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.get(jsonDb.Admin, prop, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
  construct(target, args, newTarget) {
    if (global.dbMode === 'jsonfile') {
      return Reflect.construct(jsonDb.Admin, args, newTarget);
    }
    return Reflect.construct(target, args, newTarget);
  }
});

module.exports = AdminProxy;

