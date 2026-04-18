import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { sbAdmin, MEDIA_BUCKET } from '../../../lib/supabase';

const SOURCE_MAP: Record<string, string> = {
  'lesoir.be': 'Le Soir',
  'lalibre.be': 'La Libre',
  'rtbf.be': 'RTBF',
  'bx1.be': 'BX1',
  'dhnet.be': 'DH',
  'levif.be': 'Le Vif',
  'sudinfo.be': 'Sudinfo',
  '7sur7.be': '7sur7',
  'rtl.be': 'RTL',
  'bruzz.be': 'Bruzz',
  'brusselstimes.com': 'Brussels Times',
  'vrt.be': 'VRT',
  'lecho.be': 'L\'Echo',
};

function pickMeta(html: string, ...patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decode(m[1].trim());
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function sourceFromHost(host: string): string {
  const clean = host.replace(/^www\./, '').toLowerCase();
  if (SOURCE_MAP[clean]) return SOURCE_MAP[clean];
  const m = clean.match(/^([^.]+)\./);
  return m ? m[1][0].toUpperCase() + m[1].slice(1) : clean;
}

function formatDateFr(iso: string | null): { display: string; sort: string | null } {
  if (!iso) return { display: '', sort: null };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { display: '', sort: null };
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const display = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const sort = d.toISOString().slice(0, 10);
  return { display, sort };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL manquante' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL invalide' });
  }

  try {
    const r = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'fr-BE,fr;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    if (!r.ok) {
      return res.status(502).json({ error: `L’article renvoie ${r.status}` });
    }
    const html = await r.text();

    const title =
      pickMeta(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ) || '';

    const excerpt =
      pickMeta(
        html,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
      ) || '';

    let image =
      pickMeta(
        html,
        /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      ) || null;

    const siteName = pickMeta(
      html,
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    );

    const publishedIso = pickMeta(
      html,
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']pubdate["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:updated_time["'][^>]+content=["']([^"']+)["']/i,
    );

    const source = (siteName || sourceFromHost(parsed.hostname)).replace(/\s*\|.*$/, '').trim();
    const { display: dateDisplay, sort: sortDate } = formatDateFr(publishedIso);

    // Clean title: remove trailing " | Le Soir" or " - RTBF" when we already know the source
    let cleanTitle = title;
    if (source) {
      const rx = new RegExp(`\\s*[|\\-–—]\\s*${source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*$`, 'i');
      cleanTitle = cleanTitle.replace(rx, '');
    }

    // Download og:image and upload to storage
    let image_path: string | null = null;
    if (image) {
      try {
        if (image.startsWith('//')) image = 'https:' + image;
        else if (image.startsWith('/')) image = `${parsed.protocol}//${parsed.host}${image}`;
        const imgRes = await fetch(image, {
          headers: { 'user-agent': 'Mozilla/5.0', referer: url },
        });
        if (imgRes.ok) {
          const ab = await imgRes.arrayBuffer();
          const ct = imgRes.headers.get('content-type') || 'image/jpeg';
          const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('avif') ? 'avif' : 'jpg';
          const safeHost = parsed.hostname.replace(/[^\w.-]/g, '_');
          const fname = `${Date.now()}-${safeHost}.${ext}`;
          const sb = sbAdmin();
          const up = await sb.storage.from(MEDIA_BUCKET).upload(fname, Buffer.from(ab), {
            contentType: ct,
            upsert: false,
          });
          if (!up.error) image_path = fname;
        }
      } catch {
        // swallow — image download is best-effort
      }
    }

    return res.status(200).json({
      title: cleanTitle,
      excerpt,
      source,
      date: dateDisplay,
      sort_date: sortDate,
      image_path,
      image_external: image_path ? null : image,
      href: url,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erreur de récupération' });
  }
}
