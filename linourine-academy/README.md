# LINOURINE ACADEMY — أكاديمية لينورين

Public website + admin dashboard for an Algerian educational academy.
Stack: Next.js (App Router) · TypeScript · Tailwind · Supabase (PostgreSQL, Auth, Storage).

> **Status: Phase 6 — media library, course cover images, general settings page.**
> Done: database + roles, login + route protection, admin shell, courses CRUD with publish permissions and audit log.
> Next: landing-page section builder (drag & drop), users & roles UI, audit log viewer, final SEO/security/performance pass.

Full design: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 1. Prerequisites
- Node.js 20+ and pnpm or npm
- A free [Supabase](https://supabase.com) project
- A GitHub account (and Vercel for hosting)

## 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in the Supabase URL, anon key and service role key (Project Settings → API) and generate a random
`IP_HASH_SALT` (`openssl rand -hex 32`). **Never commit `.env.local`.**

## 3. Database setup
In the Supabase **SQL Editor**, run in this order:
1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_seed.sql`
4. `supabase/migrations/0004_helpers.sql`
5. `supabase/migrations/0005_course_publish_guard.sql`

Then create a Storage bucket named `media` (public read) and apply the storage policies
commented at the bottom of `0002_rls.sql`.

## 4. First Super Admin
1. Supabase Dashboard → Authentication → Users → **Add user** (email + strong password).
2. Edit the email in `supabase/seed/create_super_admin.sql` and run it in the SQL Editor.

## 5. Local development
```bash
npm install
npm run dev        # http://localhost:3000
```

## 6. Production build
```bash
npm run build && npm start
```

## 7. Deployment
1. Push the repository to GitHub (`.env*` files are git-ignored).
2. Import the repository in Vercel and add the variables from `.env.example` in Project Settings.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain, then deploy.
4. Supabase → Authentication → URL Configuration: add the production URL.

GitHub Pages cannot run this project (it needs a server); use Vercel or any Node host.
