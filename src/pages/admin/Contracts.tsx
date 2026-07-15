import { useRef, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Download, Upload } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { parseCsv, toCsv, downloadCsv } from "../../lib/csv";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { ContractStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, Label } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BulkToolbar } from "../../components/ui/BulkToolbar";
import { PageHeaderSkeleton, TableSkeleton } from "../../components/ui/Skeleton";
import type { Contract, User } from "../../types";

const CSV_COLUMNS = ["siteAddress", "billingCycle", "feeAmount", "visitsUsedThisCycle", "includedVisitsPerCycle", "endDate", "status"];

// Same pattern as Complaints: edit happens on the contract's own detail
// page (renewals, authorized personnel, etc already live there) — this
// list is browse + bulk delete/export/import only.
export function Contracts() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contracts, isLoading, error, reload } = useFetch<Contract[]>(
    () => api.get("/contracts").then((r) => r.data.contracts),
    []
  );
  const { data: clients } = useFetch<User[]>(
    () => api.get("/users?role=client").then((r) => r.data.users),
    []
  );

  if (isLoading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <Card>
          <CardContent className="p-0">
            <TableSkeleton rows={6} columns={6} />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const allIds = (contracts ?? []).map((c) => c._id);
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
    if (!confirm(`Delete ${selected.size} selected contract(s)? This can't be undone.`)) return;
    setIsBulkDeleting(true);
    try {
      await api.post("/contracts/bulk-delete", { ids: Array.from(selected) });
      toast.success(`${selected.size} contract(s) deleted`);
      setSelected(new Set());
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? (contracts ?? []).filter((c) => selected.has(c._id)) : contracts ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(`contracts-export-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, CSV_COLUMNS));
    toast.success(`Exported ${rows.length} contract(s)`);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length === 0) {
        toast.error("No rows found in that file");
        return;
      }
      // Rows reference the client by `clientEmail` — the client must
      // already exist (create them on the Clients page first).
      const { data } = await api.post("/contracts/bulk-import", { rows });
      if (data.failed?.length) {
        toast.error(`Imported ${data.createdCount}, ${data.failed.length} row(s) failed — see console`);
        console.warn("Contract import failures:", data.failed);
      } else {
        toast.success(`Imported ${data.createdCount} contract(s)`);
      }
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Import failed");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <PageHeader
        title="Contracts"
        description="AMC contracts across all clients."
        action={
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={isImporting}>
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" /> New contract
            </Button>
          </div>
        }
      />

      <Card>
        <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())} onDelete={handleBulkDelete} isDeleting={isBulkDeleting} />
        <CardContent className="p-0">
          {(contracts ?? []).length === 0 ? (
            <EmptyState icon={FileText} message="No contracts yet — create the first one to get started." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH width="40px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </TH>
                  <TH>Client</TH>
                  <TH>Site</TH>
                  <TH>Cycle</TH>
                  <TH>Visits used</TH>
                  <TH>Expires</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {(contracts ?? []).map((c) => {
                  const client = c.client as User;
                  return (
                    <TR key={c._id}>
                      <TD truncate={false}>
                        <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleOne(c._id)} aria-label={`Select ${client?.name ?? "contract"}`} />
                      </TD>
                      <TD truncate={false}>
                        <Link to={`/admin/contracts/${c._id}`} className="font-medium text-zinc-100 hover:text-accent">
                          {client?.name ?? "—"}
                        </Link>
                      </TD>
                      <TD className="text-zinc-400">{c.siteAddress}</TD>
                      <TD className="capitalize">{c.billingCycle}</TD>
                      <TD>
                        {c.visitsUsedThisCycle} / {c.includedVisitsPerCycle}
                      </TD>
                      <TD>{new Date(c.endDate).toLocaleDateString("en-IN")}</TD>
                      <TD truncate={false}>
                        <ContractStatusBadge value={c.status} />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clients={clients ?? []}
        onCreated={reload}
      />
    </div>
  );
}

function NewContractModal({
  isOpen,
  onClose,
  clients,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  clients: User[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    clientId: "",
    siteAddress: "",
    feeAmount: "",
    billingCycle: "monthly",
    includedVisitsPerCycle: "2",
    additionalVisitCharge: "0",
    startDate: "",
    endDate: "",
    coveredScope: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/contracts", {
        clientId: form.clientId,
        siteAddress: form.siteAddress,
        feeAmount: Number(form.feeAmount),
        billingCycle: form.billingCycle,
        includedVisitsPerCycle: Number(form.includedVisitsPerCycle),
        additionalVisitCharge: Number(form.additionalVisitCharge),
        startDate: form.startDate,
        endDate: form.endDate,
        coveredScope: form.coveredScope,
      });
      toast.success("Contract created");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.formErrors?.join(", ") || "Could not create contract");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New contract"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="new-contract-form" type="submit" isLoading={isSubmitting}>
            Create contract
          </Button>
        </>
      }
    >
      <form id="new-contract-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Client</Label>
          <Select
            required
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Site address</Label>
          <Input required value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fee amount (₹)</Label>
            <Input required type="number" min={0} value={form.feeAmount} onChange={(e) => setForm({ ...form, feeAmount: e.target.value })} />
          </div>
          <div>
            <Label>Billing cycle</Label>
            <Select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Included visits / cycle</Label>
            <Input required type="number" min={0} value={form.includedVisitsPerCycle} onChange={(e) => setForm({ ...form, includedVisitsPerCycle: e.target.value })} />
          </div>
          <div>
            <Label>Extra visit charge (₹)</Label>
            <Input type="number" min={0} value={form.additionalVisitCharge} onChange={(e) => setForm({ ...form, additionalVisitCharge: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start date</Label>
            <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <Label>End date</Label>
            <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Covered scope (optional)</Label>
          <Input value={form.coveredScope} onChange={(e) => setForm({ ...form, coveredScope: e.target.value })} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
