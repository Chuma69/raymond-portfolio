import { healthInfo } from '../lib/api.js';

export default function handler(_req, res) {
  return res.status(200).json(healthInfo());
}
