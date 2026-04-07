const { google } = require('googleapis');

/**
 * Gmail REST API email sender.
 *
 * Uses Google's Gmail API over HTTPS — completely bypasses SMTP.
 * This resolves ETIMEDOUT / ECONNECTION errors on Render and other
 * platforms that block outbound SMTP ports (465 / 587).
 *
 * Required env vars:
 *   EMAIL_USER          — your Gmail address (e.g. you@gmail.com)
 *   GMAIL_CLIENT_ID     — Google Cloud OAuth2 Client ID
 *   GMAIL_CLIENT_SECRET — Google Cloud OAuth2 Client Secret
 *   GMAIL_REFRESH_TOKEN — OAuth2 long-lived Refresh Token
 */

/** Build and return an authenticated OAuth2 client. */
const getOAuth2Client = () => {
  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // redirect URI used when generating the token
  );
  client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return client;
};

/**
 * Build an RFC 2822-compliant raw email and Base64url-encode it.
 * The Gmail API requires this format for the `raw` field.
 */
const buildRawMessage = (to, subject, html, fromAddress) => {
  const lines = [
    `From: "MAMCET Alumni Connect" <${fromAddress}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ];

  const raw = lines.join('\r\n');

  // Base64url encoding (URL-safe: replace + → -, / → _, strip = padding)
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Send an email via the Gmail API.
 * Signature is identical to the old Nodemailer version so callers
 * (emailService.js, auth routes, etc.) require zero changes.
 *
 * @param {string} to      — recipient address
 * @param {string} subject — email subject
 * @param {string} html    — HTML body
 */
const sendWithNodemailer = async (to, subject, html) => {
  const auth   = getOAuth2Client();
  const gmail  = google.gmail({ version: 'v1', auth });
  const sender = process.env.EMAIL_USER || process.env.GMAIL_USER;

  const raw = buildRawMessage(to, subject, html, sender);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data;
};

module.exports = { sendWithNodemailer };
