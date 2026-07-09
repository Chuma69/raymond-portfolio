// Request handlers shared between the local Express server and the Vercel
// serverless functions. Each returns { status, body }; sending email is done
// here, while persistence (local file logging) is injected via callbacks so
// the same logic works whether or not the host has a writable filesystem.
import { getTransporter, TO_EMAIL, FROM_EMAIL, smtpConfigured, clean, cleanMulti, emailOk, esc } from './mailer.js';

export function healthInfo() {
  return { ok: true, smtp: smtpConfigured ? 'configured' : 'not-configured' };
}

export async function processResumeRequest(input, opts = {}) {
  const name = clean(input.name, 120);
  const org = clean(input.org, 160);
  const email = clean(input.email, 200);
  const reason = cleanMulti(input.reason, 2000);

  if (!name) return { status: 400, body: { ok: false, error: 'Please add your name.' } };
  if (!org) return { status: 400, body: { ok: false, error: 'Please add your company.' } };
  if (!emailOk(email)) return { status: 400, body: { ok: false, error: 'Please enter a valid email address.' } };
  if (!reason) return { status: 400, body: { ok: false, error: 'Please add a short reason.' } };

  const receivedAt = new Date().toISOString();
  const record = { receivedAt, name, org, email, reason };
  if (opts.persist) { try { opts.persist(record); } catch (e) { console.error('persist failed:', e.message); } }

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

  return send({ subject, text, html, replyTo: `"${name}" <${email}>`, fromName: 'Résumé requests', record });
}

export async function processContact(input, opts = {}) {
  const name = clean(input.name, 120);
  const email = clean(input.email, 200);
  const org = clean(input.org, 160);
  const topic = clean(input.topic, 120);
  const source = clean(input.source, 120);
  const message = cleanMulti(input.message, 4000);

  if (!name) return { status: 400, body: { ok: false, error: 'Please add your name.' } };
  if (!emailOk(email)) return { status: 400, body: { ok: false, error: 'Please enter a valid email address.' } };
  if (!topic) return { status: 400, body: { ok: false, error: 'Please choose what you’re reaching out about.' } };
  if (!message) return { status: 400, body: { ok: false, error: 'Please add a short message.' } };

  const receivedAt = new Date().toISOString();
  const record = { receivedAt, name, email, org, topic, source, message };
  if (opts.persist) { try { opts.persist(record); } catch (e) { console.error('persist failed:', e.message); } }

  const subject = `New message — ${topic} — ${name}`;
  const text =
    `New contact message from your website:\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Organization: ${org || '—'}\n` +
    `About: ${topic}\n` +
    `How they found you: ${source || '—'}\n\n` +
    `Message:\n${message}\n\n` +
    `Received: ${receivedAt}\n` +
    `Reply directly to this email to reach ${name}.`;
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#26251F;">` +
    `<h2 style="margin:0 0 12px;font-size:18px;">New contact message</h2>` +
    `<p style="margin:0 0 4px;"><strong>Name:</strong> ${esc(name)}</p>` +
    `<p style="margin:0 0 4px;"><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>` +
    `<p style="margin:0 0 4px;"><strong>Organization:</strong> ${esc(org || '—')}</p>` +
    `<p style="margin:0 0 4px;"><strong>About:</strong> ${esc(topic)}</p>` +
    `<p style="margin:0 0 12px;"><strong>How they found you:</strong> ${esc(source || '—')}</p>` +
    `<p style="margin:0 0 4px;"><strong>Message:</strong></p>` +
    `<p style="margin:0 0 16px;white-space:pre-wrap;">${esc(message)}</p>` +
    `<p style="margin:0;color:#6B6760;font-size:13px;">Received ${esc(receivedAt)} · reply to this email to reach them.</p>` +
    `</div>`;

  return send({ subject, text, html, replyTo: `"${name}" <${email}>`, fromName: 'Website contact', record });
}

export async function processSubscribe(input, opts = {}) {
  const email = clean(input.email, 200);
  if (!emailOk(email)) return { status: 400, body: { ok: false, error: 'Please enter a valid email address.' } };

  if (opts.isDuplicate && opts.isDuplicate(email)) {
    return { status: 200, body: { ok: true, already: true } };
  }

  const receivedAt = new Date().toISOString();
  if (opts.persist) { try { opts.persist({ receivedAt, email }); } catch (e) { console.error('persist failed:', e.message); } }

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Newsletter signups" <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        replyTo: email,
        subject: `New newsletter subscriber — ${email}`,
        text: `New newsletter subscriber:\n\n${email}\n\nReceived: ${receivedAt}`,
      });
    } catch (err) {
      // Subscriber is already captured (if persist ran); a failed notice is non-fatal.
      console.error('[subscribe] notification email failed:', err.message);
    }
  } else {
    console.warn(`[subscribe] new subscriber (SMTP not configured): ${email}`);
  }
  return { status: 200, body: { ok: true } };
}

// Shared send path for the résumé/contact handlers.
async function send({ subject, text, html, replyTo, fromName, record }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[${fromName}] SMTP not configured — logged instead of emailing.\n` + JSON.stringify(record, null, 2));
    return { status: 200, body: { ok: true, delivery: 'logged' } };
  }
  try {
    await transporter.sendMail({ from: `"${fromName}" <${FROM_EMAIL}>`, to: TO_EMAIL, replyTo, subject, text, html });
    return { status: 200, body: { ok: true, delivery: 'email' } };
  } catch (err) {
    console.error(`[${fromName}] email send failed:`, err.message);
    return { status: 502, body: { ok: false, error: 'delivery_failed' } };
  }
}
