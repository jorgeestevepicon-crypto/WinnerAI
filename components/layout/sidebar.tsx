"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { mainNav, bottomNav, adminNav } from "@/config/nav";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const items = isAdmin ? [...mainNav, ...adminNav] : mainNav;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          WinnerAI
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav items={items} />
      </div>
      <div className="border-t px-3 py-4">
        <SidebarNav items={bottomNav} />
      </div>
    </aside>
  );
}
