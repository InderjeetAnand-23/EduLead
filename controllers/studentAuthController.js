const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// Render Student Register Page
exports.getRegister = (req, res) => {
  res.render('studentRegister', {
    pageTitle: 'Student Registration | EduLead',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle Student Register POST
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  // Basic validation
  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return res.render('studentRegister', {
      pageTitle: 'Student Registration | EduLead',
      error: 'All fields are required',
      success: null
    });
  }

  if (password !== confirmPassword) {
    return res.render('studentRegister', {
      pageTitle: 'Student Registration | EduLead',
      error: 'Passwords do not match',
      success: null
    });
  }

  try {
    // Check if email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.render('studentRegister', {
        pageTitle: 'Student Registration | EduLead',
        error: 'Email already registered',
        success: null
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Student
    const newStudent = new Student({
      fullName,
      email,
      phone,
      password: hashedPassword
    });

    await newStudent.save();

    // Auto-login after registration
    req.session.studentId = newStudent._id;
    req.session.studentName = newStudent.fullName;
    req.session.studentEmail = newStudent.email;
    req.session.studentPhone = newStudent.phone;

    req.session.success = 'Registration successful! You can now submit your academic inquiry.';
    const redirectTo = req.session.studentRedirectTo || '/';
    delete req.session.studentRedirectTo;
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Student registration error:', error);
    res.render('studentRegister', {
      pageTitle: 'Student Registration | EduLead',
      error: 'Something went wrong during registration. Please try again.',
      success: null
    });
  }
};

// Render Student Login Page
exports.getLogin = (req, res) => {
  res.render('studentLogin', {
    pageTitle: 'Student Login | EduLead',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle Student Login POST
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('studentLogin', {
      pageTitle: 'Student Login | EduLead',
      error: 'Please fill in all fields',
      success: null
    });
  }

  try {
    // Find Student
    const student = await Student.findOne({ email });
    if (!student) {
      return res.render('studentLogin', {
        pageTitle: 'Student Login | EduLead',
        error: 'Invalid email or password',
        success: null
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.render('studentLogin', {
        pageTitle: 'Student Login | EduLead',
        error: 'Invalid email or password',
        success: null
      });
    }

    // Set Session variables
    req.session.studentId = student._id;
    req.session.studentName = student.fullName;
    req.session.studentEmail = student.email;
    req.session.studentPhone = student.phone;

    req.session.success = 'Successfully logged in as Student!';
    const redirectTo = req.session.studentRedirectTo || '/';
    delete req.session.studentRedirectTo;
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Student login error:', error);
    res.render('studentLogin', {
      pageTitle: 'Student Login | EduLead',
      error: 'An error occurred. Please try again.',
      success: null
    });
  }
};

// Handle Student Logout
exports.logout = (req, res) => {
  delete req.session.studentId;
  delete req.session.studentName;
  delete req.session.studentEmail;
  delete req.session.studentPhone;
  req.session.success = 'Logged out from student session successfully!';
  res.redirect('/');
};
