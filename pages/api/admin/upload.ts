import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { sbAdmin, MEDIA_BUCKET } from '../../../lib/supabase';

export const config = {
  api: { bodyParser: { sizeLimit: '100mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { filename, contentType, dataB64 } = req.body || {};
  if (!filename || !dataB64) return res.status(400).json({ error: 'filename and dataB64 required' });

  const buf = Buffer.from(dataB64, 'base64');
  const safeName = String(filename).replace(/[^\w.\-]+/g, '_');
  const ts = Date.now();
  const path = `${ts}-${safeName}`;

  const sb = sbAdmin();
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, buf, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  });
  if (error) return res.status(500).json({ error: error.message });

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
  return res.status(200).json({ path, url });
}
