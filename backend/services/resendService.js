const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendWithResend = async (to, subject, html) => {
  return await resend.emails.send({
    from: "alumnimamcet@gmail.com",
    to,
    subject,
    html
  });
};

module.exports = { sendWithResend };
