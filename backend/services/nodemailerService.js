const nodemailer = require('nodemailer');

/**
 * Gmail OAuth2 transporter.
 * Using OAuth2 instead of SMTP password because Render (and many cloud
 * platforms) block outbound SMTP ports 465/587.
 *
 * Required env vars:
 *   GMAIL_USER          — your Gmail address
 *   GMAIL_CLIENT_ID     — Google Cloud OAuth2 Client ID
 *   GMAIL_CLIENT_SECRET — Google Cloud OAuth2 Client Secret
 *   GMAIL_REFRESH_TOKEN — OAuth2 Refresh Token (long-lived)
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });
};

const sendWithNodemailer = async (to, subject, html) => {
  // Create a fresh transporter per send so token refresh is always picked up
  const transporter = createTransporter();

  return await transporter.sendMail({
    from: `"MAMCET Alumni Connect" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendWithNodemailer };
