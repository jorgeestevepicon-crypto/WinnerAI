import { requireUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl py-6">{children}</div>
        </main>
      </div>
      <CommandPalette isAdmin={isAdmin} />
    </div>
  );
}
