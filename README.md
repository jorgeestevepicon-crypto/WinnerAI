# WinnerAI

An AI-powered ecommerce workspace: discover potentially winning products, analyze them, generate an AI store and brand, produce ad copy and creatives, publish to Shopify, and get data-backed growth recommendations — all in one connected flow.

WinnerAI never guarantees sales, profit, or revenue. Every score, price recommendation, and AI-generated claim is clearly labeled as an estimate, and social proof / testimonial sections always ship as explicit placeholders rather than fabricated content.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript + React 18
- **Styling:** Tailwind CSS + shadcn/ui-style components (Radix primitives)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js v5 (Credentials + optional Google), JWT sessions
- **Validation:** Zod (every server action input, every AI provider output)
- **State:** Zustand (visual editor only), React Server Components elsewhere
- **AI:** provider-abstracted (OpenAI / Anthropic / demo), see [docs/ai.md](docs/ai.md)
- **Commerce:** Shopify Admin API (OAuth), see [docs/shopify.md](docs/shopify.md)
- **Billing:** Stripe (Checkout + Billing Portal + webhooks)
- **Testing:** Vitest (unit), Playwright (installed for E2E)

## Architecture

Modular monolith — see [docs/architecture.md](docs/architecture.md) for the full breakdown. In short:

```
app/            Routes only — no business logic
components/     Shared UI (shadcn-style primitives, layout, dashboard widgets)
features/       One folder per domain (products, stores, ads, shopify, billing,
                admin, auth, settings, onboarding, analytics), each with
                components/, server/ (actions + queries), and schemas.ts
lib/            Cross-cutting infrastructure: db, ai, shopify, stripe, auth,
                analytics, logger
prisma/         Schema + migrations + seed script
config/         env.ts (typed env access + integration-availability flags), nav.ts
tests/          Vitest unit tests + setup
```

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local or hosted)

### 2. Install

```bash
npm install
cp .env.example .env
```

Fill in `.env` — at minimum set `DATABASE_URL` and `AUTH_SECRET` (generate one with `openssl rand -base64 32`). Everything else is optional: **the app runs fully in demo mode with every other variable left blank** (see [Demo mode](#demo-mode) below).

### 3. Database

```bash
npx prisma migrate dev
```

This creates all tables. To promote a registered user to admin:

```bash
npm run db:seed -- you@example.com
```

(Or set `ADMIN_EMAIL` in `.env` before that user registers — they'll be made an admin automatically.)

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, register an account, and you're in.

## Environment variables

See [`.env.example`](.env.example) for the complete, commented list. Nothing beyond `DATABASE_URL` and `AUTH_SECRET` is required to run the app — every external integration (real AI provider, Shopify, Stripe, S3 storage) is optional and the corresponding feature clearly shows a "not configured" state instead of faking success when its variables are blank.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Signs session JWTs and the Shopify OAuth state token |
| `ADMIN_EMAIL` | No | Auto-promotes this email to `ADMIN` on registration |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | No | Real text generation (OpenAI or Anthropic). Defaults to a deterministic demo provider. |
| `AI_IMAGE_PROVIDER`, `AI_IMAGE_API_KEY` | No | Real ad image generation (OpenAI/DALL-E). Defaults to a labeled placeholder. |
| `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_TOKEN_ENCRYPTION_KEY` | No | Real Shopify OAuth + publishing |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | No | Real billing checkout |
| `STORAGE_*` | No | S3-compatible storage for uploaded images |
| `DEMO_MODE` | No | Defaults to `true`; informational flag surfaced in `/admin/system` |

## Demo mode

WinnerAI is designed to be fully explorable with zero external credentials:

- **Product Finder** ships a real (not fake) demo catalog adapter — 18 realistic products with deterministic scoring signals, normalized and scored through the same Winning Score engine real sources would use.
- **AI services** (product analysis, brand/store generation, ad copy, video concepts, growth recommendations) run through a demo provider that produces genuinely product-aware, schema-validated content — not lorem ipsum — with zero network calls.
- **Ad images** render a clearly labeled SVG placeholder ("AI Generated — Demo placeholder") instead of a fake photo.
- **Shopify, Stripe, and real ad/analytics platforms** show an explicit "not configured" state naming exactly which environment variables to set — the app never pretends a disabled integration is connected.

## Testing

```bash
npm run test        # Vitest unit tests (Winning Score engine, Shopify crypto/OAuth, AI service schema validation)
npm run typecheck   # tsc --noEmit
npm run lint         # ESLint
npm run build        # Production build
```

Playwright is installed for end-to-end testing (`npx playwright test` once E2E specs are added under `tests/e2e/`); every phase of this build was also verified with ad-hoc headless Playwright runs against a real dev server and database during development.

## Documentation

- [docs/architecture.md](docs/architecture.md) — module layout, data flow, the Store JSON schema, the AI Context Engine
- [docs/ai.md](docs/ai.md) — the AI provider abstraction, adding a new AI service, demo vs. real providers
- [docs/shopify.md](docs/shopify.md) — OAuth flow, token encryption, publishing, required scopes
- [docs/deployment.md](docs/deployment.md) — deploying to production, environment checklist, Stripe webhook setup

## Security

- Every server action authenticates via `requireUser()`/`requireAdmin()` and scopes reads/writes to the caller's own data (IDOR checks throughout `features/*/server/`).
- Shopify access tokens are AES-256-GCM encrypted at rest; OAuth callbacks verify Shopify's HMAC signature and a self-signed, expiring state token.
- Stripe webhooks verify the signature before trusting any event data.
- All AI provider output (real or demo) is validated against a Zod schema before it's ever written to the database — a model's raw JSON is never trusted directly.
- Passwords are hashed with bcrypt (cost 12); password reset tokens are single-use, expire in 1 hour, and the reset link itself is never returned over the wire.

This codebase went through a full security review during development — see the commit history for the findings (one HIGH, two LOW) and fixes.

## License

Private — not licensed for redistribution.
