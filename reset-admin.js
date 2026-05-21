require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const { seedJsonDatabase } = require('./config/jsonSeeder');

const resetAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'vansh@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminUsername = process.env.ADMIN_USERNAME || 'vansh';

  console.log('--------------------------------------------------');
  console.log('🔄 STARTING SAFE ADMIN CREDENTIALS RESET...');
  console.log(`Target Username: ${adminUsername}`);
  console.log(`Target Email:    ${adminEmail}`);
  console.log('--------------------------------------------------');

  const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/admission-crm';
  let usingMongo = false;

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ Connected to MongoDB successfully.');
    global.dbMode = 'mongodb';
    usingMongo = true;
  } catch (error) {
    console.warn('⚠️  Could not connect to MongoDB. Falling back to local JSON storage.');
    global.dbMode = 'jsonfile';
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (usingMongo) {
      // MongoDB Update / Upsert
      let admin = await Admin.findOne({ email: adminEmail });

      if (admin) {
        console.log(`Found existing admin with email "${adminEmail}". Updating password...`);
        admin.password = hashedPassword;
        admin.username = adminUsername;
      } else {
        console.log(`No admin found with email "${adminEmail}". Creating a new admin account...`);
        admin = new Admin({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword
        });
      }

      await admin.save();
      console.log('✅ Admin credentials updated successfully in MongoDB Atlas.');
    } else {
      // Local JSON File Update / Upsert
      const { ADMINS_FILE, readData, writeData } = require('./config/jsonDb');
      const admins = readData(ADMINS_FILE);
      
      const adminIndex = admins.findIndex(a => a.email.toLowerCase() === adminEmail.toLowerCase());
      
      const updatedAdmin = {
        _id: adminIndex !== -1 ? admins[adminIndex]._id : 'admin_demo_1',
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        createdAt: adminIndex !== -1 ? admins[adminIndex].createdAt : new Date().toISOString()
      };

      if (adminIndex !== -1) {
        console.log(`Found existing admin in JSON file with email "${adminEmail}". Updating password...`);
        admins[adminIndex] = updatedAdmin;
      } else {
        console.log(`No admin found in JSON file with email "${adminEmail}". Creating new account...`);
        admins.push(updatedAdmin);
      }

      writeData(ADMINS_FILE, admins);
      console.log('✅ Admin credentials updated successfully in local JSON storage.');
    }

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: ADMIN CREDENTIALS SET SUCCESSFULLY!');
    console.log(`👉 Email:    ${adminEmail}`);
    console.log(`👉 Password: ${adminPassword}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error during admin reset:', err);
  } finally {
    if (usingMongo) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
};

resetAdmin();
