import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPassword, makeSessionToken, setSessionCookie } from '../../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body || {};
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  setSessionCookie(res, makeSessionToken());
  return res.status(200).json({ ok: true });
}
