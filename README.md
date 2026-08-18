# Carter's Store Equipment Request Portal

Enterprise equipment request portal for Carter's Retail Inc. Store managers can
request new-store equipment bundles, replacement items, and general support.
Role-based access: **Requester**, **Fulfiller**, **Admin**.

## Tech stack

- Next.js 14 (App Router, TypeScript)
- PostgreSQL + Prisma ORM
- NextAuth.js v4 (credentials provider, JWT sessions)
- Tailwind CSS 3, Radix UI, lucide-react, sonner

---

## Local setup

```bash
# 1. Install dependencies (this project uses yarn)
yarn install

# 2. Configure environment variables
cp .env.example .env
# then edit .env and fill in the real values (see the variable notes below)

# 3. Create the database schema
yarn prisma generate
yarn prisma db push

# 4. (optional) Seed sample data: stores, products, bundles, users, articles
yarn prisma db seed

# 5. Run the dev server
yarn dev
# open http://localhost:3000
```

---

## Deploying to GitHub + Vercel

### 1. Push to GitHub (from your own machine)

```bash
cd nextjs_space
git init
git add .
git commit -m "Initial import of Carter's portal"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

> `.gitignore` already excludes `.env`, `node_modules`, and `.next`. Never commit real secrets.

### 2. Import the repo into Vercel

- New Project -> import your GitHub repo.
- **Root Directory**: set it to `nextjs_space` (the folder that contains `package.json`).
- Framework preset: Next.js (auto-detected).

### 3. Set Environment Variables in Vercel

In **Project Settings -> Environment Variables**, add every variable listed in
`.env.example`. At minimum you need:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Your own Postgres (Vercel Postgres / Neon / Supabase). Include `sslmode=require`. |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel URL, e.g. `https://your-project.vercel.app` |

Optional (only if you keep those features): `ABACUSAI_API_KEY`, `WEB_APP_ID`,
`NOTIF_ID_EQUIPMENT_REQUEST_SUBMITTED`, `NOTIF_ID_REQUEST_STATUS_UPDATE`,
`EMERGENCY_ACCESS_KEY`.

### 4. IMPORTANT — Prisma generator block change for Vercel

The committed `prisma/schema.prisma` `generator client` block is configured for
the original hosting environment. Before deploying to Vercel, change it to:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

What changed and why:
- **Removed** the hardcoded `output = "/home/ubuntu/.../node_modules/.prisma/client"`
  line — that absolute path only exists in the original environment. Removing it
  lets Prisma use its default location, which is what Vercel expects.
- **Changed** `binaryTargets` from `linux-musl-arm64-openssl-3.0.x` to
  `rhel-openssl-3.0.x`, which is the runtime Vercel's serverless functions use.
  Keeping `native` lets it still work on your local machine.

Then make sure Prisma Client is regenerated during the Vercel build. Recommended:
add a `postinstall` (or `build`) hook in `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint"
}
```

### 5. Initialize the database schema (once)

After `DATABASE_URL` points at your new database, run migrations against it and
(optionally) seed it. You can do this locally with the production `DATABASE_URL`
temporarily set, or from a one-off environment:

```bash
yarn prisma db push
yarn prisma db seed
```

---

## Seeding / sample accounts

The seed script (`scripts/seed.ts`) creates sample stores, products, bundles,
knowledge articles, and users. Review and change the seeded passwords before
using in production.

## Notes on features that depend on external services

- **Email notifications** call the Abacus.AI email API using `ABACUSAI_API_KEY`.
  If you migrate fully off that platform, swap this for your own email provider
  (e.g. Resend, SendGrid) in the notification-sending code.
- **Image optimization** is disabled (`images.unoptimized = true` in
  `next.config.js`); Vercel can optimize images if you re-enable it.
