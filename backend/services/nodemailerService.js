const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendWithNodemailer = async (to, subject, html) => {
  return await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html
  });
};

module.exports = { sendWithNodemailer };
