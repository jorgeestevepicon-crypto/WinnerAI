import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma, no bcrypt, no providers that touch the
// database directly. This is what middleware.ts runs on the Edge runtime.
// The full config (auth.ts) extends this with the database-backed providers
// and only runs in the Node.js runtime (route handlers, server components).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
