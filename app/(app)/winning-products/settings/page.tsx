import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOrCreateScoreConfig } from "@/features/winning-products/server/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigForm } from "@/features/winning-products/components/config-form";

export const metadata = { title: "Winning Products Settings" };

export default async function WinningProductsSettingsPage() {
  const user = await requireUser();
  const config = await getOrCreateScoreConfig(user.id);
  const t = await getTranslations("winningProducts.config");

  return (
    <div className="space-y-6">
      <Link href="/winning-products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backLink")}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigForm config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
