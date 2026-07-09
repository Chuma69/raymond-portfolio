// Shared mail transport + helpers, used by both the local Express server
// (server.js) and the Vercel serverless functions (api/*.js).
import nodemailer from 'nodemailer';

export const TO_EMAIL = process.env.TO_EMAIL || 'hi@raymondchuma.com';
export const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || TO_EMAIL;

// SMTP is configured entirely through environment variables — no third-party
// form service. Point these at your own email provider's SMTP server.
export const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

let transporter = null;
export function getTransporter() {
  if (!smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Single-line clean (strips newlines — safe for subject/header-ish fields).
export function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}
// Preserves line breaks (for free-text message bodies).
export function cleanMulti(v, max) {
  return String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max);
}

export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// Vercel parses JSON bodies automatically, but be defensive about strings.
export function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { return {}; }
  }
  return b;
}
