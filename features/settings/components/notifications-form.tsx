"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPreferences } from "@/features/settings/server/actions";
import type { NotificationPreferences } from "@/features/settings/schemas";

const fields: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "productAlerts", label: "Product alerts", description: "New high-scoring products matching your filters." },
  { key: "storeUpdates", label: "Store updates", description: "Store generation and publishing status changes." },
  { key: "adPerformance", label: "Ad performance", description: "Notable changes in connected ad campaign metrics." },
  { key: "productAnnouncements", label: "Product announcements", description: "New WinnerAI features and updates." },
];

export function NotificationsForm({ initial }: { initial: NotificationPreferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function toggle(key: keyof NotificationPreferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingKey(key);
    const result = await updateNotificationPreferences(next);
    setSavingKey(null);
    if (!result.success) {
      setPrefs(prefs);
      toast.error("Could not save preference");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what WinnerAI notifies you about.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={field.key}>{field.label}</Label>
              <p className="text-sm text-muted-foreground">{field.description}</p>
            </div>
            <Switch
              id={field.key}
              checked={prefs[field.key]}
              disabled={savingKey === field.key}
              onCheckedChange={() => toggle(field.key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
