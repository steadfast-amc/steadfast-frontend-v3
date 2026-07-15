import { CheckCircle2, History } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import type { Job, Complaint, User } from "../../types";

export function ServiceHistory() {
  const { data: jobs, isLoading, error, reload } = useFetch<Job[]>(
    () => api.get("/jobs").then((r) => r.data.jobs),
    []
  );

  const completed = (jobs ?? []).filter((j) => ["confirmed", "billed"].includes(j.status));

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Service history" description="Every completed visit at your site(s)." />

      {completed.length === 0 ? (
        <Card><EmptyState icon={History} message="No completed jobs yet." /></Card>
      ) : (
        <div className="space-y-2">
          {completed.map((job) => {
            const complaint = job.complaint as Complaint;
            const engineer = job.engineer as User;
            return (
              <Card key={job._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-100">{job.jobId}</span>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-zinc-400">{complaint?.description}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Engineer: {engineer?.name ?? "—"}
                      {job.verifiedAt && ` · Verified ${new Date(job.verifiedAt).toLocaleDateString("en-IN")}`}
                    </p>
                    {job.materialsUsed.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-600">
                        Materials: {job.materialsUsed.map((m) => `${m.name} ×${m.quantity}`).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
