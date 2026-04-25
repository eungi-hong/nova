-- ────────────────────────────────────────────────────────────────────────────
-- stage-diary · supabase schema
-- Run in: Supabase project → SQL editor → paste & run.
-- Idempotent: safe to re-run.
-- ────────────────────────────────────────────────────────────────────────────

-- profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  handle       text unique not null check (handle ~ '^[a-z0-9-]{2,32}$'),
  display_name text,
  bio          text,
  avatar_url   text,
  created_at   timestamptz default now() not null
);

create index if not exists profiles_handle_idx on public.profiles (handle);

-- entries -----------------------------------------------------------------
create table if not exists public.entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  slug           text not null,
  title          text not null,
  title_html     text,
  eyebrow        text,
  medium         text not null default 'dance' check (medium in ('dance','music','theatre','voice','other')),
  venue          text,
  performed_on   date,
  intro          text,
  pull_quote     text,
  video_url      text,
  video_caption  text,
  is_draft       boolean default false not null,
  sort_order     integer default 0 not null,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null,
  unique (user_id, slug)
);

create index if not exists entries_user_idx on public.entries (user_id, sort_order, created_at desc);

-- updated_at trigger ------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entries_updated_at on public.entries;
create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.tg_set_updated_at();

-- entry_sections ----------------------------------------------------------
create table if not exists public.entry_sections (
  id        uuid primary key default gen_random_uuid(),
  entry_id  uuid not null references public.entries(id) on delete cascade,
  label     text not null,
  body      text not null,
  position  integer not null default 0
);
create index if not exists entry_sections_entry_idx on public.entry_sections (entry_id, position);

-- entry_meta --------------------------------------------------------------
create table if not exists public.entry_meta (
  id        uuid primary key default gen_random_uuid(),
  entry_id  uuid not null references public.entries(id) on delete cascade,
  label     text not null,
  value     text not null,
  position  integer not null default 0
);
create index if not exists entry_meta_entry_idx on public.entry_meta (entry_id, position);

-- entry_photos ------------------------------------------------------------
create table if not exists public.entry_photos (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references public.entries(id) on delete cascade,
  storage_path  text not null,
  caption       text,
  position      integer not null default 0
);
create index if not exists entry_photos_entry_idx on public.entry_photos (entry_id, position);

-- entry_audio -------------------------------------------------------------
create table if not exists public.entry_audio (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references public.entries(id) on delete cascade,
  storage_path  text not null,
  caption       text,
  position      integer not null default 0
);
create index if not exists entry_audio_entry_idx on public.entry_audio (entry_id, position);

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.entries        enable row level security;
alter table public.entry_sections enable row level security;
alter table public.entry_meta     enable row level security;
alter table public.entry_photos   enable row level security;
alter table public.entry_audio    enable row level security;

-- profiles: anyone can read, only owner can write/update
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (auth.uid() = id);

-- entries: public can read non-drafts; owner reads/writes own
drop policy if exists entries_select_public on public.entries;
create policy entries_select_public on public.entries
  for select using (is_draft = false or auth.uid() = user_id);

drop policy if exists entries_insert_owner on public.entries;
create policy entries_insert_owner on public.entries
  for insert with check (auth.uid() = user_id);

drop policy if exists entries_update_owner on public.entries;
create policy entries_update_owner on public.entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists entries_delete_owner on public.entries;
create policy entries_delete_owner on public.entries
  for delete using (auth.uid() = user_id);

-- generic policies for child tables: read if entry is readable; write if entry is owned
do $$
declare
  child_table text;
begin
  foreach child_table in array array['entry_sections','entry_meta','entry_photos','entry_audio']
  loop
    execute format($f$
      drop policy if exists %1$I_select on public.%1$I;
      create policy %1$I_select on public.%1$I
        for select using (
          exists (
            select 1 from public.entries e
            where e.id = entry_id and (e.is_draft = false or auth.uid() = e.user_id)
          )
        );

      drop policy if exists %1$I_write on public.%1$I;
      create policy %1$I_write on public.%1$I
        for all using (
          exists (select 1 from public.entries e where e.id = entry_id and auth.uid() = e.user_id)
        ) with check (
          exists (select 1 from public.entries e where e.id = entry_id and auth.uid() = e.user_id)
        );
    $f$, child_table);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- STORAGE
-- Buckets must exist: entry-photos (public), entry-audio (public).
-- See SETUP.md for the dashboard steps. The policies below run after.
-- ────────────────────────────────────────────────────────────────────────────

-- read: anyone can read from these buckets (public diaries)
drop policy if exists "stage diary photo read" on storage.objects;
create policy "stage diary photo read" on storage.objects
  for select using (bucket_id in ('entry-photos','entry-audio'));

-- insert: signed-in user can upload to a path that begins with their uid
drop policy if exists "stage diary photo insert" on storage.objects;
create policy "stage diary photo insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('entry-photos','entry-audio')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "stage diary photo update" on storage.objects;
create policy "stage diary photo update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('entry-photos','entry-audio')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "stage diary photo delete" on storage.objects;
create policy "stage diary photo delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('entry-photos','entry-audio')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
