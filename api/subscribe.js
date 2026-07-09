import { readBody } from '../lib/mailer.js';
import { processSubscribe } from '../lib/api.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  const { status, body } = await processSubscribe(readBody(req));
  return res.status(status).json(body);
}
