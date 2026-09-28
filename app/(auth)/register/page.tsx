import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { GoogleSignInButton } from "@/features/auth/components/google-signin-button";
import { integrations } from "@/config/env";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start discovering winning products in minutes"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
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
      <RegisterForm />
    </AuthCard>
  );
}
