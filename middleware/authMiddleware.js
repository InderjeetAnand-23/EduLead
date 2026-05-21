const Admin = require('../models/Admin');
const Student = require('../models/Student');

/**
 * Protect dashboard and leads routes - ensure admin is logged in
 */
const requireAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.adminId) {
      const admin = await Admin.findById(req.session.adminId).select('-password');
      if (admin) {
        req.admin = admin;
        res.locals.admin = admin; // Expose to EJS views
        return next();
      }
    }
    
    // User is not authenticated
    req.session.redirectTo = req.originalUrl; // Save destination
    return res.redirect('/auth/login');
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).send('Internal Server Error in Authentication');
  }
};

/**
 * Protect student status and inquiry submission - ensure student is logged in
 */
const requireStudentAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.studentId) {
      const student = await Student.findById(req.session.studentId).select('-password');
      if (student) {
        req.student = student;
        res.locals.student = student;
        return next();
      }
    }
    // Save where student was trying to go
    req.session.studentRedirectTo = req.originalUrl;
    return res.redirect('/student/login');
  } catch (error) {
    console.error('Student auth middleware error:', error);
    res.status(500).send('Internal Server Error in Student Authentication');
  }
};

/**
 * Redirect logged in admins away from Login/Register pages
 */
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/dashboard');
  }
  next();
};

/**
 * Redirect logged in students away from Login/Register pages
 */
const redirectIfStudentLoggedIn = (req, res, next) => {
  if (req.session && req.session.studentId) {
    return res.redirect('/');
  }
  next();
};

/**
 * Block students from accessing admin/counsellor routes.
 * If a student session exists and tries to open /dashboard, /leads, /analytics,
 * redirect them to counsellor login with a clear access-denied message.
 * Admin session and student session are completely independent.
 */
const blockStudentFromAdmin = (req, res, next) => {
  if (req.session && req.session.studentId && !req.session.adminId) {
    return res.redirect('/auth/login?error=Access+denied.+This+area+is+for+counsellors+only.');
  }
  next();
};

/**
 * Set global template variables (e.g. current path, session values)
 */
const globalLocals = (req, res, next) => {
  res.locals.path = req.path;
  res.locals.admin = null; // Default
  res.locals.student = null; // Default
  
  // Custom simple flash alerts from session
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  
  // Clear the messages so they don't persist on subsequent requests
  delete req.session.success;
  delete req.session.error;
  
  if (req.session && req.session.adminId) {
    res.locals.admin = {
      id: req.session.adminId,
      username: req.session.adminUsername,
      email: req.session.adminEmail
    };
  }

  if (req.session && req.session.studentId) {
    res.locals.student = {
      id: req.session.studentId,
      fullName: req.session.studentName,
      email: req.session.studentEmail,
      phone: req.session.studentPhone
    };
  }
  next();
};

module.exports = {
  requireAuth,
  requireStudentAuth,
  redirectIfLoggedIn,
  redirectIfStudentLoggedIn,
  blockStudentFromAdmin,
  globalLocals
};
