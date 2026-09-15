import { getSystemStatus } from "@/features/admin/server/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin · AI" };

export default function AdminAIPage() {
  const status = getSystemStatus();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Text generation</CardTitle>
          <CardDescription>Configured via AI_PROVIDER, AI_API_KEY and AI_MODEL environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Provider</span>
            <Badge variant={status.integrations.ai ? "secondary" : "outline"}>{status.aiProvider}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Model</span>
            <span className="text-muted-foreground">{status.aiModel}</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <Badge variant={status.integrations.ai ? "success" : "outline"}>{status.integrations.ai ? "Configured" : "Demo mode"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Image generation</CardTitle>
          <CardDescription>Configured via AI_IMAGE_PROVIDER and AI_IMAGE_API_KEY.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Provider</span>
            <Badge variant={status.integrations.aiImage ? "secondary" : "outline"}>{status.aiImageProvider}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <Badge variant={status.integrations.aiImage ? "success" : "outline"}>{status.integrations.aiImage ? "Configured" : "Demo mode"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompts</CardTitle>
          <CardDescription>Every AI service&apos;s system prompt and demo generator lives in code under lib/ai/services/, versioned with the app.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
