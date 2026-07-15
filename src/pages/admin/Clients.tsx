import { useRef, useState, FormEvent } from "react";
import { Plus, Users, Pencil, Download, Upload } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { parseCsv, toCsv, downloadCsv } from "../../lib/csv";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, PasswordInput, Label } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BulkToolbar } from "../../components/ui/BulkToolbar";
import { PageHeaderSkeleton, TableSkeleton } from "../../components/ui/Skeleton";
import type { User } from "../../types";

const CSV_COLUMNS = ["name", "email", "phone"];

export function Clients() {
  const toast = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clients, isLoading, error, reload } = useFetch<User[]>(
    () => api.get("/users?role=client").then((r) => r.data.users),
    []
  );

  if (isLoading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <Card>
          <CardContent className="p-0">
            <TableSkeleton rows={6} columns={4} />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const allIds = (clients ?? []).map((c) => c._id);
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
    if (!confirm(`Delete ${selected.size} selected client(s)? This can't be undone.`)) return;
    setIsBulkDeleting(true);
    try {
      await api.post("/users/bulk-delete", { ids: Array.from(selected) });
      toast.success(`${selected.size} client(s) deleted`);
      setSelected(new Set());
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? (clients ?? []).filter((c) => selected.has(c._id)) : clients ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(`clients-export-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, CSV_COLUMNS));
    toast.success(`Exported ${rows.length} client(s)`);
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
      const { data } = await api.post("/users/bulk-import", { role: "client", rows });
      if (data.failed?.length) {
        toast.error(`Imported ${data.createdCount}, ${data.failed.length} row(s) failed — see console`);
        console.warn("Client import failures:", data.failed);
      } else {
        toast.success(`Imported ${data.createdCount} client(s)`);
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
        title="Clients"
        description="Client accounts — create one before adding their contract."
        action={
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={isImporting}>
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add client
            </Button>
          </div>
        }
      />

      <Card>
        <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())} onDelete={handleBulkDelete} isDeleting={isBulkDeleting} />
        <CardContent className="p-0">
          {(clients ?? []).length === 0 ? (
            <EmptyState icon={Users} message="No clients added yet." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH width="40px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </TH>
                  <TH>Name</TH>
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH width="56px"></TH>
                </TR>
              </THead>
              <TBody>
                {(clients ?? []).map((c) => (
                  <TR key={c._id}>
                    <TD truncate={false}>
                      <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleOne(c._id)} aria-label={`Select ${c.name}`} />
                    </TD>
                    <TD className="font-medium text-zinc-100">{c.name}</TD>
                    <TD className="text-zinc-400">{c.phone}</TD>
                    <TD className="text-zinc-400">{c.email}</TD>
                    <TD truncate={false}>
                      <Button size="sm" variant="ghost" onClick={() => setEditTarget(c)} aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientFormModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSaved={reload} />
      <ClientFormModal isOpen={!!editTarget} client={editTarget ?? undefined} onClose={() => setEditTarget(null)} onSaved={reload} />
    </div>
  );
}

// Handles both "Add client" (no `client` prop) and "Edit client".
function ClientFormModal({
  isOpen,
  client,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  client?: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isEdit = !!client;
  const [form, setForm] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit && client) {
        // Email is fixed at creation (it's the login identity) — only
        // profile fields go through the edit path.
        await api.patch(`/users/${client._id}`, { name: form.name, phone: form.phone });
        toast.success("Client updated");
      } else {
        await api.post("/auth/register", { ...form, role: "client" });
        toast.success("Client added");
        setForm({ name: "", email: "", phone: "", password: "" });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Could not ${isEdit ? "update" : "add"} client`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${client?.name}` : "Add client"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="client-form" type="submit" isLoading={isSubmitting}>
            {isEdit ? "Save changes" : "Add client"}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Email</Label>
          <Input required type="email" disabled={isEdit} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {!isEdit && (
          <div>
            <Label>Temporary password</Label>
            <PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        )}
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
