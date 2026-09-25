# ABR Shortener — Next.js + PostgreSQL

Modern rewrite of the original PHP Abrshortner (customer pack for `abr.link888xx.com`).

## Features

- **Auth** — Email/password login (NextAuth credentials)
- **Roles** — `admin` and `user`
- **Short links** — Create / edit / delete with custom OG title, description, image
- **Bot-aware redirects** — Real users get 302; crawlers (WhatsApp, Facebook, etc.) get OG preview HTML
- **Click analytics** — Device, browser, country, referer, recent hits (bots excluded from counters)
- **Admin panel** — Global stats, all links, user management
- **Image upload** — Local `public/uploads` (max 5 MB)

## Stack

- Next.js 15 (App Router)
- PostgreSQL + Prisma
- NextAuth.js
- Tailwind CSS (glass / Apple-style UI)

## Setup

### 1. Install

```bash
cd abr-next
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/abr_shortener?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-a-long-random-secret-here"
ADMIN_NAME="Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeThisStrongPassword"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 3. Database

Create an empty PostgreSQL database, then:

```bash
npx prisma db push
npm run db:seed
```

This creates tables and the admin account from `.env`.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000/login and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Routes

| Path | Description |
|------|-------------|
| `/login` | Login |
| `/dashboard` | User dashboard (create links, stats) |
| `/admin` | Admin overview, all links, users |
| `/{code}` | Short link redirect / OG preview |

## Production notes

- Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to your real domain (e.g. `https://abr.link888xx.com`).
- Point DNS to your Node host (Vercel, Railway, VPS with PM2, etc.).
- For file uploads on serverless (Vercel), switch to S3/R2 or similar — local disk is ephemeral.
- Run `npx prisma migrate deploy` (or `db push`) on deploy.

## Migrating from old PHP MySQL

Export your old data and map columns:

- `users` → same fields (`role` enum: admin/user)
- `urls` → `user_id`, `short_code`, `long_url`, `title`, `image_url`, `description`, `preview_enabled`, `clicks`
- `clicks` → same analytics fields

You can write a one-off script or use Prisma’s raw SQL after connecting both DBs.

## License HQ removed

This customer pack intentionally has **no** license server / HQ pages (same as the original zip).
