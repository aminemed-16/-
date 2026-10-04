-- LINOURINE ACADEMY — core schema (PostgreSQL / Supabase)
-- Run order: 0001_schema.sql -> 0002_rls.sql -> 0003_seed.sql

create extension if not exists pg_trgm;

-- ───────── Enums ─────────
create type content_status     as enum ('draft', 'published', 'unpublished');
create type course_level       as enum ('beginner', 'intermediate', 'advanced', 'all_levels');
create type study_mode         as enum ('onsite', 'online', 'hybrid');
create type registration_state as enum ('open', 'closed', 'soon', 'full');
create type request_status     as enum ('new', 'in_review', 'contacted', 'accepted', 'rejected', 'postponed');
create type section_type       as enum ('hero','text','image','features','cards','testimonials',
                                        'faq','cta','gallery','video','statistics');

-- ───────── Helpers ─────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ───────── Identity, roles, permissions ─────────
-- "users" of the product = profiles (credentials live in Supabase auth.users: hashed passwords, sessions)
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '',
  phone        text,
  avatar_url   text,
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table roles (
  id          smallint generated always as identity primary key,
  key         text not null unique,          -- super_admin | admin | manager | editor | moderator
  name_ar     text not null,
  description text,
  is_system   boolean not null default false -- system roles cannot be deleted
);

create table permissions (
  id        smallint generated always as identity primary key,
  key       text not null unique,            -- e.g. edit_courses
  group_key text not null,                   -- courses | orders | users | content | system
  name_ar   text not null
);

create table role_permissions (
  role_id       smallint not null references roles(id) on delete cascade,
  permission_id smallint not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id uuid     not null references profiles(id) on delete cascade,
  role_id smallint not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- Per-user overrides: granted=true adds a permission, granted=false removes one
create table user_permissions (
  user_id       uuid     not null references profiles(id) on delete cascade,
  permission_id smallint not null references permissions(id) on delete cascade,
  granted       boolean  not null,
  primary key (user_id, permission_id)
);

-- Auto-create a profile for every new auth user (no role until a Super Admin assigns one)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permission checks (used by RLS and callable from the API)
create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    join user_roles ur on ur.user_id = p.id
    join roles r on r.id = ur.role_id
    where p.id = auth.uid() and p.is_active and r.key = 'super_admin');
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p join user_roles ur on ur.user_id = p.id
    where p.id = auth.uid() and p.is_active);
$$;

create or replace function public.has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() and (
    public.is_super_admin()
    or coalesce(
      (select up.granted from user_permissions up
        join permissions pm on pm.id = up.permission_id
        where up.user_id = auth.uid() and pm.key = perm),
      exists (select 1 from user_roles ur
        join role_permissions rp on rp.role_id = ur.role_id
        join permissions pm on pm.id = rp.permission_id
        where ur.user_id = auth.uid() and pm.key = perm)));
$$;

-- ───────── Media ─────────
create table media (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  url          text not null,
  alt_text     text,
  mime_type    text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/svg+xml')),
  size_bytes   integer not null check (size_bytes > 0),
  width        integer,
  height       integer,
  uploaded_by  uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ───────── Catalogue ─────────
create table course_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table trainers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  job_title  text,
  bio        text,
  photo_id   uuid references media(id) on delete set null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  icon_key    text,                          -- key from the icon set, never raw SVG
  image_id    uuid references media(id) on delete set null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table certificates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  issuer      text,
  image_id    uuid references media(id) on delete set null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table courses (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title             text not null,
  short_description text,
  description       text,
  category_id       uuid references course_categories(id) on delete set null,
  trainer_id        uuid references trainers(id) on delete set null,
  cover_media_id    uuid references media(id) on delete set null,
  price_dzd         numeric(10,2) check (price_dzd >= 0),
  show_price        boolean not null default false,
  duration_text     text,
  level             course_level not null default 'all_levels',
  location          text,
  study_mode        study_mode not null default 'onsite',
  registration      registration_state not null default 'open',
  has_certificate   boolean not null default false,
  certificate_note  text,
  program_content   jsonb not null default '[]',   -- ordered modules: [{title, items[]}]
  status            content_status not null default 'draft',
  published_at      timestamptz,
  seo_title         text,
  seo_description   text,
  seo_keywords      text[] not null default '{}',
  og_media_id       uuid references media(id) on delete set null,
  view_count        integer not null default 0,
  created_by        uuid references profiles(id) on delete set null,
  updated_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index courses_status_idx   on courses (status, published_at desc);
create index courses_category_idx on courses (category_id);
create index courses_title_trgm   on courses using gin (title gin_trgm_ops);

create table course_media (                       -- additional images
  course_id  uuid not null references courses(id) on delete cascade,
  media_id   uuid not null references media(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (course_id, media_id)
);

-- ───────── Landing pages (one per course, section-based) ─────────
create table landing_pages (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null unique references courses(id) on delete cascade,
  status          content_status not null default 'draft',
  cta_label       text,
  seo_title       text,
  seo_description text,
  og_media_id     uuid references media(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table landing_page_sections (
  id              uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  type            section_type not null,
  content         jsonb not null default '{}',    -- validated per type by Zod in the API
  sort_order      integer not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index lp_sections_order_idx on landing_page_sections (landing_page_id, sort_order);

-- ───────── Site content ─────────
create table pages (                              -- home, about, ...
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  status          content_status not null default 'published',
  seo_title       text,
  seo_description text,
  og_media_id     uuid references media(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table page_sections (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references pages(id) on delete cascade,
  type       section_type not null,
  content    jsonb not null default '{}',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index page_sections_order_idx on page_sections (page_id, sort_order);

create table articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  body            text,
  cover_media_id  uuid references media(id) on delete set null,
  status          content_status not null default 'draft',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  author_id       uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table faq (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid references courses(id) on delete cascade,   -- null = general FAQ
  question   text not null,
  answer     text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table testimonials (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references courses(id) on delete set null,
  author_name text not null,
  author_role text,
  content     text not null,
  rating      smallint check (rating between 1 and 5),
  avatar_id   uuid references media(id) on delete set null,
  status      content_status not null default 'draft',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────── Settings ─────────
create table settings (
  key        text primary key,                    -- e.g. contact.phone, site.name, theme.primary
  value      jsonb not null,
  is_public  boolean not null default true,       -- false = server-side only (API keys, etc.)
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table social_links (
  id         uuid primary key default gen_random_uuid(),
  platform   text not null check (platform in
             ('facebook','instagram','tiktok','youtube','whatsapp','telegram','website','x','linkedin')),
  url        text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

-- ───────── Registration & contact ─────────
create table registration_requests (
  id                    uuid primary key default gen_random_uuid(),
  course_id             uuid references courses(id) on delete set null,
  course_title_snapshot text,                     -- keeps the name if the course is deleted
  full_name             text not null,
  phone                 text not null,
  email                 text,
  wilaya                text not null,
  commune               text,
  notes                 text,
  status                request_status not null default 'new',
  internal_notes        text,
  assigned_to           uuid references profiles(id) on delete set null,
  ip_hash               text,                     -- salted hash, never the raw IP
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index reg_status_idx on registration_requests (status, created_at desc);
create index reg_course_idx on registration_requests (course_id);

create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  subject    text,
  message    text not null,
  is_read    boolean not null default false,
  ip_hash    text,
  created_at timestamptz not null default now()
);

-- ───────── Notifications, audit, analytics ─────────
create table notifications (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null,              -- registration.new | contact.new
  title               text not null,
  link                text,
  required_permission text not null,              -- who may see it
  entity_id           uuid,
  is_read             boolean not null default false,
  created_at          timestamptz not null default now()
);
create index notifications_unread_idx on notifications (is_read, created_at desc);

create table audit_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references profiles(id) on delete set null,
  actor_label  text not null,                     -- name/email at the time of the action
  action       text not null,                     -- create | update | delete | publish | login ...
  entity_type  text not null,
  entity_id    text,
  entity_label text,
  changes      jsonb,
  ip_hash      text,
  created_at   timestamptz not null default now()
);
create index audit_created_idx on audit_logs (created_at desc);
create index audit_entity_idx  on audit_logs (entity_type, entity_id);

create table page_views (
  id           bigint generated always as identity primary key,
  path         text not null,
  course_id    uuid references courses(id) on delete cascade,
  visitor_hash text not null,                     -- daily-rotating salted hash, no cookies
  referrer     text,
  created_at   timestamptz not null default now()
);
create index page_views_day_idx    on page_views (created_at desc);
create index page_views_course_idx on page_views (course_id, created_at desc);

-- ───────── Triggers ─────────
do $$
declare t text;
begin
  foreach t in array array['profiles','course_categories','trainers','services','certificates','courses',
    'landing_pages','landing_page_sections','pages','page_sections','articles','faq','testimonials',
    'settings','registration_requests'] loop
    execute format('create trigger set_updated_at before update on %I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Snapshot the course title on each registration
create or replace function public.registration_snapshot() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  select title into c from courses where id = new.course_id;
  new.course_title_snapshot := coalesce(c, new.course_title_snapshot);
  return new;
end $$;
create trigger reg_snapshot before insert on registration_requests
  for each row execute function public.registration_snapshot();

-- Dashboard notifications
create or replace function public.after_registration() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (type, title, link, required_permission, entity_id)
  values ('registration.new',
          'طلب تسجيل جديد' || coalesce(' في دورة ' || new.course_title_snapshot, ''),
          '/admin/registrations/' || new.id, 'view_orders', new.id);
  return new;
end $$;
create trigger reg_notify after insert on registration_requests
  for each row execute function public.after_registration();

create or replace function public.after_contact() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (type, title, link, required_permission, entity_id)
  values ('contact.new', 'رسالة جديدة من ' || new.name, '/admin/messages/' || new.id,
          'view_messages', new.id);
  return new;
end $$;
create trigger contact_notify after insert on contact_messages
  for each row execute function public.after_contact();

-- Atomic view counter (API only, service role)
create or replace function public.increment_course_view(p_course uuid) returns void
language sql security definer set search_path = public as
$$ update courses set view_count = view_count + 1 where id = p_course; $$;
revoke execute on function public.increment_course_view(uuid) from public, anon, authenticated;
