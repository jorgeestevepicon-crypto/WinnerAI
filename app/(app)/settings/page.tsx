import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getNotificationPreferences } from "@/features/settings/server/actions";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { AppearanceForm } from "@/features/settings/components/appearance-form";
import { NotificationsForm } from "@/features/settings/components/notifications-form";
import { SecurityForm } from "@/features/settings/components/security-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const sessionUser = await requireUser();

  const [user, subscription, notificationPrefs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    prisma.subscription.findUnique({ where: { userId: sessionUser.id } }),
    getNotificationPreferences(sessionUser.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, appearance and account security.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileForm user={{ name: user.name, email: user.email, image: user.image }} />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Your current WinnerAI subscription plan.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Badge className="text-sm">{subscription?.plan ?? "FREE"}</Badge>
              <span className="text-sm text-muted-foreground">Status: {subscription?.status ?? "ACTIVE"}</span>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceForm />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsForm initial={notificationPrefs} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityForm hasPassword={!!user.passwordHash} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
