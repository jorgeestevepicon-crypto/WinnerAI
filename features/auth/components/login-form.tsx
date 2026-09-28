"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already registered. Sign in with your password once, then Google will work too.",
  AccessDenied: "Access denied by the provider.",
  Configuration: "Sign-in isn't configured correctly. Please try again later.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    toast.error(OAUTH_ERROR_MESSAGES[error] ?? "Sign-in failed. Please try again.");
  }, [searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setSubmitting(false);

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot password?
                </a>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </Form>
  );
}
