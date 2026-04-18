import type { NextApiRequest, NextApiResponse } from 'next';
import { clearSessionCookie } from '../../../lib/auth';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
