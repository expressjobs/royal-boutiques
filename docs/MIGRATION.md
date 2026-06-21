# Migration Runbook — Leaving Lovable Cloud

Move Royal Boutiques to: **GitHub → your Supabase → Cloudflare Workers → royalboutiques.com**.

---

## 0. Inventory of what's being moved

| Resource | Where it lives now | Where it's going |
| --- | --- | --- |
| Source code | Lovable workspace | Your GitHub repo |
| 6 SQL migrations | `supabase/migrations/` | Your Supabase project |
| 19 tables (public schema) | Lovable Cloud Supabase | Your Supabase project |
| RLS policies (~36) | Lovable Cloud | Re-created by migrations |
| 3 DB functions (`has_role`, `handle_new_user`, `set_updated_at`) | Lovable Cloud | Re-created by migrations |
| 1 Storage bucket: `product-images` (private) | Lovable Cloud Storage | Your Supabase Storage |
| Auth providers: email/password + Google | Lovable broker | Your Supabase Auth |
| Auth users | Lovable Cloud Supabase | Re-signup or one-time admin import |
| Product data (~405 products, images, reviews, categories) | Lovable Cloud tables | CSV import to new project |
| Secrets (M-Pesa, etc.) | Lovable Cloud secrets | `wrangler secret put` |
| Hosting | Lovable preview/publish | Cloudflare Workers |
| Domain | `*.lovable.app` | `royalboutiques.com` |

---

## 1. Push code to GitHub

In Lovable: **+ menu → GitHub → Connect project → Create Repository**. This bidirectionally syncs the codebase (including `supabase/migrations/`, `wrangler.toml`, README, docs). All committed code, migrations, and asset pointers go with it.

If you'd rather pull a zip: Code editor → **Download codebase** → push to your own empty GitHub repo.

> Note: binary assets stored as `*.asset.json` pointers reference Lovable's CDN (`/__l5e/assets-v1/...`). They stay reachable on the published Lovable URL but **will 404 on Cloudflare**. Re-upload each one to your own storage (Supabase Storage, R2, or `public/`) and swap the `.asset.json` import for a direct URL. There are only a few (`src/assets/brand/*`).

---

## 2. Create your Supabase project

1. supabase.com → New project → pick a region (e.g. `eu-west-1` for Kenya latency).
2. Save: project ref, project URL, `anon` (publishable) key, `service_role` key, database password.
3. `supabase link --project-ref YOUR-REF` (CLI) and `supabase db push`, **or** open SQL Editor and paste [`docs/schema-bundle.sql`](./schema-bundle.sql) once.

### What the migrations create

**Enums**
- `app_role`: `customer | admin | vendor`

**Tables (19, all in `public`)**

| Table | Purpose |
| --- | --- |
| `profiles` | per-user profile, seeded by `handle_new_user` trigger |
| `user_roles` | role assignments (use `has_role()`, never store role on profile) |
| `categories` | 7 departments + flat structure |
| `products` | catalog (price KES, sizes, colors, stock, ratings, `owner_type`/`owner_id` for future marketplace) |
| `product_images` | multiple images per product |
| `reviews` | 1–5 star reviews with moderation |
| `carts`, `cart_items` | active cart per user |
| `wishlist_items` | per-user wishlist |
| `orders`, `order_items` | order history with M-Pesa tracking |
| `payments` | M-Pesa STK push attempts + status |
| `coupons` | discount codes |
| `vendors`, `vendor_users`, `vendor_products`, `vendor_orders`, `vendor_payouts`, `commissions` | Phase-2 marketplace scaffolding (admin-only RLS) |

**Functions**
- `has_role(_user_id, _role)` — SECURITY DEFINER, used in RLS
- `handle_new_user()` — trigger on `auth.users` insert → creates `profiles` row + assigns `customer` role
- `set_updated_at()` — generic `updated_at` trigger

**Triggers**
- `handle_new_user` on `auth.users` AFTER INSERT
- `set_updated_at` on every table with an `updated_at` column

**RLS** — enabled on all 19 tables. Policies are scoped to `auth.uid()` for owned data and `has_role(auth.uid(), 'admin')` for admin tables (including all `vendor_*` and `commissions`). Public-readable tables (`products`, `product_images`, `categories`, `reviews`) have narrow `TO anon` SELECT policies.

**Storage**
- Bucket `product-images`, **private**. Create manually after migrations:
  ```sql
  insert into storage.buckets (id, name, public) values ('product-images','product-images', false);
  ```
  Add policies allowing authenticated admins to write and anyone to read via signed URLs (or make it public if your images are non-sensitive).

---

## 3. Configure Supabase Auth

Dashboard → **Authentication → Providers**:
- **Email** — enabled. Disable "Confirm email" only if you want instant signup. Enable **Leaked password protection (HIBP)**.
- **Google** — enable, paste OAuth Client ID + Secret from Google Cloud Console. Redirect URL: `https://YOUR-REF.supabase.co/auth/v1/callback`.

Dashboard → **Authentication → URL Configuration**:
- Site URL: `https://royalboutiques.com`
- Redirect URLs: `https://royalboutiques.com/**`, `http://localhost:5173/**`

> The current code calls `lovable.auth.signInWithOAuth("google", ...)` (Lovable broker). Once off Lovable Cloud, replace that call with `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: ... } })` in `src/routes/auth.tsx`. The broker integration in `src/integrations/lovable/index.ts` and the `@lovable.dev/cloud-auth-js` dependency can then be removed.

---

## 4. Migrate data

### 4a. Product catalog, categories, reviews

From Lovable Cloud: **Backend → Database → Tables → Download CSV** for each table you want to keep. Recommended order (respects FKs):
1. `categories`
2. `products`
3. `product_images`
4. `reviews`
5. `coupons`

Import into your Supabase via Dashboard → Table Editor → **Import data from CSV** for each one.

### 4b. Storage objects (`product-images`)

Lovable Cloud does not expose direct Storage download. Two routes:
- **Re-upload from source** (preferred): images were originally sourced from Unsplash IDs — re-run the seeding script against the new bucket.
- **Scripted copy**: write a one-off Node script using the current Lovable Cloud `service_role` (visible to you via your Lovable session while it's still live) to `list()` + `download()` each object, then `upload()` to the new project.

### 4c. Auth users

Supabase Auth user export/import is service-role only. From Lovable Cloud this isn't exposed self-serve. Options:
- **Easiest:** ask customers to re-sign-up on cutover (post a banner).
- **Full migration:** contact Lovable support and request an `auth.users` export, then import via `supabase auth admin` API or `pg_dump -t auth.users -t auth.identities` if support provides DB access.

### 4d. Carts, wishlists, orders

If you're cutting over to a new user base, drop them. Otherwise CSV-export and re-import after auth users are in place (FKs to `auth.users(id)` must match).

---

## 5. Environment variables

Required everywhere:

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser | inlined at `npm run build` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | publishable / anon key |
| `VITE_SUPABASE_PROJECT_ID` | browser | project ref |
| `SUPABASE_URL` | server fns / SSR | |
| `SUPABASE_PUBLISHABLE_KEY` | server fns (acts-as-user via `requireSupabaseAuth`) | |
| `SUPABASE_SERVICE_ROLE_KEY` | admin server code (`client.server.ts`) | **never expose** |
| `SUPABASE_DB_URL` | migrations / one-off scripts | not used at runtime |
| `MPESA_CONSUMER_KEY` | `src/lib/mpesa.functions.ts` | Daraja app key |
| `MPESA_CONSUMER_SECRET` | same | |
| `MPESA_SHORTCODE` | same | Paybill / Till |
| `MPESA_PASSKEY` | same | Lipa Na M-Pesa passkey |
| `MPESA_ENV` | same | `sandbox` or `production` |

Local: copy `.env.example` → `.env` and fill in.
Worker: `wrangler secret put NAME` for every server var. `VITE_*` must be in the build environment when running `npm run build` (set in CI or local `.env`).

---

## 6. Deploy to Cloudflare Workers

```bash
wrangler login
# secrets (run for each)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_PUBLISHABLE_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put MPESA_CONSUMER_KEY
wrangler secret put MPESA_CONSUMER_SECRET
wrangler secret put MPESA_SHORTCODE
wrangler secret put MPESA_PASSKEY
wrangler secret put MPESA_ENV

npm install
npm run build
npx wrangler deploy
```

The Nitro `cloudflare` preset (pre-wired by `@lovable.dev/vite-tanstack-config`) emits:
- `.output/server/index.mjs` — Worker handler
- `.output/public/**` — static assets

`wrangler.toml` references both. `not_found_handling = "single-page-application"` ensures TanStack Router deep links work on refresh.

### Custom domain

Add `royalboutiques.com` to your Cloudflare account, then:
- Dashboard → Workers → `royal-boutiques` → **Triggers → Custom Domains** → add `royalboutiques.com` + `www.royalboutiques.com`. TLS is automatic.

### M-Pesa callback URL

Update your Daraja app's callback URL to:
`https://royalboutiques.com/api/public/mpesa/callback` (route exists at `src/routes/api/public/mpesa.callback.ts`).

---

## 7. Removing Lovable Cloud lock-in

These are the only Lovable-specific touchpoints in the codebase. After migration, prune them:

| File / dep | What to do |
| --- | --- |
| `@lovable.dev/cloud-auth-js` (package.json) | Remove with `npm uninstall @lovable.dev/cloud-auth-js`. |
| `@lovable.dev/vite-tanstack-config` (package.json + vite.config.ts) | Optional. It's just a preset that bundles `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, `nitro` (cloudflare target), and dedupe rules. If you want zero Lovable deps, replace `vite.config.ts` with the equivalent stock TanStack Start + Nitro config. **Not required to deploy** — the preset works fine off-Lovable. |
| `src/integrations/lovable/index.ts` | Delete. |
| `src/routes/auth.tsx` Google sign-in | Replace `lovable.auth.signInWithOAuth("google", ...)` with `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })`. |
| `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts` | These are standard `@supabase/supabase-js` clients — keep them, they're not Lovable-locked. Header comment says "auto-generated by Lovable" but the code is plain Supabase. |
| `.lovable/`, `AGENTS.md` | Lovable-only metadata; safe to delete. |
| `*.asset.json` pointers | Replace each with a real file under `public/` or `src/assets/`, then delete the pointer. |

After those edits, the app has zero Lovable runtime dependencies and runs on standard Supabase + Cloudflare.

---

## 8. Final cutover checklist

- [ ] GitHub repo created, code pushed
- [ ] Supabase project created (region chosen, password saved)
- [ ] `supabase db push` ran clean (or `schema-bundle.sql` applied)
- [ ] `product-images` storage bucket created with policies
- [ ] Email + Google providers configured in Supabase Auth
- [ ] Site URL & redirect URLs set
- [ ] Categories, products, product_images, reviews CSVs imported
- [ ] Storage objects re-uploaded
- [ ] (Optional) auth users migrated
- [ ] `.env` filled locally; `npm run dev` works against new Supabase
- [ ] Lovable broker call in `auth.tsx` swapped for native Supabase OAuth
- [ ] `@lovable.dev/cloud-auth-js` uninstalled
- [ ] M-Pesa app updated with new callback URL
- [ ] `wrangler secret put` run for every server var
- [ ] `npm run build` succeeds locally with new env
- [ ] `npx wrangler deploy` succeeds
- [ ] `royalboutiques.com` + `www` added as Custom Domains, DNS green
- [ ] Smoke test: browse catalog, sign up, place test M-Pesa order, verify webhook hits, check admin dashboard
- [ ] DNS for the old Lovable preview either retired or 301-redirected to `royalboutiques.com`
