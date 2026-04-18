import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { sbAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;
  const sb = sbAdmin();

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('bio_sections').select('*').order('position', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ items: data });
    }
    if (req.method === 'POST') {
      const { data, error } = await sb.from('bio_sections').insert(pick(req.body)).select().single();
      if (error) throw error;
      return res.status(200).json({ item: data });
    }
    if (req.method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await sb.from('bio_sections').update(pick(rest)).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ item: data });
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await sb.from('bio_sections').delete().eq('id', id as string);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'error' });
  }
}

function pick(b: any) {
  const out: any = {};
  for (const k of ['heading','body_html','position']) if (k in b) out[k] = b[k];
  return out;
}
