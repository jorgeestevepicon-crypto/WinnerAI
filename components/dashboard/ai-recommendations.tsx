import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function AIRecommendations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Sparkles}
          title="Get data-backed recommendations"
          description="The AI Growth Agent reviews your products, stores and campaigns and suggests next steps — it never acts on its own."
          action={
            <Button size="sm" className="mt-2" asChild>
              <Link href="/analytics">Open Growth Agent</Link>
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
