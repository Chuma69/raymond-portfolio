import { readBody } from '../lib/mailer.js';
import { processContact } from '../lib/api.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  const { status, body } = await processContact(readBody(req));
  return res.status(status).json(body);
}
