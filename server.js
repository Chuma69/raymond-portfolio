// Local development server. Serves the static site and wires the API routes
// to the shared handlers in lib/, adding local file logging (data/*.jsonl).
// In production on Vercel these same handlers run as serverless functions
// under api/ — see vercel.json.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { smtpConfigured } from './lib/mailer.js';
import { processResumeRequest, processContact, processSubscribe, healthInfo } from './lib/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4300;

const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'requests.jsonl');
const CONTACT_LOG = path.join(DATA_DIR, 'contact.jsonl');
const SUBSCRIBER_LOG = path.join(DATA_DIR, 'subscribers.jsonl');

function appendJson(file, record) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(file, JSON.stringify(record) + '\n');
}
function subscriberExists(email) {
  if (!fs.existsSync(SUBSCRIBER_LOG)) return false;
  return fs
    .readFileSync(SUBSCRIBER_LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .some((line) => {
      try { return JSON.parse(line).email.toLowerCase() === email.toLowerCase(); } catch { return false; }
    });
}

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/resume-request', async (req, res) => {
  const { status, body } = await processResumeRequest(req.body || {}, {
    persist: (rec) => appendJson(LOG_FILE, rec),
  });
  res.status(status).json(body);
});

app.post('/api/contact', async (req, res) => {
  const { status, body } = await processContact(req.body || {}, {
    persist: (rec) => appendJson(CONTACT_LOG, rec),
  });
  res.status(status).json(body);
});

app.post('/api/subscribe', async (req, res) => {
  const { status, body } = await processSubscribe(req.body || {}, {
    isDuplicate: subscriberExists,
    persist: (rec) => appendJson(SUBSCRIBER_LOG, rec),
  });
  res.status(status).json(body);
});

app.get('/api/health', (_req, res) => res.json(healthInfo()));

// SPA fallback: serve index.html for any non-API GET route (so /about,
// /projects, /contact, /projects/<slug> work on direct load / refresh).
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio running on http://localhost:${PORT}`);
  console.log(`SMTP: ${smtpConfigured ? 'configured' : 'NOT configured (requests will be logged to data/*.jsonl)'}`);
});
