import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { sbAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;
  const sb = sbAdmin();

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('articles')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ items: data });
    }

    if (req.method === 'POST') {
      const row = sanitize(req.body);
      const { data, error } = await sb.from('articles').insert(row).select().single();
      if (error) throw error;
      return res.status(200).json({ item: data });
    }

    if (req.method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const row = sanitize(rest);
      const { data, error } = await sb.from('articles').update(row).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ item: data });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await sb.from('articles').delete().eq('id', id as string);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'error' });
  }
}

function sanitize(b: any) {
  const out: any = {};
  const keys = ['title','source','date','sort_date','excerpt','href','image_path','theme','position','published'];
  for (const k of keys) if (k in b) out[k] = b[k];
  if (out.sort_date === '') out.sort_date = null;
  return out;
}
