import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          title="The AI Growth Agent needs data first"
          description="Once you have stores, ads or analytics connected, the Growth Agent will surface data-backed recommendations here."
        />
      </CardContent>
    </Card>
  );
}
