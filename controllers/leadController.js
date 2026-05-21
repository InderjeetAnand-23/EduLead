const Lead = require('../models/Lead');
const Document = require('../models/Document');
const { sendEmail, buildInquiryEmail, buildStatusUpdateEmail } = require('../utils/sendEmail');

// 1. Render Landing Page
exports.renderLanding = (req, res) => {
  res.render('index', {
    pageTitle: 'Welcome | Admission Portal',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// 1b. Render Standalone Inquiry Form Page (Student Protected)
exports.renderInquiryForm = (req, res) => {
  res.render('inquiry', {
    pageTitle: 'Submit Inquiry | EduLead',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// 2. Submit Inquiry Form (Student Protected Route)
exports.submitInquiry = async (req, res) => {
  // student is guaranteed to be set by requireStudentAuth middleware
  const studentEmail = req.session.studentEmail;
  const studentName  = req.session.studentName;
  const studentPhone = req.session.studentPhone;

  const {
    country,
    courseInterested,
    budget,
    qualification,
    notes
  } = req.body;

  // Use session data for identity fields
  const fullName = req.body.fullName || studentName;
  const email    = req.body.email    || studentEmail;
  const phone    = req.body.phone    || studentPhone;

  if (!fullName || !email || !phone || !country || !courseInterested) {
    return res.redirect('/inquiry?error=Please%20fill%20all%20required%20fields');
  }

  try {
    const newLead = new Lead({
      fullName,
      email,
      phone,
      country,
      courseInterested,
      budget,
      qualification,
      leadSource: 'Website Inquiry Form',
      status: 'New Inquiry',
      notes: notes || 'Student submitted inquiry from landing page.'
    });

    await newLead.save();

    // Send inquiry confirmation email (non-blocking)
    try {
      await sendEmail({
        to: email,
        subject: 'Admission Inquiry Received - EduLead',
        html: buildInquiryEmail(fullName, courseInterested, newLead._id)
      });
    } catch (emailErr) {
      console.error('[EduLead Email] Inquiry confirmation email failed (submission continues):', emailErr.message);
    }

    res.redirect('/my-inquiry-status?success=Thank%20you!%20Your%20inquiry%20has%20been%20submitted%20successfully.');
  } catch (error) {
    console.error('Inquiry submission error:', error);
    res.redirect('/inquiry?error=Something%20went%20wrong.%20Please%20try%20again.');
  }
};

// 3. Render Admin Dashboard (Protected Route)
exports.renderDashboard = async (req, res) => {
  try {
    // Count stats for all pipeline phases
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'New Inquiry' });
    const contactedLeads = await Lead.countDocuments({ status: 'Contacted' });
    const interestedLeads = await Lead.countDocuments({ status: 'Interested' });
    const pendingDocsLeads = await Lead.countDocuments({ status: 'Documents Pending' });
    const verifiedDocsLeads = await Lead.countDocuments({ status: 'Documents Verified' });
    const submittedAppLeads = await Lead.countDocuments({ status: 'Application Submitted' });
    const issuedOfferLeads = await Lead.countDocuments({ status: 'Offer Letter Issued' });
    const pendingFeeLeads = await Lead.countDocuments({ status: 'Fee Pending' });
    const admittedLeads = await Lead.countDocuments({ status: 'Admitted' });
    const rejectedLeads = await Lead.countDocuments({ status: 'Rejected' });
    const notInterestedLeads = await Lead.countDocuments({ status: 'Not Interested' });
    
    // Pending follow-ups
    const pendingFollowUps = await Lead.countDocuments({
      followUpDate: { $ne: null },
      status: { $nin: ['Admitted', 'Rejected', 'Not Interested'] }
    });

    // Mongoose Aggregation: Group leads by course and count total frequency
    const courseStats = await Lead.aggregate([
      { $group: { _id: '$courseInterested', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent 5 leads
    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming 5 follow-ups
    const upcomingFollowUps = await Lead.find({
      followUpDate: { $ne: null },
      status: { $nin: ['Admitted', 'Rejected', 'Not Interested'] }
    })
      .sort({ followUpDate: 1 })
      .limit(5);

    res.render('dashboard', {
      pageTitle: 'Dashboard | EduLead',
      stats: {
        totalLeads,
        newLeads,
        contactedLeads,
        interestedLeads,
        pendingDocsLeads,
        verifiedDocsLeads,
        submittedAppLeads,
        issuedOfferLeads,
        pendingFeeLeads,
        admittedLeads,
        rejectedLeads,
        notInterestedLeads,
        pendingFollowUps
      },
      courseStats,
      recentLeads,
      upcomingFollowUps
    });
  } catch (error) {
    console.error('Dashboard loading error:', error);
    res.status(500).send('Internal Server Error in Dashboard Statistics');
  }
};

// 4. View All Leads (with Search & Filters, Protected)
exports.renderLeads = async (req, res) => {
  try {
    const { search, status, course } = req.query;
    const query = {};

    // Apply Search filter (matches name, email, phone, country, or course)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { country: searchRegex },
        { courseInterested: searchRegex }
      ];
    }

    // Apply Status filter
    if (status && status !== '') {
      query.status = status;
    }

    // Apply Course filter
    if (course && course !== '') {
      query.courseInterested = course;
    }

    // Fetch matching leads
    const leads = await Lead.find(query).sort({ createdAt: -1 });

    // Fetch unique courses in database for filter select box dropdowns
    const distinctCourses = await Lead.distinct('courseInterested');

    res.render('leads', {
      pageTitle: 'Manage Leads | EduLead',
      leads,
      distinctCourses,
      filters: {
        search: search || '',
        status: status || '',
        course: course || ''
      }
    });
  } catch (error) {
    console.error('Leads fetching error:', error);
    res.status(500).send('Error retrieving student leads data');
  }
};

// 5. Render Add Lead Form (Protected)
exports.renderAddForm = (req, res) => {
  res.render('addLead', {
    pageTitle: 'Add New Lead | EduLead',
    error: null
  });
};

// 6. Create Lead Manually (Protected)
exports.createLead = async (req, res) => {
  const {
    fullName,
    email,
    phone,
    country,
    courseInterested,
    budget,
    qualification,
    leadSource,
    status,
    followUpDate,
    notes
  } = req.body;

  if (!fullName || !email || !phone || !country || !courseInterested) {
    return res.render('addLead', {
      pageTitle: 'Add New Lead | EduLead',
      error: 'Please fill in all required fields marked with *'
    });
  }

  try {
    const parsedFollowUpDate = followUpDate && followUpDate !== '' ? new Date(followUpDate) : null;
    
    const newLead = new Lead({
      fullName,
      email,
      phone,
      country,
      courseInterested,
      budget,
      qualification,
      leadSource: leadSource || 'Manual Entry',
      status: status || 'New Inquiry',
      followUpDate: parsedFollowUpDate,
      notes: notes || 'Lead added manually by Admin.'
    });

    await newLead.save();
    req.session.success = `Lead "${fullName}" has been created successfully.`;
    res.redirect('/leads');
  } catch (error) {
    console.error('Lead manual creation error:', error);
    res.render('addLead', {
      pageTitle: 'Add New Lead | EduLead',
      error: 'Error creating student lead. Please verify input data types.'
    });
  }
};

// 7. View Lead Details (Protected)
exports.renderLeadDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await Lead.findById(id);
    if (!lead) {
      req.session.error = 'Student lead not found.';
      return res.redirect('/leads');
    }

    // Fetch documents linked to this lead, or by student email match
    let documents = [];
    try {
      documents = await Document.find({ leadId: lead._id }).sort({ uploadedAt: -1 });
      // If none found by leadId, try matching by email (student may have uploaded before inquiry)
      if (documents.length === 0 && global.dbMode !== 'jsonfile') {
        const Student = require('../models/Student');
        const student = await Student.findOne({ email: lead.email });
        if (student) {
          documents = await Document.find({ studentId: student._id }).sort({ uploadedAt: -1 });
        }
      }
    } catch (_) {}

    res.render('leadDetails', {
      pageTitle: `Details: ${lead.fullName} | EduLead`,
      lead,
      documents
    });
  } catch (error) {
    console.error('Details retrieval error:', error);
    req.session.error = 'Invalid lead reference ID.';
    res.redirect('/leads');
  }
};

// 8. Render Edit Lead Form (Protected)
exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await Lead.findById(id);
    if (!lead) {
      req.session.error = 'Lead not found for editing.';
      return res.redirect('/leads');
    }

    res.render('editLead', {
      pageTitle: `Edit: ${lead.fullName} | EduLead`,
      lead,
      error: null
    });
  } catch (error) {
    console.error('Edit form retrieval error:', error);
    req.session.error = 'Error accessing lead edit page.';
    res.redirect('/leads');
  }
};

// 9. Update Lead Details (Protected)
exports.updateLead = async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    email,
    phone,
    country,
    courseInterested,
    budget,
    qualification,
    leadSource,
    status,
    followUpDate,
    notes
  } = req.body;

  if (!fullName || !email || !phone || !country || !courseInterested) {
    try {
      const lead = await Lead.findById(id);
      return res.render('editLead', {
        pageTitle: `Edit: ${lead.fullName} | EduLead`,
        lead,
        error: 'Please fill in all required fields marked with *'
      });
    } catch (err) {
      return res.redirect('/leads');
    }
  }

  try {
    const parsedFollowUpDate = followUpDate && followUpDate !== '' ? new Date(followUpDate) : null;

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        fullName,
        email,
        phone,
        country,
        courseInterested,
        budget,
        qualification,
        leadSource,
        status,
        followUpDate: parsedFollowUpDate,
        notes
      },
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      req.session.error = 'Lead does not exist or has been deleted.';
      return res.redirect('/leads');
    }

    // Send status update email if status changed (non-blocking)
    try {
      await sendEmail({
        to: updatedLead.email,
        subject: 'Admission Status Updated - EduLead',
        html: buildStatusUpdateEmail(updatedLead.fullName, updatedLead.status, updatedLead.followUpDate, updatedLead.courseInterested)
      });
    } catch (emailErr) {
      console.error('[EduLead Email] Status update email failed (lead update continues):', emailErr.message);
    }

    req.session.success = `Lead "${fullName}" has been updated successfully.`;
    res.redirect(`/leads/${id}`);
  } catch (error) {
    console.error('Lead update error:', error);
    try {
      const lead = await Lead.findById(id);
      res.render('editLead', {
        pageTitle: `Edit: ${lead.fullName} | EduLead`,
        lead,
        error: 'Database constraints violated during update operation.'
      });
    } catch (err) {
      res.redirect('/leads');
    }
  }
};

// 10. Delete Lead (Protected)
exports.deleteLead = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLead = await Lead.findByIdAndDelete(id);
    if (!deletedLead) {
      req.session.error = 'Lead has already been deleted.';
      return res.redirect('/leads');
    }

    req.session.success = `Lead "${deletedLead.fullName}" has been deleted successfully.`;
    res.redirect('/leads');
  } catch (error) {
    console.error('Lead deletion error:', error);
    req.session.error = 'Unable to delete student lead.';
    res.redirect('/leads');
  }
};

// 11. Export Leads to CSV (Protected)
exports.exportLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    
    // Construct CSV Header
    let csvContent = 'ID,Full Name,Email,Phone,Country,Course,Budget,Qualification,Source,Status,Follow-up Date,Notes,Created At\n';
    
    // Add records
    leads.forEach(lead => {
      const followUp = lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '';
      const created = new Date(lead.createdAt).toISOString().split('T')[0];
      
      // Escape columns
      const cleanName = `"${lead.fullName.replace(/"/g, '""')}"`;
      const cleanEmail = `"${lead.email.replace(/"/g, '""')}"`;
      const cleanPhone = `"${lead.phone.replace(/"/g, '""')}"`;
      const cleanCountry = `"${lead.country.replace(/"/g, '""')}"`;
      const cleanCourse = `"${lead.courseInterested.replace(/"/g, '""')}"`;
      const cleanBudget = `"${(lead.budget || '').replace(/"/g, '""')}"`;
      const cleanQual = `"${(lead.qualification || '').replace(/"/g, '""')}"`;
      const cleanSource = `"${(lead.leadSource || '').replace(/"/g, '""')}"`;
      const cleanNotes = `"${(lead.notes || '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;
      
      csvContent += `${lead._id},${cleanName},${cleanEmail},${cleanPhone},${cleanCountry},${cleanCourse},${cleanBudget},${cleanQual},${cleanSource},${lead.status},${followUp},${cleanNotes},${created}\n`;
    });
    
    // Serve as attachment download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=admission_leads_export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).send('Error generating student data spreadsheet.');
  }
};

// 12. Update Lead Status dynamically (Protected)
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    req.session.error = 'No status specified.';
    return res.redirect(`/leads/${id}`);
  }

  try {
    const lead = await Lead.findById(id);
    if (!lead) {
      req.session.error = 'Student lead not found.';
      return res.redirect('/leads');
    }

    const oldStatus = lead.status;
    lead.status = status;

    // Auto-log transition timeline event in notes field
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const timelineEvent = `\n[Timeline Event - ${timestamp}]: Status updated from "${oldStatus}" to "${status}" by Counselor.`;
    lead.notes = lead.notes ? `${lead.notes}${timelineEvent}` : `Initial Note: ${timelineEvent}`;

    await lead.save();

    // Send status update email to student (non-blocking)
    try {
      await sendEmail({
        to: lead.email,
        subject: 'Admission Status Updated - EduLead',
        html: buildStatusUpdateEmail(lead.fullName, status, lead.followUpDate, lead.courseInterested)
      });
    } catch (emailErr) {
      console.error('[EduLead Email] Status update email failed (status save continues):', emailErr.message);
    }

    req.session.success = `Status updated successfully to "${status}".`;
    res.redirect(`/leads/${id}`);
  } catch (error) {
    console.error('Status transition error:', error);
    req.session.error = 'Invalid status transition value or database error.';
    res.redirect(`/leads/${id}`);
  }
};

// 13. Get Student Inquiry Status (Student Protected Route)
exports.getInquiryStatus = async (req, res) => {
  try {
    const studentEmail = req.session.studentEmail;

    // Find the most recent lead matching the student's email
    const leads = await Lead.find({ email: studentEmail }).sort({ createdAt: -1 });
    const lead = leads.length > 0 ? leads[0] : null;

    res.render('myInquiryStatus', {
      pageTitle: 'My Inquiry Status | EduLead',
      lead,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Inquiry status fetch error:', error);
    res.render('myInquiryStatus', {
      pageTitle: 'My Inquiry Status | EduLead',
      lead: null,
      error: 'Could not load your inquiry status. Please try again.',
      success: null
    });
  }
};
