import express from 'express';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 4300;
const TO_EMAIL = process.env.TO_EMAIL || 'hi@raymondchuma.com';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || TO_EMAIL;

// SMTP is configured entirely through environment variables — no third-party
// form service. Point these at your own email provider's SMTP server.
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  (SMTP_SECURE optional: "true" for 465)
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

let transporter = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'requests.jsonl');

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

app.post('/api/resume-request', async (req, res) => {
  const body = req.body || {};
  const name = clean(body.name, 120);
  const org = clean(body.org, 160);
  const email = clean(body.email, 200);
  const reason = clean(body.reason, 2000);

  if (!name) return res.status(400).json({ ok: false, error: 'Please add your name.' });
  if (!org) return res.status(400).json({ ok: false, error: 'Please add your company.' });
  if (!emailOk(email))
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  if (!reason) return res.status(400).json({ ok: false, error: 'Please add a short reason.' });

  const receivedAt = new Date().toISOString();
  const record = { receivedAt, name, org, email, reason };

  // Always keep a local record so no request is ever lost.
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\n');
  } catch (err) {
    console.error('Failed to write request log:', err.message);
  }

  const subject = `Résumé request — ${name}${org ? ` (${org})` : ''}`;
  const text =
    `New résumé request from your website:\n\n` +
    `Name: ${name}\n` +
    `Company: ${org}\n` +
    `Email: ${email}\n\n` +
    `Why they need it:\n${reason}\n\n` +
    `Received: ${receivedAt}\n\n` +
    `Reply directly to this email to reach ${name}.`;
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#26251F;">` +
    `<h2 style="margin:0 0 12px;font-size:18px;">New résumé request</h2>` +
    `<p style="margin:0 0 4px;"><strong>Name:</strong> ${esc(name)}</p>` +
    `<p style="margin:0 0 4px;"><strong>Company:</strong> ${esc(org)}</p>` +
    `<p style="margin:0 0 12px;"><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>` +
    `<p style="margin:0 0 4px;"><strong>Why they need it:</strong></p>` +
    `<p style="margin:0 0 16px;white-space:pre-wrap;">${esc(reason)}</p>` +
    `<p style="margin:0;color:#6B6760;font-size:13px;">Received ${esc(receivedAt)} · reply to this email to reach them.</p>` +
    `</div>`;

  if (!transporter) {
    // SMTP not configured yet: the request is safely logged to data/requests.jsonl.
    console.warn(
      '[resume-request] SMTP not configured — logged to data/requests.jsonl instead of emailing.\n' +
        JSON.stringify(record, null, 2)
    );
    return res.json({ ok: true, delivery: 'logged' });
  }

  try {
    await transporter.sendMail({
      from: `"Résumé requests" <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: `"${name}" <${email}>`,
      subject,
      text,
      html,
    });
    return res.json({ ok: true, delivery: 'email' });
  } catch (err) {
    console.error('[resume-request] email send failed:', err.message);
    // The request is still saved locally, so surface a soft failure to the client.
    return res.status(502).json({ ok: false, error: 'delivery_failed' });
  }
});

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, smtp: smtpConfigured ? 'configured' : 'not-configured' })
);

app.listen(PORT, () => {
  console.log(`Portfolio running on http://localhost:${PORT}`);
  console.log(`SMTP: ${smtpConfigured ? 'configured' : 'NOT configured (requests will be logged to data/requests.jsonl)'}`);
});
