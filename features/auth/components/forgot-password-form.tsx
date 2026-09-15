"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { requestPasswordReset } from "@/features/auth/server/reset-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({ email: z.string().email() });

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null | undefined>(undefined);

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: z.infer<typeof schema>) {
    setSubmitting(true);
    const result = await requestPasswordReset(values);
    setSubmitting(false);
    if (result.success) {
      setResetUrl(result.resetUrl);
    }
  }

  if (resetUrl !== undefined) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          If an account exists for that email, a reset link has been issued. WinnerAI does not have a transactional
          email provider configured yet, so in this environment the link is shown here directly instead of being
          emailed.
        </p>
        {resetUrl && (
          <a href={resetUrl} className="block break-all rounded-md border bg-muted p-3 text-primary underline">
            {resetUrl}
          </a>
        )}
      </div>
    );
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
                <Input type="email" placeholder="you@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
    </Form>
  );
}
