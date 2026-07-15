import { useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, MapPin, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { JobStatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { cn } from "../../lib/utils";
import type { Job, Complaint, Contract } from "../../types";

const TABS = [
  { key: "active", label: "Active", statuses: ["assigned", "in_progress"] },
  { key: "pending", label: "Pending", statuses: ["pending_confirmation"] },
  { key: "history", label: "History", statuses: ["confirmed", "disputed", "billed"] },
] as const;

export function MyJobs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("active");
  const { data: jobs, isLoading, error, reload } = useFetch<Job[]>(
    () => api.get("/jobs").then((r) => r.data.jobs),
    []
  );

  const activeTab = TABS.find((t) => t.key === tab)!;
  const filtered = (jobs ?? []).filter((j) => activeTab.statuses.includes(j.status as never));

  return (
    <div>
      {/* Tab bar — thumb-friendly, full-width on mobile */}
      <div className="mb-4 flex rounded-lg border border-zinc-800 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-zinc-900 text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} message={`No ${activeTab.label.toLowerCase()} jobs.`} />
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const complaint = job.complaint as Complaint;
            const contract = job.contract as Contract;
            return (
              <Link
                key={job._id}
                to={`/engineer/jobs/${job._id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-700"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">{job.jobId}</span>
                    <JobStatusBadge value={job.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">{complaint?.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                    <MapPin className="h-3 w-3" /> {contract?.siteAddress}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
