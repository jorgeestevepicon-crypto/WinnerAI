import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Search,
  Store,
  Megaphone,
  LineChart,
  ShoppingBag,
  Bot,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Search,
    title: "Product Finder",
    description: "Discover potentially winning products, scored by demand, trend, competition and margin.",
  },
  {
    icon: Bot,
    title: "AI Store Builder",
    description: "Generate a brand and a full storefront from a single product in minutes, then edit it visually.",
  },
  {
    icon: Megaphone,
    title: "AI Ad Studio",
    description: "Generate ad copy, creatives and multiple variants across Meta, TikTok, Google and Pinterest.",
  },
  {
    icon: ShoppingBag,
    title: "Shopify Integration",
    description: "Connect your store and publish products directly, with a review checklist before going live.",
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Track revenue, CTR, CPA and ROAS once your ad and store integrations are connected.",
  },
  {
    icon: Sparkles,
    title: "AI Growth Agent",
    description: "Get data-backed recommendations on pricing, creatives and audiences — you stay in control.",
  },
];

const steps = [
  { title: "Find a product", description: "Filter by category, margin, trend and competition." },
  { title: "Build a store", description: "AI generates your brand and homepage from the product." },
  { title: "Create ads", description: "Generate copy and creatives for every platform." },
  { title: "Launch", description: "Publish to Shopify and export your ad assets." },
  { title: "Optimize", description: "Let the AI Growth Agent suggest the next move." },
];

const plans = [
  { name: "Free", price: "$0", description: "Explore the product finder and demo data.", features: ["Limited product searches", "Demo store & ad generation", "Community support"] },
  { name: "Starter", price: "$29", description: "For solo operators launching their first stores.", features: ["Full product finder", "3 stores", "AI copy & creatives", "Shopify connection"] },
  { name: "Pro", price: "$79", description: "For growing teams running multiple stores.", features: ["Everything in Starter", "Unlimited stores", "Bulk ad generation", "AI Growth Agent"] },
  { name: "Agency", price: "$199", description: "For agencies managing multiple brands.", features: ["Everything in Pro", "Multi-user seats", "Priority support", "Advanced analytics"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            WinnerAI
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Start Building</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> AI-powered ecommerce workspace
        </Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Find winning products. Build stores. Create ads. Grow with AI.
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          WinnerAI helps you discover opportunities, launch faster, and iterate with AI-backed recommendations —
          without ever guaranteeing outcomes it can&apos;t promise.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Start Building <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="container py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Everything from product to profit, in one workspace</h2>
          <p className="mt-2 text-muted-foreground">Every module is connected — context flows automatically from one step to the next.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-5">
            {steps.map((step, i) => (
              <div key={step.title} className="space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="container py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Simple, plan-based pricing</h2>
          <p className="mt-2 text-muted-foreground">No credit systems. Limits are based on plan features, not consumable credits.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.name === "Pro" ? "border-primary shadow-md" : undefined}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-semibold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </div>
                ))}
                <Button className="mt-4 w-full" variant={plan.name === "Pro" ? "default" : "outline"} asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t bg-muted/30 py-16">
        <div className="container max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium">Does WinnerAI guarantee sales?</h3>
              <p className="text-sm text-muted-foreground">
                No. WinnerAI surfaces data-backed opportunities and accelerates execution, but it never promises
                revenue, profit, or guaranteed outcomes.
              </p>
            </div>
            <div>
              <h3 className="font-medium">What happens without Shopify or an AI provider configured?</h3>
              <p className="text-sm text-muted-foreground">
                The app runs in demo mode with clearly labeled sample data so you can explore every workflow before
                connecting real integrations.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">Yes, subscriptions can be upgraded, downgraded or canceled from your billing settings at any time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container flex flex-col items-center gap-4 py-24 text-center">
        <Store className="h-10 w-10 text-primary" />
        <h2 className="text-3xl font-semibold tracking-tight">Ready to discover your next opportunity?</h2>
        <Button size="lg" asChild>
          <Link href="/register">
            Start Building <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} WinnerAI. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/register" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
