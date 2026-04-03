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

/**
 * Send a broadcast/announcement email from admin to a list of users.
 * @param {Array<{email:string, name:string}>} recipients
 * @param {string} subject
 * @param {string} title
 * @param {string} message
 */
const sendBroadcastEmail = async (recipients, subject, title, message) => {
  if (!isSmtpConfigured) {
    console.log(`\n📢 [DEV MODE] Broadcast email skipped (no SMTP). Title: "${title}" → ${recipients.length} recipient(s)\n`);
    return { sent: 0, skipped: recipients.length };
  }

  let sent = 0, failed = 0;
  for (const { email, name } of recipients) {
    try {
      await transporter.sendMail({
        from: `"MAMCET Alumni Connect" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject || title,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px;text-align:center">
              <h2 style="color:#fff;margin:0;font-size:20px">📢 MAMCET Alumni Connect</h2>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Admin Announcement</p>
            </div>
            <div style="padding:32px">
              <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:17px">${title}</h3>
              <div style="font-size:14px;color:#444;line-height:1.7;white-space:pre-wrap">${message}</div>
            </div>
            <div style="background:#f8f8f8;padding:16px;text-align:center;font-size:11px;color:#aaa">
              This message was sent by the MAMCET Admin team. Do not reply to this email.
            </div>
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`[Broadcast] Email failed for ${email}:`, err.message);
      failed++;
    }
  }
  return { sent, failed };
};

module.exports = { sendOTPEmail, sendApprovalEmail, sendBroadcastEmail };
