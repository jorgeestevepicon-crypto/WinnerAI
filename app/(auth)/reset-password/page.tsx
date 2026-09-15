import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = { title: "Set a new password" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  const { token, email } = searchParams;

  if (!token || !email) {
    return (
      <AuthCard title="Invalid link" description="This password reset link is missing required information.">
        <p className="text-sm text-muted-foreground">Request a new link from the forgot password page.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description={`Resetting password for ${email}`}>
      <ResetPasswordForm email={email} token={token} />
    </AuthCard>
  );
}
