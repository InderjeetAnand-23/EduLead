const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────────────────
// Create a transporter lazily so missing ENV vars don't crash the app on startup
// ─────────────────────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false, // true for port 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared email header/footer HTML wrappers
// ─────────────────────────────────────────────────────────────────────────────
const emailHeader = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduLead Email</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Header Band -->
          <tr>
            <td style="background:linear-gradient(135deg,#1D4ED8 0%,#0EA5E9 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="font-size:28px;">🎓</span>
                <span style="color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-0.5px;">EduLead</span>
              </div>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;letter-spacing:0.5px;">Admissions Portal</p>
            </td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td style="padding:40px 40px 0;">
`;

const emailFooter = `
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;border-top:1px solid #E2E8F0;margin-top:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 6px;color:#94A3B8;font-size:12px;">This is an automated email from EduLead Admissions Portal.</p>
                    <p style="margin:0;color:#CBD5E1;font-size:11px;">© 2025 EduLead. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Template 1: Student Welcome Email
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeEmail(studentName) {
  const firstName = studentName.split(' ')[0];
  return `
${emailHeader}
  <h1 style="margin:0 0 8px;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Welcome to EduLead! 🎉</h1>
  <p style="margin:0 0 28px;color:#64748B;font-size:15px;">Your journey to your dream program starts here.</p>

  <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:28px;">
    <p style="margin:0 0 12px;color:#0F172A;font-size:16px;font-weight:600;">Hi ${firstName},</p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.7;">
      Your <strong>EduLead student account</strong> has been created successfully. You're now part of the EduLead Admissions Portal — your one-stop platform for managing your international study application.
    </p>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">Here's what you can do with your account:</p>
  </div>

  <!-- Feature Cards -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
    <tr>
      <td width="32%" style="padding-right:8px;vertical-align:top;">
        <div style="background:#EFF6FF;border-radius:10px;padding:18px;text-align:center;">
          <div style="font-size:24px;margin-bottom:8px;">🌍</div>
          <div style="color:#1D4ED8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Explore Programs</div>
          <div style="color:#64748B;font-size:12px;margin-top:4px;">Browse courses from top universities worldwide.</div>
        </div>
      </td>
      <td width="32%" style="padding:0 4px;vertical-align:top;">
        <div style="background:#F0FDF4;border-radius:10px;padding:18px;text-align:center;">
          <div style="font-size:24px;margin-bottom:8px;">📋</div>
          <div style="color:#16A34A;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Submit Inquiry</div>
          <div style="color:#64748B;font-size:12px;margin-top:4px;">Apply for your desired course in just a few clicks.</div>
        </div>
      </td>
      <td width="32%" style="padding-left:8px;vertical-align:top;">
        <div style="background:#FDF4FF;border-radius:10px;padding:18px;text-align:center;">
          <div style="font-size:24px;margin-bottom:8px;">📊</div>
          <div style="color:#9333EA;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Track Status</div>
          <div style="color:#64748B;font-size:12px;margin-top:4px;">Follow your admission progress in real time.</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- CTA Button -->
  <div style="text-align:center;margin-bottom:32px;">
    <a href="${process.env.APP_URL || 'http://localhost:5000'}"
       style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0EA5E9);color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
      Go to My Portal →
    </a>
  </div>

  <p style="margin:0 0 32px;color:#94A3B8;font-size:13px;text-align:center;">
    If you have any questions, your counsellor is here to help. You can reach out via the portal anytime.
  </p>
${emailFooter}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 2: Inquiry Submitted Confirmation
// ─────────────────────────────────────────────────────────────────────────────
function buildInquiryEmail(studentName, courseInterested, inquiryId) {
  const firstName = studentName.split(' ')[0];
  const inquiryDisplay = inquiryId ? String(inquiryId).slice(-8).toUpperCase() : 'N/A';
  return `
${emailHeader}
  <h1 style="margin:0 0 8px;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Inquiry Received ✅</h1>
  <p style="margin:0 0 28px;color:#64748B;font-size:15px;">We've got your admission application — here's what happens next.</p>

  <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:28px;">
    <p style="margin:0 0 16px;color:#0F172A;font-size:16px;font-weight:600;">Hi ${firstName},</p>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">
      Great news! Your admission inquiry has been successfully received by the <strong>EduLead Admissions Portal</strong>. Our counselling team will review your details and get in touch with you soon.
    </p>
  </div>

  <!-- Inquiry Details Table -->
  <div style="border:1.5px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
    <div style="background:linear-gradient(135deg,#1D4ED8,#0EA5E9);padding:14px 20px;">
      <span style="color:#FFFFFF;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">📄 Inquiry Summary</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;width:40%;">
          <span style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Inquiry ID</span>
        </td>
        <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;">
          <span style="color:#1D4ED8;font-size:14px;font-weight:700;font-family:monospace;">#${inquiryDisplay}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;background:#FAFAFA;">
          <span style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Program Applied</span>
        </td>
        <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;background:#FAFAFA;">
          <span style="color:#0F172A;font-size:14px;font-weight:600;">${courseInterested || 'Not specified'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Current Status</span>
        </td>
        <td style="padding:16px 20px;">
          <span style="background:#DBEAFE;color:#1D4ED8;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;border:1px solid #BFDBFE;">🔵 New Inquiry</span>
        </td>
      </tr>
    </table>
  </div>

  <!-- What Happens Next -->
  <div style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:12px;padding:20px;margin-bottom:28px;">
    <p style="margin:0 0 12px;color:#92400E;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">⏳ What Happens Next?</p>
    <ol style="margin:0;padding-left:20px;color:#78350F;font-size:13px;line-height:2.2;">
      <li>Our counsellor will review your application details.</li>
      <li>You will be contacted to discuss your program options.</li>
      <li>You can track your admission status anytime via the portal.</li>
    </ol>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:32px;">
    <a href="${process.env.APP_URL || 'http://localhost:5000'}/my-inquiry-status"
       style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0EA5E9);color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
      Track My Inquiry →
    </a>
  </div>
${emailFooter}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 3: Admission Status Update
// ─────────────────────────────────────────────────────────────────────────────
function buildStatusUpdateEmail(studentName, newStatus, followUpDate, courseInterested) {
  const firstName = studentName.split(' ')[0];

  // Dynamic badge color by status
  const statusColors = {
    'New Inquiry':            { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', emoji: '🔵' },
    'Contacted':              { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE', emoji: '📞' },
    'Interested':             { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', emoji: '💚' },
    'Documents Pending':      { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', emoji: '📄' },
    'Documents Verified':     { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', emoji: '✅' },
    'Application Submitted':  { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', emoji: '📬' },
    'Offer Letter Issued':    { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', emoji: '🎉' },
    'Fee Pending':            { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74', emoji: '💳' },
    'Admitted':               { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', emoji: '🎓' },
    'Rejected':               { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', emoji: '❌' },
    'Not Interested':         { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', emoji: '⚫' }
  };
  const badge = statusColors[newStatus] || { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', emoji: '📋' };

  const followUpDisplay = followUpDate
    ? new Date(followUpDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return `
${emailHeader}
  <h1 style="margin:0 0 8px;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Status Update ${badge.emoji}</h1>
  <p style="margin:0 0 28px;color:#64748B;font-size:15px;">Your admission status has been updated by your counsellor.</p>

  <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:28px;">
    <p style="margin:0 0 16px;color:#0F172A;font-size:16px;font-weight:600;">Hi ${firstName},</p>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">
      Your counsellor has reviewed your admission file and updated your application status. Please check the details below and log in to the portal for more information.
    </p>
  </div>

  <!-- Status Details -->
  <div style="border:1.5px solid ${badge.border};border-radius:12px;overflow:hidden;margin-bottom:28px;">
    <div style="background:${badge.bg};padding:20px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">${badge.emoji}</div>
      <div style="color:${badge.text};font-size:20px;font-weight:800;">${newStatus}</div>
      <div style="color:${badge.text};opacity:0.7;font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Current Admission Status</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${courseInterested ? `
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;width:45%;">
          <span style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Program</span>
        </td>
        <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;">
          <span style="color:#0F172A;font-size:14px;font-weight:600;">${courseInterested}</span>
        </td>
      </tr>` : ''}
      ${followUpDisplay ? `
      <tr>
        <td style="padding:16px 20px;background:#FAFAFA;">
          <span style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Follow-up Date</span>
        </td>
        <td style="padding:16px 20px;background:#FAFAFA;">
          <span style="color:#0F172A;font-size:14px;font-weight:600;">📅 ${followUpDisplay}</span>
        </td>
      </tr>` : ''}
    </table>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:32px;">
    <a href="${process.env.APP_URL || 'http://localhost:5000'}/my-inquiry-status"
       style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0EA5E9);color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
      View My Inquiry Status →
    </a>
  </div>

  <p style="margin:0 0 32px;color:#94A3B8;font-size:13px;text-align:center;">
    If you have any questions about this update, please contact your assigned counsellor through the portal.
  </p>
${emailFooter}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main sendEmail function — reusable across all controllers
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Send an email using Nodemailer + SMTP env credentials.
 * @param {object} options
 * @param {string} options.to        - Recipient email address
 * @param {string} options.subject   - Email subject line
 * @param {string} options.html      - Full HTML body string
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EduLead Email] EMAIL_USER or EMAIL_PASS not set — skipping email dispatch.');
    return;
  }

  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM || `EduLead <${process.env.EMAIL_USER}>`;

  const mailOptions = {
    from: fromName,
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EduLead Email] Sent to ${to} | Message ID: ${info.messageId}`);
};

module.exports = {
  sendEmail,
  buildWelcomeEmail,
  buildInquiryEmail,
  buildStatusUpdateEmail
};
