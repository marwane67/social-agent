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

-- ============ RLS ============
alter table public.articles       enable row level security;
alter table public.videos         enable row level security;
alter table public.bio_sections   enable row level security;
alter table public.settings       enable row level security;

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
