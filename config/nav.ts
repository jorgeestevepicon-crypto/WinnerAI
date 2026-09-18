import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Settings, History, Search, Store, Sparkles, Megaphone, ShoppingBag, LineChart, CreditCard, Shield, Package } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// Extended as each phase of WinnerAI ships its routes — keeping this list in
// sync with what actually exists avoids dead links in the sidebar.
export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Product Finder", href: "/products", icon: Search },
  { title: "Store Builder", href: "/store-builder", icon: Sparkles },
  { title: "Stores", href: "/stores", icon: Store },
  { title: "Orders", href: "/orders", icon: Package },
  { title: "Ad Studio", href: "/ads", icon: Megaphone },
  { title: "Shopify", href: "/shopify", icon: ShoppingBag },
  { title: "Analytics", href: "/analytics", icon: LineChart },
  { title: "Billing", href: "/billing", icon: CreditCard },
  { title: "Activity", href: "/activity", icon: History },
];

export const adminNav: NavItem[] = [{ title: "Admin", href: "/admin", icon: Shield }];

export const bottomNav: NavItem[] = [{ title: "Settings", href: "/settings", icon: Settings }];
