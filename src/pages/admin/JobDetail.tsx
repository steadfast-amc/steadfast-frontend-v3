import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { JobStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { PhotoGallery } from "../../components/ui/PhotoGallery";
import type { Job, Complaint, User, Contract } from "../../types";

export function JobDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [isResolving, setIsResolving] = useState(false);
  const { data: job, isLoading, error, reload } = useFetch<Job>(
    () => api.get(`/jobs/${id}`).then((r) => r.data.job),
    [id]
  );

  async function resolveDispute() {
    setIsResolving(true);
    try {
      await api.post(`/jobs/${id}/resolve-dispute`);
      toast.success("Dispute resolved — job confirmed and billed");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not resolve dispute");
    } finally {
      setIsResolving(false);
    }
  }

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!job) return <div className="text-sm text-zinc-500">Job not found.</div>;

  const complaint = job.complaint as Complaint;
  const engineer = job.engineer as User;
  const client = job.client as User;
  const contract = job.contract as Contract;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{job.jobId}</h2>
          <p className="text-sm text-zinc-500">
            {client?.name} · {contract?.siteAddress} · Engineer: {engineer?.name}
          </p>
        </div>
        <JobStatusBadge value={job.status} />
      </div>

      {/* Fixes MISSING 2 / LOGIC 1 — a disputed job was previously a
          permanent dead end with no resolution path anywhere in the UI. */}
      {job.status === "disputed" && job.disputeReason && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Dispute raised</p>
                <p className="mt-0.5 text-sm text-zinc-400">{job.disputeReason}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" className="mt-3" onClick={resolveDispute} isLoading={isResolving}>
              <ShieldCheck className="h-3.5 w-3.5" /> Resolve dispute & confirm job
            </Button>
            <p className="mt-2 text-xs text-zinc-600">
              This confirms the job as-is, deducts inventory, and generates the bill. Use this once you've
              followed up with the client/engineer and the dispute is settled.
            </p>
          </CardContent>
        </Card>
      )}

      {job.status === "confirmed" && job.verifiedBy && (
        <Card className="mb-4">
          <CardContent className="flex items-start gap-2 py-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-100">Verified by {job.verifiedBy.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {job.verifiedAt && new Date(job.verifiedAt).toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader><CardTitle>Related complaint</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300">{complaint?.description}</p>
          <Link to={`/admin/complaints/${complaint?._id}`} className="mt-2 inline-block text-xs text-zinc-500 hover:text-accent">
            View complaint {complaint?.ticketId} →
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Materials used</CardTitle></CardHeader>
        <CardContent>
          {job.materialsUsed.length === 0 ? (
            <p className="text-sm text-zinc-500">No materials logged yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-900">
              {job.materialsUsed.map((m, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-300">{m.name} × {m.quantity}</span>
                  <span className="font-medium text-zinc-100">₹{(m.quantity * m.unitCost).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Evidence photos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <PhotoGroup label="Before" urls={job.photosBefore} />
            <PhotoGroup label="After" urls={job.photosAfter} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PhotoGroup({ label, urls }: { label: string; urls: string[] }) {
  return (
    <div className="col-span-2">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      {urls.length === 0 ? (
        <p className="text-sm text-zinc-600">None uploaded</p>
      ) : (
        <PhotoGallery urls={urls} label={`${label} photo`} />
      )}
    </div>
  );
}
