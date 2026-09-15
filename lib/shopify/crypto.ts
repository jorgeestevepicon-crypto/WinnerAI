import "server-only";
import crypto from "crypto";
import { env } from "@/config/env";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = env.shopify.tokenEncryptionKey;
  if (!secret) {
    throw new Error("SHOPIFY_TOKEN_ENCRYPTION_KEY is not configured — cannot encrypt/decrypt Shopify access tokens.");
  }
  // Normalize any provided secret to a 32-byte key via SHA-256 rather than
  // requiring the operator to produce an exact-length key.
  return crypto.createHash("sha256").update(secret).digest();
}

/** Encrypts a Shopify access token for storage. Never store raw tokens. */
export function encryptShopifyToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptShopifyToken(payload: string): string {
  const [ivB64, authTagB64, dataB64] = payload.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) throw new Error("Invalid encrypted token payload");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
