import { describe, expect, it } from "vitest";
import { encryptShopifyToken, decryptShopifyToken } from "@/lib/shopify/crypto";
import { verifyShopifyHmac, isValidShopDomain } from "@/lib/shopify/oauth";
import { createOAuthState, verifyOAuthState } from "@/lib/shopify/state";
import crypto from "crypto";

describe("Shopify token encryption", () => {
  it("round-trips a token through encrypt/decrypt", () => {
    const token = "shpat_abcdef1234567890";
    const encrypted = encryptShopifyToken(token);
    expect(encrypted).not.toContain(token);
    expect(decryptShopifyToken(encrypted)).toBe(token);
  });

  it("produces different ciphertext for the same token each time (random IV)", () => {
    const token = "shpat_abcdef1234567890";
    const a = encryptShopifyToken(token);
    const b = encryptShopifyToken(token);
    expect(a).not.toBe(b);
  });

  it("throws on a tampered payload", () => {
    const encrypted = encryptShopifyToken("shpat_abcdef1234567890");
    const tampered = encrypted.slice(0, -4) + "abcd";
    expect(() => decryptShopifyToken(tampered)).toThrow();
  });
});

describe("isValidShopDomain", () => {
  it("accepts valid myshopify.com domains", () => {
    expect(isValidShopDomain("my-cool-store.myshopify.com")).toBe(true);
  });

  it("rejects non-myshopify domains", () => {
    expect(isValidShopDomain("evil.com")).toBe(false);
    expect(isValidShopDomain("my-store.myshopify.com.evil.com")).toBe(false);
    expect(isValidShopDomain("")).toBe(false);
  });
});

describe("verifyShopifyHmac", () => {
  const secret = process.env.SHOPIFY_CLIENT_SECRET!;

  function sign(params: Record<string, string>) {
    const message = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    return crypto.createHmac("sha256", secret).update(message).digest("hex");
  }

  it("accepts a correctly signed request", () => {
    const params = { shop: "test.myshopify.com", code: "abc123", timestamp: "1700000000" };
    const hmac = sign(params);
    expect(verifyShopifyHmac({ ...params, hmac })).toBe(true);
  });

  it("rejects a tampered request", () => {
    const params = { shop: "test.myshopify.com", code: "abc123", timestamp: "1700000000" };
    const hmac = sign(params);
    expect(verifyShopifyHmac({ ...params, code: "tampered", hmac })).toBe(false);
  });

  it("rejects a request with no hmac", () => {
    expect(verifyShopifyHmac({ shop: "test.myshopify.com" })).toBe(false);
  });
});

describe("OAuth state signing", () => {
  it("round-trips a valid state", () => {
    const state = createOAuthState("user_123");
    const verified = verifyOAuthState(state);
    expect(verified?.userId).toBe("user_123");
  });

  it("rejects a tampered state", () => {
    const state = createOAuthState("user_123");
    const [payload] = state.split(".");
    const tampered = `${payload}.invalidsignature`;
    expect(verifyOAuthState(tampered)).toBeNull();
  });

  it("rejects a malformed state", () => {
    expect(verifyOAuthState("not-a-valid-state")).toBeNull();
  });
});
