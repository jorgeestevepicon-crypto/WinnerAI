# Deployment

## Checklist

1. **Database**: provision PostgreSQL (Vercel Postgres, Supabase, Neon, RDS, etc.). Set `DATABASE_URL`.
2. **Run migrations** as part of your deploy step: `npx prisma migrate deploy` (not `migrate dev` — that's for local development only).
3. **Auth secret**: generate a strong `AUTH_SECRET` (`openssl rand -base64 32`) and set `AUTH_URL` to your production domain.
4. **Admin bootstrap**: set `ADMIN_EMAIL` to the email you'll register with, or run `npm run db:seed -- you@example.com` after registering.
5. Configure whichever real integrations you want live (all optional — see the table in the README):
   - AI: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` (and `AI_IMAGE_PROVIDER`/`AI_IMAGE_API_KEY` for real ad images)
   - Shopify: see [docs/shopify.md](shopify.md)
   - Stripe: see below
   - S3-compatible storage: `STORAGE_*` variables
6. Set `NEXT_PUBLIC_APP_URL` to your production URL — used in generated links (password reset, Shopify OAuth redirect, Stripe checkout success/cancel).
7. Set `DEMO_MODE=false` once you've configured the integrations you intend to use in production (this is informational — surfaced in `/admin/system` — not a hard gate).

## Stripe webhook setup

1. In the Stripe Dashboard, add an endpoint pointing to `{your-domain}/api/webhooks/stripe`.
2. Subscribe to at least: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Create Prices for the Starter/Pro/Agency plans in Stripe and set `STRIPE_PRICE_STARTER`/`STRIPE_PRICE_PRO`/`STRIPE_PRICE_AGENCY` to their price IDs.

Locally, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Build & run

```bash
npm run build
npm run start
```

Standard Next.js production server — deployable to Vercel, a Docker container, or any Node.js host. `middleware.ts` runs on the Edge runtime and is deliberately kept free of Prisma/bcrypt (see `auth.config.ts`) so it stays deployable to edge/serverless environments without bundling issues.

## Background jobs

AI generation currently runs synchronously within the request, tracked by an `AIJob` database record (see `lib/ai/job-runner.ts` for the reasoning). If a task grows slow enough to need a real queue, swap that function's body for a dispatch to your queue of choice (Inngest, BullMQ + a worker process, or a cron-drained table) — the `AIJob` model and every call site are already shaped for it (`PENDING → PROCESSING → COMPLETED/FAILED`, retry support in `/admin/jobs`).

## File storage

Product/store images beyond the placeholders and AI-generated URLs are not yet uploaded to a storage bucket in this build — the `STORAGE_*` environment variables are reserved for that (S3-compatible: AWS S3, Supabase Storage, Cloudinary's S3-compatible endpoint, R2, etc.) but no upload code path exists yet. This is a known gap — see the final report's "Next Steps."

## Monitoring

`lib/logger.ts` writes structured JSON lines to stdout/stderr for: AI job failures, Shopify OAuth outcomes, Stripe webhook receipt and signature failures, and login success/failure. Pipe these to your log aggregator of choice (Datadog, Better Stack, CloudWatch, etc.) — no vendor-specific SDK is wired in.
