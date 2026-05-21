const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Render Admin Register Page
exports.getRegister = (req, res) => {
  res.render('register', {
    pageTitle: 'Admin Registration',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle Admin Register POST
exports.postRegister = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Basic validation
  if (!username || !email || !password || !confirmPassword) {
    return res.render('register', {
      pageTitle: 'Admin Registration',
      error: 'All fields are required',
      success: null
    });
  }

  if (password !== confirmPassword) {
    return res.render('register', {
      pageTitle: 'Admin Registration',
      error: 'Passwords do not match',
      success: null
    });
  }

  try {
    // Check if email or username already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.render('register', {
        pageTitle: 'Admin Registration',
        error: 'Email already registered',
        success: null
      });
    }

    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.render('register', {
        pageTitle: 'Admin Registration',
        error: 'Username already taken',
        success: null
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Admin
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await newAdmin.save();

    // Auto-login after registration
    req.session.adminId = newAdmin._id;
    req.session.adminUsername = newAdmin.username;
    req.session.adminEmail = newAdmin.email;

    req.session.success = 'Registration successful! Welcome to EduLead.';
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      pageTitle: 'Admin Registration',
      error: 'Something went wrong during registration. Please try again.',
      success: null
    });
  }
};

// Render Admin Login Page
exports.getLogin = (req, res) => {
  res.render('login', {
    pageTitle: 'Admin Login',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle Admin Login POST
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', {
      pageTitle: 'Admin Login',
      error: 'Please fill in all fields',
      success: null
    });
  }

  try {
    // Find Admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render('login', {
        pageTitle: 'Admin Login',
        error: 'Invalid email or password',
        success: null
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('login', {
        pageTitle: 'Admin Login',
        error: 'Invalid email or password',
        success: null
      });
    }

    // Set Session variables
    req.session.adminId = admin._id;
    req.session.adminUsername = admin.username;
    req.session.adminEmail = admin.email;

    // Get redirected destination or go to dashboard
    const redirectUrl = req.session.redirectTo || '/dashboard';
    delete req.session.redirectTo;

    req.session.success = 'Successfully logged in!';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      pageTitle: 'Admin Login',
      error: 'An error occurred. Please try again.',
      success: null
    });
  }
};

// Handle Admin Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};
