import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOrCreateScoreConfig } from "@/features/winning-products/server/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigForm } from "@/features/winning-products/components/config-form";

export const metadata = { title: "Winning Products Settings" };

export default async function WinningProductsSettingsPage() {
  const user = await requireUser();
  const config = await getOrCreateScoreConfig(user.id);

  return (
    <div className="space-y-6">
      <Link href="/winning-products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Winning Products
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Winning Products settings</h1>
        <p className="text-sm text-muted-foreground">One place to tune the scoring weights and thresholds used for every candidate.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scoring configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigForm config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
