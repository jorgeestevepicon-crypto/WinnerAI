import { getSystemStatus } from "@/features/admin/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin · System" };

export default function AdminSystemPage() {
  const status = getSystemStatus();

  const integrations = [
    { label: "AI provider", configured: status.integrations.ai },
    { label: "AI image provider", configured: status.integrations.aiImage },
    { label: "Shopify", configured: status.integrations.shopify },
    { label: "Stripe", configured: status.integrations.stripe },
    { label: "S3-compatible storage", configured: status.integrations.s3Storage },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span>Demo mode</span>
          <Badge variant={status.demoMode ? "secondary" : "outline"}>{status.demoMode ? "Enabled" : "Disabled"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {integrations.map((i) => (
            <div key={i.label} className="flex items-center justify-between text-sm">
              <span>{i.label}</span>
              <Badge variant={i.configured ? "success" : "outline"}>{i.configured ? "Configured" : "Not configured"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
