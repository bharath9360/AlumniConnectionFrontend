const nodemailer = require('nodemailer');

// Determine if SMTP is configured
const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS  // Use Gmail App Password, not your regular password
    }
  });
}

/**
 * Send a 6-digit OTP to the given email address.
 * Falls back to console.log if SMTP is not configured (development mode).
 */
const sendOTPEmail = async (email, otp, name = '') => {
  if (!isSmtpConfigured) {
    console.log(`\n🔑 [DEV MODE] OTP for ${email}: ${otp}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"MAMCET Alumni Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your OTP for MAMCET Alumni Connect Registration',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
        <div style="background:#c84022;padding:24px;text-align:center">
          <h2 style="color:white;margin:0">MAMCET Alumni Connect</h2>
        </div>
        <div style="padding:32px">
          <h3>Hello ${name || 'there'}!</h3>
          <p>Use the OTP below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#c84022;text-align:center;padding:24px;background:#fff5f5;border-radius:8px;margin:20px 0">
            ${otp}
          </div>
          <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `
  });
};

/**
 * Send a welcome/approval email when alumni account is activated.
 */
const sendApprovalEmail = async (email, name) => {
  if (!isSmtpConfigured) {
    console.log(`\n✅ [DEV MODE] Approval email for ${email} (${name})\n`);
    return;
  }

  await transporter.sendMail({
    from: `"MAMCET Alumni Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your MAMCET Alumni Connect Account Has Been Approved!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
        <div style="background:#c84022;padding:24px;text-align:center">
          <h2 style="color:white;margin:0">Welcome, ${name}! 🎉</h2>
        </div>
        <div style="padding:32px">
          <p>Your alumni account has been <strong>approved</strong> by the MAMCET admin team.</p>
          <p>You can now log in and connect with your fellow alumni, students, and explore job opportunities.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/alumni"
             style="display:inline-block;background:#c84022;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">
            Log In Now
          </a>
        </div>
      </div>
    `
  });
};

module.exports = { sendOTPEmail, sendApprovalEmail };
