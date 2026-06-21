# Phase 3 — Build Plan

Policy pages (Privacy, Terms, Shipping, Returns, FAQ, Size Guide) were shipped in the previous turn, so item 3 is already complete. The remaining four items are large enough to need confirmation before I burn time on them — especially the seed migration and M-Pesa wiring.

## 1. Catalogue seed — 60 products

A single idempotent migration that seeds the catalogue against the existing 10 categories (`new-arrivals`, `dresses`, `shoes`, `bags`, `accessories`, `office-wear`, `evening-wear`, `casual-wear`, `luxury`, `sale`).

- ~6 products per category, 60 total.
- Each product gets: name, slug, editorial description (2–3 sentences), price, sale price on ~30% of items, 3–5 sizes from a size set appropriate to the category (XS–XL for apparel, 36–42 for shoes, "One Size" for bags/accessories), 2–4 colors, stock 5–40, `is_active = true`, `featured` flag on ~10 picks.
- Images: I'll use Unsplash editorial URLs (deterministic seed) and write rows into `product_images` so cards have visuals immediately; an admin can swap in real uploads via the existing uploader later.
- The migration uses `INSERT … ON CONFLICT (slug) DO NOTHING` so re-running is safe and existing products aren't clobbered.

## 2. Homepage luxury upgrades

Rebuild `src/routes/index.tsx` into a layered editorial homepage:

1. **Hero slider** — 3 slides (Spring/Summer hero, "The Dress Edit", "Flash Sale") with autoplay, dot pagination, gold accent line, dark gradient overlay (already added).
2. **Flash sale strip** — countdown to end of week, 4 sale products from DB with discount %.
3. **Featured collections** — 3 large editorial tiles (Dresses, Luxury, Evening) with hover zoom.
4. **Best sellers** — embla carousel of 8 featured products.
5. **Editorial split** — image + copy block about the brand.
6. **Testimonials carousel** — 4 styled quotes, embla, gold star rating.
7. **Instagram gallery** — 6-up masonry of editorial images with "Follow @royalboutiques" CTA.
8. **Newsletter** — keep existing band.

All sections use existing tokens (`bg-nude`, `bg-soft`, `text-gold`, `font-serif`). Uses `embla-carousel-react` (already installed for product page).

## 3. Policy pages — DONE

Shipped last turn. Linked from the footer Help & Legal columns.

## 4. Payments — M-Pesa STK Push (primary), Stripe/PayPal placeholders

**M-Pesa setup (requires user action first):**

M-Pesa Daraja API needs four credentials I cannot generate myself. Before I write any code I need the user to:
- Create a Daraja developer account at developer.safaricom.co.ke
- Create an app to get **Consumer Key** and **Consumer Secret** (sandbox first, live later)
- Note the **Business Shortcode** (174379 for sandbox Lipa-Na-MPESA test, or their till/paybill for live)
- Note the **Passkey** (provided by Safaricom; sandbox passkey is in the Daraja docs)
- Decide on a callback URL — I'll wire it to the published `/api/public/mpesa/callback` endpoint

Once the user confirms, I will request these four secrets via `add_secret`:
`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY` (plus `MPESA_ENV` = `sandbox`|`production`).

**Implementation:**

- DB: new `payments` table (order_id, provider, provider_ref, amount, currency, status, raw_response, timestamps) with RLS so users see only their own payment rows and service_role has full access.
- Server function `initiateMpesaStkPush` (createServerFn, requireSupabaseAuth) — fetches an OAuth token, signs the password, POSTs to `/mpesa/stkpush/v1/processrequest`, returns the `CheckoutRequestID` to the client.
- Public route `src/routes/api/public/mpesa/callback.ts` — receives the STK callback, verifies the payload, updates the `payments` row + the related `orders.status`. (No signature on the Safaricom callback — we mitigate by checking the `CheckoutRequestID` matches a row we created.)
- Checkout UI: replace the current WhatsApp-only flow with a payment-method selector — M-Pesa (active, asks for phone, then triggers STK and polls payment status), Stripe (button shows "Coming soon" toast), PayPal (button shows "Coming soon" toast). WhatsApp order summary stays as a fallback.

**Stripe/PayPal placeholders:**

Just disabled buttons with a "Coming soon" tooltip; no code wiring yet. When the user is ready for real Stripe I'll use Lovable's built-in `enable_stripe_payments` flow.

## 5. Final QA pass

After the above lands I'll run:

- DB sanity: count products per category, verify slugs unique, verify featured flag set.
- Build check (auto-runs).
- Manual route crawl: every header/footer/mobile link, every category slug, `/shop`, `/wishlist`, `/cart`, `/checkout`, `/auth`, `/account/*`, `/admin/*`, all 6 policy pages, all 10 category short aliases.
- Auth: sign-up → profile created → role = customer; admin sign-in → /admin accessible; logged-out /admin redirects.
- Admin CRUD: create product → upload image → set sale → flag featured → verify on storefront.
- Cart + wishlist: add → persist across reload → checkout.
- M-Pesa: STK initiated from sandbox phone → callback received → order marked paid.
- WhatsApp: order button opens correct number with full summary.
- Mobile responsive at 390 / 768 / 1280.

## Execution order if approved

1. Seed migration (catalogue)
2. Homepage rebuild
3. M-Pesa: ask user for Daraja credentials, then DB + server fns + checkout UI + callback route
4. QA sweep + small fixes
5. Hand back a checklist of results

## Question for you before I start

I need three things confirmed:

1. **Catalogue seed** — OK to drop 60 demo products into the live DB (they're tagged `Demo seed` in description and you can wipe them later from `/admin/products`)?
2. **Currency** — prices in **USD** or **KES**? The site currently displays prices via `format.ts`; M-Pesa requires KES. I'll default to KES at ~130 KES/USD scale (e.g. $250 → KES 32,500) unless you say otherwise.
3. **M-Pesa** — happy to go ahead and create a Daraja sandbox app, then paste the 4 credentials when I ask?

Reply with answers (or "yes to all") and I'll start.
