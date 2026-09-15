"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import type { NavItem } from "@/config/nav";

export function Topbar({
  user,
  isAdmin,
  adminNav,
  title,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  isAdmin: boolean;
  adminNav?: NavItem[];
  title?: string;
}) {
  return (
    <header className="flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      <MobileSidebar isAdmin={isAdmin} adminNav={adminNav} />
      {title && <h1 className="hidden text-lg font-semibold md:block">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden text-muted-foreground sm:flex"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        >
          <Search className="h-4 w-4" />
          Search
          <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        >
          <Search className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
