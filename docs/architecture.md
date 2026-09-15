# Architecture

WinnerAI is a modular monolith: one Next.js app, organized by domain rather than by technical layer, with a clear separation between routes (thin), business logic (in `features/*/server`), and cross-cutting infrastructure (`lib/`).

## Why a monolith

The spec explicitly calls for avoiding premature microservice complexity. Every domain (products, stores, ads, shopify, billing, admin) lives in its own `features/<domain>/` folder with the same internal shape, so splitting any one of them into a separate service later is a matter of moving a folder, not a rewrite.

## Directory layout

```
app/                          Routes only. Route groups control layout, not URLs:
  (auth)/                       login, register, forgot/reset password — centered card layout
  (onboarding)/                 5-step wizard — full-screen, no dashboard chrome
  (app)/                        everything behind the dashboard shell (sidebar/topbar/command palette)
  (editor)/                     the Store visual editor — full-screen, its own toolbar, no dashboard chrome
  api/                          route handlers (NextAuth, Shopify OAuth callback, Stripe webhook)

components/
  ui/                          shadcn-style primitives (button, dialog, table, form, ...)
  layout/                      sidebar, topbar, mobile sheet nav, command palette, user menu
  dashboard/                   dashboard widgets (composition only — no data fetching logic)
  shared/                      cross-feature bits (EmptyState, WinningScoreBadge)

features/<domain>/
  schemas.ts                   Zod schemas for this domain's inputs/outputs
  types/                       plain TS types (e.g. product adapter contracts)
  components/                  domain UI (client components)
  server/
    actions.ts                 "use server" mutations — always requireUser()/requireAdmin() first,
                                always scope by userId, always Zod-validate input
    queries.ts                 read-only Prisma queries, "server-only", always scoped by userId

lib/
  db/prisma.ts                 Prisma client singleton
  auth/session.ts              requireUser() / requireAdmin() / getCurrentUser()
  ai/                          provider abstraction — see docs/ai.md
  shopify/                     OAuth, HMAC verification, token encryption, Admin API client
  stripe/                      lazy Stripe client (returns null if unconfigured)
  analytics/adapters/          same adapter pattern as product sources, for revenue/CTR/ROAS data
  activity/log.ts              writes ActivityLog rows shown on /activity
  logger.ts                    structured JSON logging (never logs secrets/passwords/full tokens)

config/
  env.ts                       the ONLY place that reads process.env; exposes typed values plus
                                `integrations.*Configured` booleans every feature checks before
                                claiming a real integration is active
  nav.ts                       sidebar/command-palette route list — kept in sync with what's shipped
```

## The golden path

```
Product Finder → Product Analyzer → Winning Score
      → Store Builder → Brand + Store generation → Visual Editor → Publish to Shopify
      → Ad Studio → Copy + Creatives → Ad Library
      → Analytics → AI Growth Agent → back to Product Finder
```

Each step hands context forward automatically:

- Clicking **Analyze** on a product carries its id into `/products/[id]/analysis`.
- Clicking **Create Store** carries the product into `/store-builder?productId=...`, which pulls in the product's title, price, category, and any existing AI analysis (marketing angles, advantages, objections) to seed the brand/content generation.
- Clicking **Generate Ads** does the same for the Ad Studio's campaign wizard.
- The AI Growth Agent reads the user's actual products, stores and campaigns and links its recommendations straight back to the relevant page.

`lib/ai/context.ts` (`buildAIContext`) is the shared function that composes this cross-feature context — product, its latest analysis, linked store/brand, and existing ad campaigns for a product — so new AI services don't need to re-fetch and re-assemble it themselves.

## Data model highlights (see `prisma/schema.prisma` for the full schema)

- **Product** is scoped by `userId` — each user's Product Finder search creates their own rows (even against the shared demo catalog), so there's no cross-tenant data leakage in what should be a personal discovery list.
- **Store.document** (JSON, validated by `features/stores/schemas.ts#storeDocumentSchema`) is the single source of truth for a store's brand, theme and sections — never raw AI-generated HTML. `StoreSection` rows are a queryable projection of the same data, kept in sync on every save. `StoreVersion` is an append-only history used by undo-via-version-restore.
- **AdCampaign → AdCreative → AdVariant** models one campaign having multiple creative sets (a style + format combination), each with multiple copy variants (angle/hook/headline/CTA) and optionally a generated image.
- **AIJob** gives every AI generation a durable `PENDING → PROCESSING → COMPLETED/FAILED` record, visible in `/admin/jobs`, without standing up a separate queue worker (see `lib/ai/job-runner.ts` for the tradeoff this makes and how to swap in a real queue later).

## Adapter pattern (used twice)

Both `features/products/server/adapters/` (product sources: demo catalog + disabled AliExpress/Amazon/Google Trends/Meta Ad Library/TikTok stubs) and `lib/analytics/adapters/` (analytics sources: real Shopify orders + disabled Meta/TikTok/Google/Pinterest Ads stubs) follow the same shape:

```ts
interface Adapter {
  id: string;
  label: string;
  configured: boolean;          // false until credentials exist
  disabledReason?: string;      // exactly which env vars are missing
  fetch(...): Promise<Normalized[]>;
}
```

Adding a real integration means writing one new adapter file and registering it — the Product Finder / Analytics pages never need to change.
