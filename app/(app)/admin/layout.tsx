import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/ai", label: "AI" },
  { href: "/admin/system", label: "System" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Workspace-wide management. Visible only to admins.</p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b pb-2">
        {ADMIN_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
