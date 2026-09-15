import { getUsers } from "@/features/admin/server/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SuspendToggle } from "@/features/admin/components/suspend-toggle";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const users = await getUsers(searchParams.q);

  return (
    <div className="space-y-4">
      <form>
        <Input name="q" defaultValue={searchParams.q} placeholder="Search by name or email..." className="max-w-sm" />
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "ADMIN" ? "secondary" : "outline"}>{user.role}</Badge>
                </TableCell>
                <TableCell>{user.subscription?.plan ?? "FREE"}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={user.suspended ? "destructive" : "success"}>{user.suspended ? "Suspended" : "Active"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <SuspendToggle userId={user.id} suspended={user.suspended} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
