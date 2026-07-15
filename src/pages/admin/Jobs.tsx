import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Wrench, Download } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { toCsv, downloadCsv } from "../../lib/csv";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { JobStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Label } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BulkToolbar } from "../../components/ui/BulkToolbar";
import type { Job, Complaint, User } from "../../types";

const CSV_COLUMNS = ["jobId", "status"];

// No bulk-import here — jobs only ever come from a triaged complaint being
// assigned to an engineer (see NewJobModal below), never a spreadsheet row.
// Edit is via the job's own detail page. Delete is bulk-toolbar only, and
// the backend refuses to delete "billed" jobs since those are the actual
// billing record — the UI surfaces that instead of silently no-op'ing.
export function Jobs() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { data: jobs, isLoading: isJobsLoading, error, reload } = useFetch<Job[]>(
    () => api.get("/jobs").then((r) => r.data.jobs),
    []
  );
  const { data: allComplaints } = useFetch<Complaint[]>(
    () => api.get("/complaints").then((r) => r.data.complaints),
    []
  );
  const { data: engineers } = useFetch<User[]>(
    () => api.get("/users?role=engineer").then((r) => r.data.users),
    []
  );

  const eligibleComplaints = (allComplaints ?? []).filter((c) =>
    ["triaged", "quote_approved"].includes(c.status)
  );

  if (isJobsLoading) return <div className="text-sm text-zinc-500">Loading jobs…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const allIds = (jobs ?? []).map((j) => j._id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} selected job(s)? Billed jobs are protected and will be skipped.`)) return;
    setIsBulkDeleting(true);
    try {
      const { data } = await api.post("/jobs/bulk-delete", { ids: Array.from(selected) });
      if (data.skippedBilled > 0) {
        toast.error(`${data.deletedCount} deleted, ${data.skippedBilled} skipped (billed jobs can't be deleted)`);
      } else {
        toast.success(`${data.deletedCount} job(s) deleted`);
      }
      setSelected(new Set());
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? (jobs ?? []).filter((j) => selected.has(j._id)) : jobs ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(`jobs-export-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, CSV_COLUMNS));
    toast.success(`Exported ${rows.length} job(s)`);
  }

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Assigned work, execution, and QR+OTP verification status."
        action={
          <div className="flex items-start gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
            <div className="text-right">
              <Button variant="primary" onClick={() => setIsModalOpen(true)} disabled={eligibleComplaints.length === 0}>
                <Plus className="h-4 w-4" /> Assign job
              </Button>
              {/* Fixes UX 6 — the button was just silently disabled with no
                  explanation for why there was nothing to assign. */}
              {eligibleComplaints.length === 0 && (
                <p className="mt-1.5 text-xs text-zinc-600">
                  No complaints ready for assignment — triage a complaint (and approve its quote, if chargeable) first.
                </p>
              )}
            </div>
          </div>
        }
      />

      <Card>
        <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())} onDelete={handleBulkDelete} isDeleting={isBulkDeleting} />
        <CardContent className="p-0">
          {(jobs ?? []).length === 0 ? (
            <EmptyState
              icon={Wrench}
              message={
                eligibleComplaints.length > 0
                  ? "No jobs yet — assign your first one using a ready complaint above."
                  : "No jobs yet. Jobs are created from triaged complaints — check the Complaints page."
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH width="40px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </TH>
                  <TH>Job</TH>
                  <TH>Complaint</TH>
                  <TH>Engineer</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {(jobs ?? []).map((j) => {
                  const complaint = j.complaint as Complaint;
                  const engineer = j.engineer as User;
                  return (
                    <TR key={j._id}>
                      <TD truncate={false}>
                        <input type="checkbox" checked={selected.has(j._id)} onChange={() => toggleOne(j._id)} aria-label={`Select ${j.jobId}`} />
                      </TD>
                      <TD truncate={false}>
                        <Link to={`/admin/jobs/${j._id}`} className="font-medium text-zinc-100 hover:text-accent">
                          {j.jobId}
                        </Link>
                      </TD>
                      <TD className="text-zinc-400">{complaint?.ticketId ?? "—"}</TD>
                      <TD className="text-zinc-400">{engineer?.name ?? "—"}</TD>
                      <TD truncate={false}><JobStatusBadge value={j.status} /></TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        complaints={eligibleComplaints}
        engineers={engineers ?? []}
        onCreated={reload}
      />
    </div>
  );
}

function NewJobModal({
  isOpen,
  onClose,
  complaints,
  engineers,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  complaints: Complaint[];
  engineers: User[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [complaintId, setComplaintId] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/jobs", { complaintId, engineerId });
      toast.success("Job assigned");
      onCreated();
      onClose();
      setComplaintId("");
      setEngineerId("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not create job");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign job"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="new-job-form" type="submit" isLoading={isSubmitting}>
            Assign
          </Button>
        </>
      }
    >
      <form id="new-job-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Complaint</Label>
          <Select required value={complaintId} onChange={(e) => setComplaintId(e.target.value)}>
            <option value="">Select a ready complaint…</option>
            {complaints.map((c) => (
              <option key={c._id} value={c._id}>{c.ticketId} — {c.description.slice(0, 40)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Engineer</Label>
          <Select required value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
            <option value="">Select an engineer…</option>
            {engineers.map((e) => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </Select>
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
