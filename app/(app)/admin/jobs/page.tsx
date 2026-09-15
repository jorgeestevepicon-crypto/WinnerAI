import { getJobs } from "@/features/admin/server/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetryJobButton } from "@/features/admin/components/retry-job-button";
import { relativeTime } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Jobs" };

const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];

const statusVariant: Record<string, "outline" | "secondary" | "success" | "destructive" | "warning"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  COMPLETED: "success",
  FAILED: "destructive",
  CANCELLED: "outline",
};

export default async function AdminJobsPage({ searchParams }: { searchParams: { status?: string } }) {
  const jobs = await getJobs(searchParams.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={!searchParams.status ? "secondary" : "outline"} size="sm" asChild>
          <Link href="/admin/jobs">All</Link>
        </Button>
        {STATUSES.map((status) => (
          <Button key={status} variant={searchParams.status === status ? "secondary" : "outline"} size="sm" asChild>
            <Link href={`/admin/jobs?status=${status}`}>{status}</Link>
          </Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.type}</TableCell>
                <TableCell className="text-muted-foreground">{job.user.email}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
                </TableCell>
                <TableCell className={cn("max-w-xs truncate text-xs", job.error && "text-destructive")}>{job.error ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{relativeTime(job.updatedAt)}</TableCell>
                <TableCell className="text-right">{job.status === "FAILED" && <RetryJobButton jobId={job.id} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
