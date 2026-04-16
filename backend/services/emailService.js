const { sendWithResend } = require('./resendService');
const { sendWithNodemailer } = require('./nodemailerService');

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "resend";

const sendEmail = async (to, subject, html) => {
  console.log(`[EmailService] Sending via ${EMAIL_PROVIDER} → ${to} | Subject: ${subject}`);
  if (EMAIL_PROVIDER === "resend") {
    try {
      return await sendWithResend(to, subject, html);
    } catch (err) {
      console.warn("Resend failed, falling back to Nodemailer:", err.message);
      return await sendWithNodemailer(to, subject, html);
    }
  }

  if (EMAIL_PROVIDER === "nodemailer") {
    return await sendWithNodemailer(to, subject, html);
  }

  throw new Error("Invalid email provider");
};

/**
 * Send a 6-digit OTP to the given email address.
 */
const sendOTPEmail = async (email, otp, name = '') => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
      <div style="background:#c84022;padding:24px;text-align:center">
        <h2 style="color:white;margin:0">MAMCET Alumni Connect</h2>
      </div>
      <div style="padding:32px">
        <h3>Hello ${name || 'there'}!</h3>
        <p>Use the OTP below to complete your registration. It expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#c84022;text-align:center;padding:24px;background:#fff5f5;border-radius:8px;margin:20px 0">
          ${otp}
        </div>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  await sendEmail(email, 'Your OTP for MAMCET Alumni Connect Registration', html);
};

/**
 * Send a welcome/approval email when alumni account is activated.
 */
const sendApprovalEmail = async (email, name) => {
  const html = `
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
  `;
  await sendEmail(email, 'Your MAMCET Alumni Connect Account Has Been Approved!', html);
};

/**
 * Send a broadcast/announcement email from admin to a list of users.
 */
const sendBroadcastEmail = async (recipients, subject, title, message) => {
  let sent = 0, failed = 0;

  for (const { email, name } of recipients) {
    const html = `
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
    `;

    try {
      await sendEmail(email, subject || title, html);
      sent++;
    } catch (err) {
      console.error(`[Broadcast] Email failed for ${email}:`, err.message);
      failed++;
    }
  }

  return { sent, failed };
};

/**
 * Send login credentials to a bulk-imported user.
 * @param {string} email  - recipient email
 * @param {string} name   - recipient name
 * @param {string} rawPass - plain-text default password  (shown once, user should change it)
 * @param {string} role   - 'student' | 'alumni' | 'staff'
 */
const sendCredentialsEmail = async (email, name, rawPass, role = 'student') => {
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
  const loginPaths = { student: '/login/student', alumni: '/login/alumni', staff: '/login/staff' };
  const loginUrl = `${FRONTEND}${loginPaths[role] || '/login'}`;

  const rolePill = {
    student: { label: 'Student', color: '#6366f1' },
    alumni:  { label: 'Alumni',  color: '#14b8a6' },
    staff:   { label: 'Staff',   color: '#f59e0b' },
  }[role] || { label: role, color: '#888' };

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c84022,#e05a35);padding:28px;text-align:center">
        <h2 style="color:#fff;margin:0;font-size:20px">🎓 MAMCET Alumni Connect</h2>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Your Account is Ready</p>
      </div>

      <div style="padding:32px">
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 8px">Hello <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
          Your <strong>MAMCET Alumni Connect</strong> account has been created by the admin team.
          Use the credentials below to log in.
        </p>

        <!-- Credentials box -->
        <div style="background:#f8f9ff;border:1.5px solid #e0e4ff;border-radius:10px;padding:22px 24px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px">
            Login Credentials
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:13.5px">
            <tr>
              <td style="padding:7px 0;color:#888;width:120px">Account Type</td>
              <td>
                <span style="background:${rolePill.color}18;color:${rolePill.color};border-radius:20px;padding:2px 10px;font-weight:700;font-size:12px">
                  ${rolePill.label}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#888">Email / Login ID</td>
              <td style="font-weight:700;color:#1a1a2e">${email}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#888">Default Password</td>
              <td>
                <span style="font-family:monospace;font-size:15px;font-weight:800;background:#fff5f5;color:#c84022;border-radius:6px;padding:3px 10px;letter-spacing:1px">
                  ${rawPass}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Warning -->
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:12.5px;color:#92400e;margin-bottom:24px">
          ⚠️ <strong>Important:</strong> Please change your password after your first login for security.
        </div>

        <a href="${loginUrl}"
           style="display:inline-block;background:#c84022;color:#fff;padding:13px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.3px">
          Log In Now →
        </a>
      </div>

      <div style="background:#f8f8f8;padding:16px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
        This is an auto-generated message from the MAMCET Admin team. Do not reply to this email.
      </div>
    </div>
  `;

  console.log(`[sendCredentialsEmail] Sending credentials to ${email} (role: ${role})`);
  try {
    await sendEmail(
      email,
      '🎓 Your Alumni Connect Account is Created — Login Credentials Inside',
      html
    );
    console.log(`[sendCredentialsEmail] ✅ Sent to ${email}`);
  } catch (err) {
    console.error(`[sendCredentialsEmail] ❌ FAILED for ${email}:`, err.message);
    throw err; // re-throw so caller can track emailStats.failed
  }
};

/**
 * Send a confirmation email after a bulk-imported user activates their account.
 * This is the SECOND and final email in the onboarding flow.
 * @param {string} email - recipient email
 * @param {string} name  - recipient name
 * @param {string} role  - 'student' | 'alumni' | 'staff'
 */
const sendActivationSuccessEmail = async (email, name, role = 'student') => {
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
  const dashboardPaths = {
    student: `/student/home`,
    alumni:  `/alumni/home`,
    staff:   `/staff/dashboard`,
  };
  const dashboardUrl = `${FRONTEND}${dashboardPaths[role] || '/'}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:28px;text-align:center">
        <h2 style="color:#fff;margin:0;font-size:22px">🎉 Account Activated!</h2>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Welcome to MAMCET Alumni Connect</p>
      </div>

      <div style="padding:32px">
        <p style="font-size:15px;color:#1a1a2e;margin:0 0 8px">Hello <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
          Your <strong>MAMCET Alumni Connect</strong> account has been <strong style="color:#16a34a">successfully activated</strong>!
          You now have full access to the platform.
        </p>

        <!-- What you can do now -->
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px">
            You Now Have Access To
          </div>
          <ul style="margin:0;padding-left:18px;font-size:13.5px;color:#374151;line-height:2">
            <li>Connect with fellow alumni &amp; students</li>
            <li>Explore job &amp; internship opportunities</li>
            <li>Discover and register for events</li>
            <li>Join mentorship programmes</li>
            <li>Share posts &amp; updates</li>
          </ul>
        </div>

        <a href="${dashboardUrl}"
           style="display:inline-block;background:#16a34a;color:#fff;padding:13px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.3px">
          Go to Dashboard →
        </a>
      </div>

      <div style="background:#f8f8f8;padding:16px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
        This is an auto-generated message from the MAMCET Admin team. Do not reply to this email.
      </div>
    </div>
  `;

  console.log(`[sendActivationSuccessEmail] Sending activation-success email to ${email}`);
  try {
    await sendEmail(email, '✅ Your MAMCET Alumni Connect Account is Now Active!', html);
    console.log(`[sendActivationSuccessEmail] ✅ Sent to ${email}`);
  } catch (err) {
    console.error(`[sendActivationSuccessEmail] ❌ FAILED for ${email}:`, err.message);
    // We do NOT re-throw — activation already succeeded; email failure is non-blocking
  }
};

module.exports = { sendEmail, sendOTPEmail, sendApprovalEmail, sendBroadcastEmail, sendCredentialsEmail, sendActivationSuccessEmail };

