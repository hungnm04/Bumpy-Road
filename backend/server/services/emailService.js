// Email service — sends transactional emails via SMTP or Ethereal (dev/test)
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const isProduction = process.env.NODE_ENV === "production";

// ponytail: Ethereal is a fake SMTP service — no account needed, great for dev
// In production: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Cached transporter — created once, reused across all requests
let _transporter = null;
let _testAccount = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  } else {
    // Dev fallback — reuse the same Ethereal account for all emails
    if (!_testAccount) {
      _testAccount = await nodemailer.createTestAccount();
      logger.info({ user: _testAccount.user }, "Ethereal test account created — reuse for session");
    }
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: _testAccount.user, pass: _testAccount.pass },
    });
  }

  return _transporter;
}

async function sendEmail({ to, subject, html }) {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"Bumpy Road" <${process.env.SMTP_FROM || "noreply@bumpyroad.example.com"}>`,
      to,
      subject,
      html,
    });

    if (!isProduction) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info({ to, previewUrl }, "Email sent (preview available at previewUrl)");
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ err: error }, "Failed to send email");
    return { success: false, error: error.message };
  }
}

async function sendEmailVerification(email, username, token) {
  const baseUrl = (process.env.CLIENT_ORIGINS || "http://localhost:5173").split(",")[0];
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Verify your Bumpy Road account",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>Welcome to Bumpy Road, ${username}!</h2>
        <p>Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#315f45;color:#fff8ec;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify email address
        </a>
        <p style="margin-top:24px;font-size:13px;color:#666;">
          This link expires in 7 days. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="font-size:12px;color:#999;margin-top:32px;">
          Or copy this URL into your browser: <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendEmailVerification };
