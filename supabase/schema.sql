-- Echevin CMS schema

-- ============ ARTICLES ============
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  date text not null,           -- human-readable "12 mars 2025"
  sort_date date,               -- for ordering
  excerpt text not null default '',
  href text not null default '',
  image_path text,              -- storage path in bucket 'media'
  theme text,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_order_idx on public.articles (published, position, sort_date desc);

-- ============ VIDEOS ============
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null default '',
  date text not null default '',
  duration text not null default '',
  category text not null default 'all',  -- conseil | medias | terrain | interviews
  video_url text,                         -- YouTube/Vimeo embed or file URL
  file_path text,                         -- storage path if uploaded
  thumb_path text,                        -- storage path for thumbnail
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_order_idx on public.videos (published, position, created_at desc);

-- ============ BIO SECTIONS ============
create table if not exists public.bio_sections (
  id uuid primary key default gen_random_uuid(),
  heading text,                -- null => intro section
  body_html text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bio_sections_order_idx on public.bio_sections (position);

-- ============ SITE SETTINGS (key/value) ============
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============ LINKEDIN TRACKED ACCOUNTS ============
-- Comptes / posts LinkedIn à surveiller pour récolter des signaux d'engagement.
-- type : 'competitor' (concurrent direct), 'influencer' (autorité du secteur),
--        'own_post' (un de mes posts qui marche), 'company' (page entreprise)
create table if not exists public.tracked_accounts (
  id uuid primary key default gen_random_uuid(),
  url text not null,                          -- profil LinkedIn ou URL d'un post
  kind text not null default 'competitor',    -- competitor | influencer | own_post | company
  label text not null default '',             -- nom affiché ("Hubspot CMO", "Mon post launch")
  notes text not null default '',
  active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracked_accounts_active_idx on public.tracked_accounts (active, kind, created_at desc);

-- ============ LINKEDIN SIGNALS ============
-- Un signal = quelqu'un a engagé (like/comment/share) avec un tracked_account.
-- Le score ICP (0-100) vient de Claude qui matche l'engager contre le brain.
-- status : 'new' (vient d'arriver), 'qualified' (matche ICP), 'contacted' (DM envoyé),
--          'replied' (a répondu), 'dismissed' (pas pertinent)
create table if not exists public.linkedin_signals (
  id uuid primary key default gen_random_uuid(),
  -- Engager (la personne qui a engagé)
  engager_name text not null default '',
  engager_headline text not null default '',  -- "CMO @ HubSpot · ex-Stripe"
  engager_company text not null default '',
  engager_url text,                            -- profil LinkedIn de l'engager
  -- Le post / contenu engagé
  source_url text,                             -- URL du post engagé
  source_account text not null default '',     -- "@hubspot" ou nom du tracked account
  source_excerpt text not null default '',     -- premier extrait du post (contexte pour outreach)
  -- Type d'interaction
  signal_type text not null default 'like',   -- like | comment | share | reaction
  comment_text text not null default '',       -- si commentaire : le contenu
  -- Qualification
  icp_score int not null default 0,            -- 0-100 (Claude vs ICP brain)
  icp_reason text not null default '',         -- pourquoi ce score
  status text not null default 'new',          -- new | qualified | contacted | replied | dismissed
  -- Lien éventuel vers tracked_account source
  tracked_account_id uuid references public.tracked_accounts(id) on delete set null,
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists linkedin_signals_status_idx on public.linkedin_signals (status, icp_score desc, detected_at desc);
create index if not exists linkedin_signals_engager_idx on public.linkedin_signals (engager_url);

-- ============ updated_at triggers ============
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_articles_updated on public.articles;
create trigger trg_articles_updated before update on public.articles
for each row execute function public.tg_touch_updated_at();

drop trigger if exists trg_videos_updated on public.videos;
create trigger trg_videos_updated before update on public.videos
for each row execute function public.tg_touch_updated_at();

drop trigger if exists trg_bio_updated on public.bio_sections;
create trigger trg_bio_updated before update on public.bio_sections
for each row execute function public.tg_touch_updated_at();

drop trigger if exists trg_tracked_accounts_updated on public.tracked_accounts;
create trigger trg_tracked_accounts_updated before update on public.tracked_accounts
for each row execute function public.tg_touch_updated_at();

drop trigger if exists trg_linkedin_signals_updated on public.linkedin_signals;
create trigger trg_linkedin_signals_updated before update on public.linkedin_signals
for each row execute function public.tg_touch_updated_at();

-- ============ RLS ============
alter table public.articles          enable row level security;
alter table public.videos            enable row level security;
alter table public.bio_sections      enable row level security;
alter table public.settings          enable row level security;
alter table public.tracked_accounts  enable row level security;
alter table public.linkedin_signals  enable row level security;

-- Public read of published content
drop policy if exists "read published articles" on public.articles;
create policy "read published articles" on public.articles
  for select using (published = true);

drop policy if exists "read published videos" on public.videos;
create policy "read published videos" on public.videos
  for select using (published = true);

drop policy if exists "read bio" on public.bio_sections;
create policy "read bio" on public.bio_sections
  for select using (true);

drop policy if exists "read settings" on public.settings;
create policy "read settings" on public.settings
  for select using (true);

-- Writes: only service_role (bypasses RLS anyway, but explicit)
-- No policies for INSERT/UPDATE/DELETE -> only service_role writes through admin API.

-- ============ STORAGE BUCKET ============
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Public read; writes via service role
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');
