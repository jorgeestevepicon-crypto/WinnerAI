import { requireUser } from "@/lib/auth/session";

// Full-screen tool layout (visual editors) — no dashboard sidebar/topbar or
// container padding, since these routes manage their own chrome.
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="h-screen overflow-hidden bg-background">{children}</div>;
}
