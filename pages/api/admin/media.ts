import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { sbAdmin, MEDIA_BUCKET } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;
  const sb = sbAdmin();

  if (req.method === 'GET') {
    // list everything in the bucket root, newest first
    const { data, error } = await sb.storage.from(MEDIA_BUCKET).list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) return res.status(500).json({ error: error.message });
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}`;
    const items = (data || [])
      .filter((f) => f.name && !f.name.startsWith('.'))
      .map((f) => ({
        name: f.name,
        path: f.name,
        url: `${base}/${f.name}`,
        size: (f.metadata as any)?.size ?? null,
        mimetype: (f.metadata as any)?.mimetype ?? null,
        created_at: f.created_at ?? null,
        updated_at: f.updated_at ?? null,
      }));
    return res.status(200).json({ items });
  }

  if (req.method === 'DELETE') {
    const path = (req.query.path as string) || (req.body?.path as string);
    if (!path) return res.status(400).json({ error: 'path required' });
    const { error } = await sb.storage.from(MEDIA_BUCKET).remove([path]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
