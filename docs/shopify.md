# Shopify integration

## Setup

1. Create a custom app in the [Shopify Partner dashboard](https://partners.shopify.com) (or a custom app on the store itself for a single-store integration).
2. Set the app's redirect URL to `{SHOPIFY_APP_URL}/api/shopify/callback`.
3. Request scopes: `read_products`, `write_products`, `read_orders` (matches `REQUIRED_SCOPES` in `lib/shopify/oauth.ts`).
4. Set in `.env`:
   ```
   SHOPIFY_CLIENT_ID=...
   SHOPIFY_CLIENT_SECRET=...
   SHOPIFY_API_VERSION=2024-10
   SHOPIFY_APP_URL=https://your-deployed-domain.com
   SHOPIFY_TOKEN_ENCRYPTION_KEY=<any long random string>
   ```

Until these are set, `/shopify` shows an explicit "not configured" state — no fake "connected" UI, and the connect form is hidden entirely.

## OAuth flow

```
User enters shop domain on /shopify
  → getShopifyAuthUrl() validates the domain (^[a-z0-9-]+\.myshopify\.com$),
    signs a state token (createOAuthState — HMAC'd with AUTH_SECRET, 10-minute expiry)
  → browser redirects to https://{shop}/admin/oauth/authorize
  → Shopify redirects back to /api/shopify/callback with code, shop, state, hmac
  → route handler verifies:
      1. shop domain format
      2. Shopify's HMAC signature over the query params (verifyShopifyHmac)
      3. the state token's signature and expiry (verifyOAuthState)
  → exchangeCodeForToken() swaps the code for an access token
  → token is encrypted (AES-256-GCM, lib/shopify/crypto.ts) and stored in
    ShopifyConnection.accessTokenEncrypted — never stored or logged in plaintext
  → redirects to /shopify?connected=true
```

Every verification step fails closed (redirects to `/shopify?error=...` with a specific reason) rather than proceeding on missing/invalid data.

## The Admin API client

`lib/shopify/client.ts#ShopifyClient` wraps the REST Admin API for one connected shop: `getShop()`, `listProducts()`, `listOrders()`, `createProduct()`, `updateProduct()`, `publishProduct()`. Every call decrypts the stored token just-in-time via `decryptShopifyToken()`.

## Publishing a store

`features/stores/server/publish.ts`:

1. `getPublishChecklist(storeId)` computes real completeness flags from the store document and linked product — title, description, images, price, shipping, theme, SEO, policies. `/stores/[id]/publish` shows this before allowing a publish.
2. `publishStoreToShopify(storeId, connectionId)` builds a Shopify product payload from the Store JSON document (brand name → title, product section's description → body HTML, linked Product's images/price → variant), creates it as a draft, then publishes it (`status: active`).
3. On success, `Store.status` becomes `PUBLISHED` and `Store.shopifyDomain` is set.

The UI shows a staged progress indicator (Preparing → Uploading → Configuring → Publishing → Completed) around this real API call sequence.

## Analytics

`lib/analytics/adapters/shopify-adapter.ts` pulls real orders (`listOrders`) for a connected shop and aggregates daily revenue/order counts — this is the one analytics adapter that's actually wired to a real API (the others — Meta/TikTok/Google/Pinterest Ads — are disabled stubs pending their respective credentials). `/analytics` only shows numbers once this (or another configured adapter) actually returns data; otherwise it says "Awaiting real campaign data."

## Testing without a real Shopify Partner account

This repository's automated tests exercise the pure, credential-free logic: HMAC verification, state-token signing/tamper-detection, shop domain validation, and AES-256-GCM encrypt/decrypt round-tripping (`tests/unit/shopify.test.ts`). The live OAuth exchange and Admin API calls require a real Shopify Partner app and store, and have not been exercised end-to-end against Shopify's servers in this environment — the connect flow, product creation and publish calls are implemented against Shopify's documented API contracts but should be smoke-tested against a real development store before going live.
