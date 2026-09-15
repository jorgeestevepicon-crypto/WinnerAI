import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Settings, History, Search, Store, Sparkles, Megaphone, ShoppingBag, LineChart } from "lucide-react";

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
  { title: "Ad Studio", href: "/ads", icon: Megaphone },
  { title: "Shopify", href: "/shopify", icon: ShoppingBag },
  { title: "Analytics", href: "/analytics", icon: LineChart },
  { title: "Activity", href: "/activity", icon: History },
];

export const bottomNav: NavItem[] = [{ title: "Settings", href: "/settings", icon: Settings }];
