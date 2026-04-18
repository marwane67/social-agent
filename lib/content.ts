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
  image_path: string | null;
  image_url: string;
};

export type NewsletterSettings = {
  enabled: boolean;
  label: string;
  placeholder: string;
  button: string;
};

export type FeaturedSettings = {
  mode: 'auto' | 'manual' | 'hidden';
  article_id: string | null;
  image_path: string | null;
  image_url: string;
};

export type ContactSettings = {
  enabled: boolean;
  title: string;
  intro_html: string;
  image_path: string | null;
  image_url: string;
};

export type HomeSettings = {
  hero: HeroSettings;
  newsletter: NewsletterSettings;
  featured: FeaturedSettings;
  contact: ContactSettings;
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
  const v = (data?.value ?? {}) as any;
  const image_path = v.image_path ?? '/anas.jpg';
  return {
    surtitle: v.surtitle ?? 'ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE',
    title: v.title ?? 'ANAS BEN ABDELMOUMEN',
    tagline: v.tagline ?? 'VILLE DE BRUXELLES',
    image_path,
    image_url: mediaUrl(image_path),
  };
}

export async function getHomeSettings(): Promise<HomeSettings> {
  const { data } = await sbPublic.from('settings').select('key,value');
  const map: Record<string, any> = {};
  (data || []).forEach((r: any) => (map[r.key] = r.value));
  const heroImgPath = map.hero?.image_path ?? '/anas.jpg';
  const hero: HeroSettings = {
    surtitle: map.hero?.surtitle ?? 'ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE',
    title: map.hero?.title ?? 'ANAS BEN ABDELMOUMEN',
    tagline: map.hero?.tagline ?? 'VILLE DE BRUXELLES',
    image_path: heroImgPath,
    image_url: mediaUrl(heroImgPath),
  };
  const newsletter: NewsletterSettings = {
    enabled: map.newsletter?.enabled ?? true,
    label: map.newsletter?.label ?? 'MA NEWSLETTER',
    placeholder: map.newsletter?.placeholder ?? 'votre adresse mail',
    button: map.newsletter?.button ?? "je m'abonne",
  };
  const featuredImgPath = map.featured?.image_path ?? null;
  const featured: FeaturedSettings = {
    mode: map.featured?.mode ?? 'auto',
    article_id: map.featured?.article_id ?? null,
    image_path: featuredImgPath,
    image_url: mediaUrl(featuredImgPath),
  };
  const contactRaw = map.contact || {};
  const contact: ContactSettings = {
    enabled: contactRaw.enabled ?? true,
    title: contactRaw.title ?? 'Me contacter',
    intro_html:
      contactRaw.intro_html ??
      "<p>Pour toute question relative à l'échevinat des Finances ou de la Propreté publique, vous pouvez me joindre à la <strong>Ville de Bruxelles</strong>.</p>",
    image_path: contactRaw.image_path ?? '/bruxelles.jpg',
    image_url: mediaUrl(contactRaw.image_path ?? '/bruxelles.jpg'),
  };
  return { hero, newsletter, featured, contact };
}

export async function getFeaturedArticle(settings: FeaturedSettings, fallback: Article[]): Promise<Article | null> {
  if (settings.mode === 'hidden') return null;
  if (settings.mode === 'manual' && settings.article_id) {
    const { data } = await sbPublic.from('articles').select('*').eq('id', settings.article_id).eq('published', true).maybeSingle();
    if (data) {
      return {
        id: data.id,
        title: data.title,
        source: data.source,
        date: data.date,
        sort_date: data.sort_date,
        excerpt: data.excerpt,
        href: data.href,
        image_path: data.image_path,
        image_url: mediaUrl(data.image_path),
        theme: data.theme,
        position: data.position,
        published: data.published,
      };
    }
  }
  return fallback[0] || null;
}
