import { useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Download } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { toCsv, downloadCsv } from "../../lib/csv";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { SeverityBadge, ComplaintStatusBadge, BillingTypeBadge } from "../../components/ui/StatusBadge";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BulkToolbar } from "../../components/ui/BulkToolbar";
import { PageHeaderSkeleton, TableSkeleton } from "../../components/ui/Skeleton";
import { COMPLAINT_STATUSES } from "../../types";
import type { Complaint, User } from "../../types";

const CSV_COLUMNS = ["ticketId", "description", "severity", "billingType", "status"];

// Edit happens by clicking through to the complaint's own detail page
// (triage form, quote editor, etc all live there already) — no separate
// per-row edit affordance needed here. Delete/export are bulk-toolbar
// driven, selecting one row is a valid way to act on just that one.
export function Complaints() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { data: complaints, isLoading, error, reload } = useFetch<Complaint[]>(
    () => api.get(`/complaints${statusFilter ? `?status=${statusFilter}` : ""}`).then((r) => r.data.complaints),
    [statusFilter]
  );

  const allIds = (complaints ?? []).map((c) => c._id);
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
    if (!confirm(`Delete ${selected.size} selected complaint(s)? This can't be undone.`)) return;
    setIsBulkDeleting(true);
    try {
      await api.post("/complaints/bulk-delete", { ids: Array.from(selected) });
      toast.success(`${selected.size} complaint(s) deleted`);
      setSelected(new Set());
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? (complaints ?? []).filter((c) => selected.has(c._id)) : complaints ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(`complaints-export-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, CSV_COLUMNS));
    toast.success(`Exported ${rows.length} complaint(s)`);
  }

  return (
    <div>
      <PageHeader
        title="Complaints"
        description="Incoming tickets, AI-assisted triage, and quotes."
        action={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="">All statuses</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </div>
        }
      />

      <Card>
        <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())} onDelete={handleBulkDelete} isDeleting={isBulkDeleting} />
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : error ? (
            <div className="p-5"><ErrorState message={error} onRetry={reload} /></div>
          ) : (complaints ?? []).length === 0 ? (
            <EmptyState icon={Inbox} message="No complaints match this filter." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH width="40px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </TH>
                  <TH>Ticket</TH>
                  <TH>Client</TH>
                  <TH>Description</TH>
                  <TH>Severity</TH>
                  <TH>Billing</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {(complaints ?? []).map((c) => {
                  const client = c.client as User;
                  return (
                    <TR key={c._id}>
                      <TD truncate={false}>
                        <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleOne(c._id)} aria-label={`Select ${c.ticketId}`} />
                      </TD>
                      <TD truncate={false}>
                        <Link to={`/admin/complaints/${c._id}`} className="font-medium text-zinc-100 hover:text-accent">
                          {c.ticketId}
                        </Link>
                      </TD>
                      <TD className="text-zinc-400">{client?.name ?? "—"}</TD>
                      <TD className="text-zinc-400">{c.description}</TD>
                      <TD truncate={false}>{c.severity ? <SeverityBadge value={c.severity} /> : <span className="text-zinc-600">—</span>}</TD>
                      <TD truncate={false}><BillingTypeBadge value={c.billingType} /></TD>
                      <TD truncate={false}><ComplaintStatusBadge value={c.status} /></TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
