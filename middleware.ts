import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Uses the Edge-safe auth config (no Prisma/bcrypt) since middleware runs on
// the Edge runtime. Route handlers and server components use the full config
// from auth.ts instead.
const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/dashboard", "/products", "/store-builder", "/stores", "/orders", "/ads", "/shopify", "/analytics", "/billing", "/settings", "/activity", "/admin", "/onboarding"];
const ADMIN_PREFIXES = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
