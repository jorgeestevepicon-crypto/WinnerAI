import { ShoppingBag, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { integrations } from "@/config/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectForm } from "@/features/shopify/components/connect-form";
import { DisconnectButton } from "@/features/shopify/components/disconnect-button";

export const metadata = { title: "Shopify" };

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Shopify is not configured in this environment.",
  invalid_request: "The request from Shopify was missing required parameters.",
  invalid_signature: "Shopify's request signature could not be verified.",
  invalid_state: "This connection attempt expired or could not be verified. Please try again.",
  connection_failed: "Shopify connection failed while exchanging the authorization code.",
};

export default async function ShopifyPage({ searchParams }: { searchParams: { connected?: string; error?: string } }) {
  const user = await requireUser();
  const connections = await prisma.shopifyConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shopify</h1>
        <p className="text-sm text-muted-foreground">Connect your Shopify store to publish products directly.</p>
      </div>

      {searchParams.connected && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Shopify connected successfully.
        </div>
      )}
      {searchParams.error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {ERROR_MESSAGES[searchParams.error] ?? "Something went wrong connecting Shopify."}
        </div>
      )}

      {!integrations.shopifyConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" /> Not configured
            </CardTitle>
            <CardDescription>
              This deployment doesn&apos;t have Shopify API credentials set. Set <code>SHOPIFY_CLIENT_ID</code> and{" "}
              <code>SHOPIFY_CLIENT_SECRET</code> (from a Shopify Partner app) plus <code>SHOPIFY_TOKEN_ENCRYPTION_KEY</code> in your
              environment to enable this integration.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Connect a store
            </CardTitle>
            <CardDescription>Enter your Shopify store domain to start the connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectForm />
          </CardContent>
        </Card>
      )}

      {connections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Connected stores</h2>
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{connection.shopDomain}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={connection.status === "CONNECTED" ? "success" : connection.status === "ERROR" ? "destructive" : "outline"}>
                      {connection.status}
                    </Badge>
                    {connection.lastError && <span className="text-xs text-muted-foreground">{connection.lastError}</span>}
                  </div>
                </div>
                {connection.status === "CONNECTED" && <DisconnectButton connectionId={connection.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
