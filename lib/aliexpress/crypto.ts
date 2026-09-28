import "server-only";
import crypto from "crypto";
import { env } from "@/config/env";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  if (!env.auth.secret) {
    throw new Error("AUTH_SECRET is not configured — cannot encrypt/decrypt AliExpress tokens.");
  }
  // Derived from AUTH_SECRET with a fixed label so this key never collides
  // with any other token type encrypted from the same secret.
  return crypto.createHash("sha256").update(`${env.auth.secret}:aliexpress`).digest();
}

/** Encrypts an AliExpress OAuth token for storage. Never store raw tokens. */
export function encryptAliExpressToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptAliExpressToken(payload: string): string {
  const [ivB64, authTagB64, dataB64] = payload.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) throw new Error("Invalid encrypted token payload");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
