// Central place that reads process.env and exposes typed, safe values plus
// derived "is this integration configured" flags. Never import this file
// into a client component — some values are server-only secrets.

function bool(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  demoMode: bool(process.env.DEMO_MODE, true),

  auth: {
    secret: process.env.AUTH_SECRET,
    url: process.env.AUTH_URL || "http://localhost:3000",
    googleId: process.env.AUTH_GOOGLE_ID,
    googleSecret: process.env.AUTH_GOOGLE_SECRET,
    adminEmail: process.env.ADMIN_EMAIL,
  },

  ai: {
    provider: (process.env.AI_PROVIDER || "demo") as "demo" | "openai" | "anthropic",
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    imageProvider: (process.env.AI_IMAGE_PROVIDER || "demo") as "demo" | "openai",
    imageApiKey: process.env.AI_IMAGE_API_KEY,
  },

  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    apiVersion: process.env.SHOPIFY_API_VERSION || "2024-10",
    appUrl: process.env.SHOPIFY_APP_URL || "http://localhost:3000",
    tokenEncryptionKey: process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    prices: {
      starter: process.env.STRIPE_PRICE_STARTER,
      pro: process.env.STRIPE_PRICE_PRO,
      agency: process.env.STRIPE_PRICE_AGENCY,
    },
  },

  storage: {
    provider: (process.env.STORAGE_PROVIDER || "local") as "local" | "s3",
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION,
    bucket: process.env.STORAGE_BUCKET,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
  },
} as const;

export const integrations = {
  get aiConfigured() {
    return env.ai.provider !== "demo" && !!env.ai.apiKey;
  },
  get aiImageConfigured() {
    return env.ai.imageProvider !== "demo" && !!env.ai.imageApiKey;
  },
  get shopifyConfigured() {
    return !!env.shopify.clientId && !!env.shopify.clientSecret;
  },
  get stripeConfigured() {
    return !!env.stripe.secretKey;
  },
  get s3StorageConfigured() {
    return (
      env.storage.provider === "s3" &&
      !!env.storage.endpoint &&
      !!env.storage.bucket &&
      !!env.storage.accessKey &&
      !!env.storage.secretKey
    );
  },
};
