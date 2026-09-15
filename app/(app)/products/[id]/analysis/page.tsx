import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Users, ShieldAlert, TrendingUp, Target } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getProductById } from "@/features/products/server/queries";
import { integrations } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { AnalyzeButton } from "@/features/products/components/analyze-button";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Product Analysis" };

export default async function ProductAnalysisPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const product = await getProductById(params.id);
  if (!product || product.userId !== user.id) notFound();

  const analysis = product.analyses[0];
  const targetAudience = analysis?.targetAudience as { description?: string; ageRange?: string; interests?: string[] } | null;
  const competitors = analysis?.competitors as { name: string; notes: string }[] | null;
  const aiVerdict = analysis?.aiVerdict as
    | { opportunity?: string; risks?: string; strategy?: string; audience?: string; recommendedPrice?: string; positioning?: string }
    | null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/products/${product.id}`}>
          <ArrowLeft className="h-4 w-4" /> Back to product
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
          <p className="text-sm text-muted-foreground">AI-assisted product analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={integrations.aiConfigured ? "secondary" : "outline"}>
            {integrations.aiConfigured ? "AI Generated" : "AI Generated · Demo"}
          </Badge>
          <AnalyzeButton productId={product.id} hasAnalysis={!!analysis} />
        </div>
      </div>

      {!analysis ? (
        <EmptyState
          icon={Sparkles}
          title="No analysis yet"
          description="Run the AI analyzer to get a target audience, marketing angles, competitors and an AI verdict for this product."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-primary/40 bg-accent/30 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Verdict
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Opportunity</p>
                <p className="text-sm">{aiVerdict?.opportunity}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Risks</p>
                <p className="text-sm">{aiVerdict?.risks}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Strategy</p>
                <p className="text-sm">{aiVerdict?.strategy}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Positioning</p>
                <p className="text-sm">{aiVerdict?.positioning}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Audience</p>
                <p className="text-sm">{aiVerdict?.audience}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Recommended price</p>
                <p className="text-sm">{aiVerdict?.recommendedPrice}</p>
              </div>
              <p className="col-span-full text-xs text-muted-foreground">
                This is an AI-generated estimate based on available data. It is not a guarantee of sales, revenue or profit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{targetAudience?.description}</p>
              <p className="text-muted-foreground">Age range: {targetAudience?.ageRange}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {targetAudience?.interests?.map((i) => (
                  <Badge key={i} variant="outline">
                    {i}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" /> Marketing Angles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {analysis.marketingAngles.map((angle) => (
                  <li key={angle}>{angle}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4" /> Objections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {analysis.objections.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Advantages</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {analysis.advantages.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" /> Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {analysis.opportunities.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {analysis.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Competitors</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {competitors?.map((c) => (
                <div key={c.name} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted-foreground">{c.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Recommended price & positioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Recommended price: {formatCurrency(analysis.recommendedPrice, product.currency)}</p>
              <p className="text-muted-foreground">{analysis.positioning}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
