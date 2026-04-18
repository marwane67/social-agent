import { sbPublic, sbAdmin, mediaUrl } from './supabase';

export type Article = {
  id: string;
  title: string;
  source: string;
  date: string;
  sort_date: string | null;
  excerpt: string;
  href: string;
  image_path: string | null;
  image_url: string;
  theme: string | null;
  position: number;
  published: boolean;
};

export type Video = {
  id: string;
  title: string;
  source: string;
  date: string;
  duration: string;
  category: string;
  video_url: string | null;
  file_path: string | null;
  thumb_path: string | null;
  thumb_url: string;
  file_url: string;
  position: number;
  published: boolean;
};

export type BioSection = {
  id: string;
  heading: string | null;
  body_html: string;
  position: number;
};

export type HeroSettings = {
  surtitle: string;
  title: string;
  tagline: string;
};

function mapArticle(r: any): Article {
  return {
    id: r.id,
    title: r.title,
    source: r.source,
    date: r.date,
    sort_date: r.sort_date,
    excerpt: r.excerpt,
    href: r.href,
    image_path: r.image_path,
    image_url: mediaUrl(r.image_path),
    theme: r.theme,
    position: r.position,
    published: r.published,
  };
}

function mapVideo(r: any): Video {
  return {
    id: r.id,
    title: r.title,
    source: r.source || '',
    date: r.date || '',
    duration: r.duration || '',
    category: r.category || 'all',
    video_url: r.video_url,
    file_path: r.file_path,
    thumb_path: r.thumb_path,
    thumb_url: mediaUrl(r.thumb_path),
    file_url: r.video_url || mediaUrl(r.file_path),
    position: r.position,
    published: r.published,
  };
}

/** Use admin client on the server so drafts are visible in admin panel. */
export async function getArticles(opts: { includeUnpublished?: boolean; limit?: number } = {}): Promise<Article[]> {
  const client = opts.includeUnpublished ? sbAdmin() : sbPublic;
  let q = client.from('articles').select('*').order('position', { ascending: true });
  if (!opts.includeUnpublished) q = q.eq('published', true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapArticle);
}

export async function getVideos(opts: { includeUnpublished?: boolean } = {}): Promise<Video[]> {
  const client = opts.includeUnpublished ? sbAdmin() : sbPublic;
  let q = client.from('videos').select('*').order('position', { ascending: true });
  if (!opts.includeUnpublished) q = q.eq('published', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapVideo);
}

export async function getBio(): Promise<BioSection[]> {
  const { data, error } = await sbPublic.from('bio_sections').select('*').order('position', { ascending: true });
  if (error) throw error;
  return (data || []) as BioSection[];
}

export async function getHero(): Promise<HeroSettings> {
  const { data } = await sbPublic.from('settings').select('value').eq('key', 'hero').maybeSingle();
  const v = (data?.value ?? {}) as Partial<HeroSettings>;
  return {
    surtitle: v.surtitle ?? 'ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE',
    title: v.title ?? 'ANAS BEN ABDELMOUMEN',
    tagline: v.tagline ?? 'VILLE DE BRUXELLES',
  };
}
