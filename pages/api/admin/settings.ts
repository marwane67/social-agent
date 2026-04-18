import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { sbAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;
  const sb = sbAdmin();

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('settings').select('*');
      if (error) throw error;
      return res.status(200).json({ items: data });
    }
    if (req.method === 'PUT') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'key required' });
      const { error } = await sb.from('settings').upsert({ key, value });
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'error' });
  }
}
