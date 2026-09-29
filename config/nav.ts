import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Settings, History, Search, Store, Sparkles, Megaphone, ShoppingBag, LineChart, CreditCard, Shield, Package, TrendingUp } from "lucide-react";

export interface NavItem {
  /** Key inside the "nav" namespace in messages/*.json — components render this via useTranslations("nav"), not a hardcoded label. */
  titleKey: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// Extended as each phase of WinnerAI ships its routes — keeping this list in
// sync with what actually exists avoids dead links in the sidebar.
export const mainNav: NavItem[] = [
  { titleKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { titleKey: "productFinder", href: "/products", icon: Search },
  { titleKey: "winningProducts", href: "/winning-products", icon: TrendingUp },
  { titleKey: "storeBuilder", href: "/store-builder", icon: Sparkles },
  { titleKey: "stores", href: "/stores", icon: Store },
  { titleKey: "orders", href: "/orders", icon: Package },
  { titleKey: "adStudio", href: "/ads", icon: Megaphone },
  { titleKey: "shopify", href: "/shopify", icon: ShoppingBag },
  { titleKey: "analytics", href: "/analytics", icon: LineChart },
  { titleKey: "billing", href: "/billing", icon: CreditCard },
  { titleKey: "activity", href: "/activity", icon: History },
];

export const adminNav: NavItem[] = [{ titleKey: "admin", href: "/admin", icon: Shield }];

export const bottomNav: NavItem[] = [{ titleKey: "settings", href: "/settings", icon: Settings }];
