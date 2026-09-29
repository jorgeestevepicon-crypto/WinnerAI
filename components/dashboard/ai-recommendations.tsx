import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export async function AIRecommendations() {
  const t = await getTranslations("dashboard.aiRecommendations");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Sparkles}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button size="sm" className="mt-2" asChild>
              <Link href="/analytics">{t("openGrowthAgent")}</Link>
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
