# DubMenu Production Launch TODO

Persistent task list for getting DubMenu from its current state to production-ready.

## Current State (verified)

- Product: Cloudflare Worker TV menu display SaaS (cannabis-friendly, Stripe-neutral language).
- Location: `~/dev/dubmenu` / package name `dubmenu`.
- Deployed to: `dubmenu.com` and `tv.dubmenu.com`.
- Auth: PBKDF2 password + JWT cookie, `AccountDurableObject` for per-account storage.
- Billing: Stripe Checkout for $99/month + 14-day free trial; Stripe customer metadata links account to subscriptions.
- Legal: `/privacy` and `/terms` pages live.
- Age gate: TV overlay requires explicit 21+ confirmation before showing menu.
- WebSocket: TV and config pages sync via `SessionDurableObject`; ownership enforced by account cookie.
- Default demo config no longer includes cannabis product images to avoid Stripe/policy risk.
- Production secrets configured: `AUTH_SECRET`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Production vars configured in `wrangler.toml`: `STRIPE_PRICE_ID`, `APP_URL`, `TV_URL`, `ADMIN_EMAILS`.
- Stats Durable Object tracks account creation, session creation, and subscription events for the admin dashboard.
- Test suite runs with `vitest` + `@cloudflare/vitest-pool-workers` (`npm test`).
- Embeddable widget live at `/widget` with JS snippet `/widget.js` and public API `/api/widget/{sessionId}`.

## Phase 1 — Revenue & Legal Foundation (complete)

- [x] Verify Stripe account access and product/price catalog.
- [x] Implement account + session ownership model.
- [x] Add password-based auth (PBKDF2 + JWT cookies) in-worker.
- [x] Add Stripe Checkout + subscription + 2-week free trial.
- [x] Gate config access to the session owner / subscription status.
- [x] Add `/privacy` and `/terms` pages.
- [x] Add TV age-gate enforcement (full-screen overlay, not just disclaimer).
- [x] Add local smoke tests and run wrangler dev / deploy checks.
- [x] Visual QA on desktop and mobile for all new flows.
- [x] Deploy to production.

## Phase 2 — Operations & Reliability (complete)

- [x] Admin dashboard to list/manage customer subscriptions.
- [x] Config export / backup automation.
- [x] Session recovery / transfer flow.
- [x] Monitoring, status page, alerting.
- [x] Image upload/hosting for product photos (R2).
- [x] Self-hosted Dutchie scraper fallback.
- [x] Test suite (vitest + @cloudflare/vitest-pool-workers).
- [x] Customer analytics dashboard (TV loads, widget loads, config saves).

## Phase 3 — Competitive Growth (in progress)

- [x] Embeddable web menu widget for dispensary websites.
- [x] CSV menu import.
- [x] Dayparting / scheduled promo banners.
- [x] Custom domain support for chains (DomainDurableObject + host detection).
- [ ] Additional POS/menu imports (Jane, Leafly).
- [ ] Stripe webhook end-to-end test with a real trial subscription.

## Decisions Log

- 2026-07-01: Stripe product `prod_UoABnaqn6ZB91Q` and price `price_1ToXsZIS4hxpOM6xRO0sMxTw` ($99/month) created; 14-day trial via Checkout `subscription_data[trial_period_days]`.
- 2026-07-01: Auth strategy switched from passwordless magic links to PBKDF2 passwords to avoid dependency on external email deliverability at launch.
- 2026-07-01: TV WebSocket URL changed from server-rendered origin to `window.location.origin` so local dev with `custom_domain` routes does not accidentally hit production.
- 2026-07-01: Temporary debug endpoints removed before production deploy.
- 2026-07-01: Stripe webhook endpoint `we_1TobB2IS4hxpOM6xS2kwzAeo` created for `https://dubmenu.com/api/stripe/webhook`.

## Notes

- Keep all changes in `~/dev/dubmenu`.
- Update this file as tasks are completed.
- Residual risk: homepage meta title still includes "Cannabis Dispensaries"; not Stripe-facing but may need softening.

