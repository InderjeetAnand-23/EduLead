require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const Lead = require('./models/Lead');

const mockLeads = [
  {
    fullName: 'Sophia Rodriguez',
    email: 'sophia.r@example.com',
    phone: '+1 305 555 0192',
    country: 'United States',
    courseInterested: 'Data Science & Artificial Intelligence',
    budget: '$18,000',
    qualification: 'High School Diploma (GPA 3.8)',
    leadSource: 'Social Media Campaign',
    status: 'New Inquiry',
    notes: 'Inquired about scholarship opportunities for foreign nationals. Outstanding high school records.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    fullName: 'Arjun Mehta',
    email: 'arjun.mehta@example.in',
    phone: '+91 98250 12345',
    country: 'India',
    courseInterested: 'Computer Science & Engineering',
    budget: '$12,000',
    qualification: 'Bachelor of Computer Applications (78%)',
    leadSource: 'Direct Walk-in',
    status: 'Interested',
    notes: 'Walked into the Delhi counseling office. Highly interested in the fall intake. Shared curriculum brochure.',
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    fullName: 'Fatima Al-Sayed',
    email: 'fatima.as@example.ae',
    phone: '+971 50 123 4567',
    country: 'United Arab Emirates',
    courseInterested: 'Business Administration (MBA)',
    budget: '$25,000',
    qualification: 'B.Com from UAE University',
    leadSource: 'Email Newsletter',
    status: 'Contacted',
    notes: 'Sent initial enrollment pack via email. Spoke on call; requested details regarding weekend executive classes.',
    followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Kenji Sato',
    email: 'kenji.sato@example.jp',
    phone: '+81 90 5555 6789',
    country: 'Japan',
    courseInterested: 'Computer Science & Engineering',
    budget: '$15,000',
    qualification: 'Diploma in Web Development',
    leadSource: 'Website Inquiry Form',
    status: 'Documents Pending',
    notes: 'Student applied but IELTS test scorecard and final transcript are pending. Emailed reminders.',
    followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue by 1 day
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Chinedu Okafor',
    email: 'chinedu.o@example.ng',
    phone: '+234 803 111 2222',
    country: 'Nigeria',
    courseInterested: 'Information Technology',
    budget: '$10,000',
    qualification: 'WAEC Certificate',
    leadSource: 'Educational Fair',
    status: 'Application Submitted',
    notes: 'Submitted complete application form online. Transcripts verified by evaluation team. Sent to admission committee.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Amelie Dubois',
    email: 'amelie.d@example.fr',
    phone: '+33 6 5555 0143',
    country: 'France',
    courseInterested: 'Biotechnology',
    budget: '$16,000',
    qualification: 'French Baccalaureate',
    leadSource: 'Website Inquiry Form',
    status: 'Admitted',
    notes: 'Offer letter issued! Tuition deposit received. Visas documents issued and sent for embassy clearance.',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Carlos Gomez',
    email: 'carlos.g@example.mx',
    phone: '+52 55 5555 0199',
    country: 'Mexico',
    courseInterested: 'Business Administration (MBA)',
    budget: '$20,000',
    qualification: 'BBA from Tec de Monterrey',
    leadSource: 'Agency Referral',
    status: 'Admitted',
    notes: 'Visa approved. Flight ticket booked for September 4th. Accommodation sorted in university hostel.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Elena Petrova',
    email: 'elena.p@example.com',
    phone: '+7 901 555 4321',
    country: 'Kazakhstan',
    courseInterested: 'Data Science & Artificial Intelligence',
    budget: '$14,000',
    qualification: 'B.Sc Statistics',
    leadSource: 'Social Media Campaign',
    status: 'Interested',
    notes: 'Very strong mathematics profile. Needs financial loan documents. Follow up to help with financing process.',
    followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Hans Müller',
    email: 'hans.m@example.de',
    phone: '+49 170 5555 432',
    country: 'Germany',
    courseInterested: 'Mechanical Engineering',
    budget: '$15,000',
    qualification: 'Abitur (1.4 score)',
    leadSource: 'Educational Fair',
    status: 'Rejected',
    notes: 'Academic background does not meet basic mechanical mathematics prerequisites. Application formally rejected.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    fullName: 'Sarah Jenkins',
    email: 'sarah.j@example.co.uk',
    phone: '+44 7700 900077',
    country: 'United Kingdom',
    courseInterested: 'Biotechnology',
    budget: '$22,000',
    qualification: 'A-Levels (AAA)',
    leadSource: 'Website Inquiry Form',
    status: 'Not Interested',
    notes: 'Opted to accept a scholarship offer from a local UK university. Closed lead.',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  }
];

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/admission-crm';
    console.log(`Connecting to database for seeding: ${connStr}`);
    await mongoose.connect(connStr);

    // 1. Clear existing data
    console.log('Clearing existing collections...');
    await Admin.deleteMany({});
    await Lead.deleteMany({});

    // 2. Create Default Admin Credentials
    console.log('Creating demo admin account...');
    const adminEmail = process.env.ADMIN_EMAIL || 'vansh@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'vansh';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const demoAdmin = new Admin({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword
    });
    await demoAdmin.save();

    // 3. Create Mock Leads
    console.log(`Seeding ${mockLeads.length} realistic student lead profiles...`);
    await Lead.insertMany(mockLeads);

    console.log('\n======================================================');
    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨');
    console.log('You can now log in using these credentials:');
    console.log(`👉 Corporate Email:  ${adminEmail}`);
    console.log(`👉 Secure Password:   ${adminPassword}`);
    console.log('======================================================');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDatabase();
