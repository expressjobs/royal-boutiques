# Royal Boutiques

Premium Kenyan online department store — Fashion, Home & Lifestyle. Built with TanStack Start (React 19 + Vite 7), Supabase, and deployed to Cloudflare Workers.

> Pricing in **KES**. Primary market: Kenya. Payments: M-Pesa STK Push (Daraja).

---

## Stack

- **Frontend:** React 19, TanStack Start v1, TanStack Router (file-based), TanStack Query, Tailwind CSS v4, shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage) accessed via TanStack `createServerFn`
- **Payments:** Safaricom M-Pesa Daraja STK Push
- **Deploy target:** Cloudflare Workers (via Nitro `cloudflare` preset)

---

## Local setup

```bash
# 1. Install
npm install            # or: bun install

# 2. Env
cp .env.example .env
# fill in your Supabase + M-Pesa values

# 3. Dev
npm run dev            # http://localhost:5173
```

---

## Project layout

```
src/
  routes/              file-based routes (TanStack)
    api/public/        webhook endpoints (M-Pesa callback)
    _authenticated/    signed-in-only routes (account, admin)
  integrations/
    supabase/          client.ts (browser), client.server.ts (admin),
                       auth-middleware.ts, auth-attacher.ts, types.ts
  lib/
    *.functions.ts     createServerFn handlers (M-Pesa, etc.)
  components/, hooks/
supabase/
  migrations/          SQL migrations (run in order on a fresh project)
  config.toml          local Supabase CLI config
docs/
  schema-bundle.sql    all migrations concatenated, for one-shot apply
  MIGRATION.md         step-by-step move off Lovable Cloud
wrangler.toml          Cloudflare Workers deployment config
```

---

## Fresh Supabase project setup

See [`docs/MIGRATION.md`](docs/MIGRATION.md) for the full migration runbook. Quick version:

```bash
# Option A — Supabase CLI (recommended)
supabase link --project-ref YOUR-PROJECT-REF
supabase db push                       # applies supabase/migrations/*.sql

# Option B — one-shot SQL editor
# Paste docs/schema-bundle.sql into Supabase Dashboard → SQL Editor → Run
```

Then:

1. **Storage:** create a private bucket named `product-images`.
2. **Auth:** enable Email/Password; configure Google OAuth provider with client id/secret.
3. **(Optional)** Seed product data from CSV exports.

---

## Cloudflare Workers deployment

```bash
wrangler login
# set every server secret listed in .env.example
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_PUBLISHABLE_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put MPESA_CONSUMER_KEY
wrangler secret put MPESA_CONSUMER_SECRET
wrangler secret put MPESA_SHORTCODE
wrangler secret put MPESA_PASSKEY
wrangler secret put MPESA_ENV
wrangler secret put MPESA_CALLBACK_URL

# Vite needs VITE_* present at build time — put them in .env or CI env
npm run build
npx wrangler deploy
```

Never commit real `.env` files or secret values. Production secrets must be configured with Cloudflare Worker secrets.

Build output:

- `dist/server/server.js` - Worker entry (`main` in `wrangler.toml`)
- `dist/client/` - static assets (served via `[assets]` binding, SPA fallback handled by `not_found_handling = "single-page-application"`)

### Custom domain — royabotiques.com

1. Add the zone `royabotiques.com` to your Cloudflare account.
2. Dashboard → Workers & Pages → `royal-boutiques` → **Triggers → Custom Domains** → add `royabotiques.com` and `www.royabotiques.com`. Cloudflare auto-issues TLS.
3. (Alternative) uncomment the `routes = [...]` block in `wrangler.toml` and `wrangler deploy`.

---

## Scripts

| Command               | What it does                                 |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Vite dev server                              |
| `npm run build`       | Production build (Vite + Nitro → `.output/`) |
| `npm run preview`     | Preview the built site                       |
| `npm run lint`        | ESLint                                       |
| `npx wrangler deploy` | Push to Cloudflare Workers                   |
| `supabase db push`    | Apply local migrations to linked project     |

---

## License

Proprietary — Royal Boutiques.
