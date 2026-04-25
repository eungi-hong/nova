# stage diary · setup

This is a React (Vite) app that uses Supabase for auth, database, and file storage. Total setup time: about 10 minutes.

---

## 1 · install dependencies

```bash
npm install
```

## 2 · create a Supabase project

1. Go to <https://supabase.com> and sign in.
2. Click **New Project**. Pick any name (e.g. "stage-diary"), set a database password, choose a region close to you.
3. Wait ~1 minute for the project to provision.

## 3 · grab your credentials

Open **Project Settings → API**:

- Copy **Project URL** (looks like `https://xxxx.supabase.co`)
- Copy **Project API keys → anon / public**

Create `.env` in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Then paste both values into `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 4 · run the schema

In the Supabase dashboard, open the **SQL Editor** (left sidebar) and click **New query**. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. You should see "Success. No rows returned."

This creates all tables (`profiles`, `entries`, `entry_sections`, `entry_meta`, `entry_photos`, `entry_audio`), the row-level-security policies, and the storage policies.

## 5 · create storage buckets

The schema sets up storage *policies*, but the buckets themselves have to be created in the dashboard.

1. Open **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name it exactly `entry-photos`. Toggle **Public bucket** ON. Click **Save**.
4. Repeat for a second bucket named exactly `entry-audio`, also **Public**.

(The buckets are public-read so your shared diary URLs render media for visitors. Writes are gated to authenticated users uploading into a folder named after their own user id — this is enforced by the RLS policies in `schema.sql`.)

## 6 · enable email auth (magic link + password)

Open **Authentication → Providers**:

- **Email** is enabled by default. Open its settings and make sure:
  - **Enable Email Signup** = ON
  - **Confirm email** — your call. ON means new password signups must click a link before they can sign in (more secure). OFF means signup → instant access (faster for testing). Magic-link sign-in works either way.

Open **Authentication → URL Configuration** and set both fields **exactly** as below — small mistakes here cause the "Invalid path specified in request URL" error and dump users on the 404 page after they click their magic link:

- **Site URL**: `http://localhost:5173`  *(no trailing slash, no path)*
- **Redirect URLs**: add `http://localhost:5173/auth/callback` on its own line.

When you deploy, add your production URL too — e.g. `https://stagediary.example.com` to Site URL and `https://stagediary.example.com/auth/callback` to Redirect URLs. Both dev and prod can coexist in the allowlist.

## 7 · run the app

```bash
npm run dev
```

Open <http://localhost:5173>. The setup notice in the bottom-right disappears once your `.env` is correct. Click **start your diary →**, enter your email, click the link in your inbox, choose a handle, and you're in.

The login page (`/login`) has three modes:

- **magic link** — enter email, click the one-time link in your inbox.
- **password sign in** — for returning users who set a password via "new account".
- **new account** — email + password to create an account directly. With **Confirm email** ON, you'll get a confirmation link before the account is active.

Returning users can use any mode; they all sign into the same account.

## 8 · (optional) seed the original 4 entries

If you want to ship with the existing eungi/funkstyles posts already in your diary:

1. Sign in via the app first (so an `auth.users` row exists for you).
2. Open **Authentication → Users** and copy your user id (uuid).
3. Open **SQL Editor**, paste the contents of [`supabase/seed.sql`](supabase/seed.sql), and replace the line:

   ```sql
   v_user_id  uuid := ':user_id_here'::uuid;
   v_handle   text := 'eungi';
   ```

   …with your actual id and the handle you want to own them.

4. Run the script.
5. Visit `/@<your-handle>` and you should see the four entries.

> The seed script populates text content but does **not** upload photos or audio. Photos in the original demo were placeholder slots; for the seeded entries, open each entry in the editor (`edit` button) and add real photos/audio there.

---

## what's where

```
src/
  App.tsx                  routing
  main.tsx                 entry point
  components/
    Masthead.tsx           top nav
    PageEffects.tsx        scroll progress, parallax, custom cursor, reveal
    PhotoSlot.tsx          image-or-placeholder
    SetupNotice.tsx        "Supabase not configured" banner
  lib/
    auth.tsx               AuthProvider + useAuth hook (magic link)
    supabase.ts            client
    api.ts                 read/write helpers
    types.ts               TypeScript types mirroring schema
    util.ts                slugify, date format, youtube embed
  pages/
    Home.tsx               landing + public diary directory
    Login.tsx              magic link form
    Onboarding.tsx         pick a handle
    Settings.tsx           edit profile
    Diary.tsx              /@handle — public index
    Entry.tsx              /@handle/slug — public post
    EntryEditor.tsx        /new and /edit/:id
    NotFound.tsx
  styles/
    global.css             everything
supabase/
  schema.sql               run once
  seed.sql                 optional, one-time
legacy/                    the original static site (kept for reference)
```

## production build

```bash
npm run build
```

Static output lands in `dist/`. Deploy anywhere static — Vercel, Netlify, Cloudflare Pages, even GitHub Pages with a small SPA-fallback config. Don't forget to update **Site URL** and **Redirect URLs** in Supabase Auth settings to your production domain.
