import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { GoogleSignInButton } from "@/features/auth/components/google-signin-button";
import { integrations } from "@/config/env";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue building with WinnerAI"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </>
      }
    >
      {integrations.googleConfigured && (
        <div className="mb-4 space-y-4">
          <GoogleSignInButton callbackUrl="/onboarding" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
