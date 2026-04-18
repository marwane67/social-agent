import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Public (anon) client — safe for browser + SSR reads. */
export const sbPublic: SupabaseClient = createClient(URL, ANON, {
  auth: { persistSession: false },
});

/** Admin client — server-only. Never expose to browser. */
export function sbAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') throw new Error('sbAdmin is server-only');
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

export const MEDIA_BUCKET = 'media';

/** Resolve a stored image path to a public URL. */
export function mediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return pathOrUrl; // /public asset
  return `${URL}/storage/v1/object/public/${MEDIA_BUCKET}/${pathOrUrl}`;
}
