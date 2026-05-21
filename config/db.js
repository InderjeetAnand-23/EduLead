const mongoose = require('mongoose');
const { seedJsonDatabase } = require('./jsonSeeder');

// Default database mode is 'jsonfile' for high-reliability out-of-the-box experience
global.dbMode = 'jsonfile';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/admission-crm';
    console.log('Connecting to MongoDB database...');
    
    // Set a 3-second timeout to prevent long server hangs if local MongoDB isn't running
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    global.dbMode = 'mongodb';
  } catch (error) {
    console.error('==================================================================');
    console.error('⚠️  DATABASE CONNECTION WARNING:');
    console.error(`Could not connect to MongoDB: ${error.message}`);
    console.error('EduLead will run in robust OFFLINE mode using Local JSON storage.');
    console.error('All data actions will save to the "/data" directory successfully!');
    console.error('==================================================================');
    global.dbMode = 'jsonfile';
  } finally {
    if (global.dbMode === 'jsonfile') {
      await seedJsonDatabase();
    }
  }
};

module.exports = connectDB;

