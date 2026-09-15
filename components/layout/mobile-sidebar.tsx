"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { mainNav, bottomNav, type NavItem } from "@/config/nav";

export function MobileSidebar({ isAdmin, adminNav }: { isAdmin: boolean; adminNav?: NavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const items = isAdmin ? [...mainNav, ...(adminNav ?? [])] : mainNav;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 justify-center border-b px-6">
          <SheetTitle asChild>
            <Link href="/dashboard" className="flex items-center gap-2 text-left font-semibold" onClick={() => setOpen(false)}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              WinnerAI
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex h-[calc(100%-4rem)] flex-col justify-between px-3 py-4">
          <SidebarNav items={items} onNavigate={() => setOpen(false)} />
          <SidebarNav items={bottomNav} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
