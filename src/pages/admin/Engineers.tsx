import { useRef, useState, FormEvent } from "react";
import { Plus, Users, X, Pencil, Download, Upload } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { parseCsv, toCsv, downloadCsv } from "../../lib/csv";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, PasswordInput, Label } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BulkToolbar } from "../../components/ui/BulkToolbar";
import { PageHeaderSkeleton, TableSkeleton } from "../../components/ui/Skeleton";
import type { User } from "../../types";

const CSV_COLUMNS = ["name", "email", "phone", "skills"];

export function Engineers() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { data: engineers, isLoading, error, reload } = useFetch<User[]>(
    () => api.get("/users?role=engineer").then((r) => r.data.users),
    []
  );

  // Fixes MISSING 3 — availability had a field in the model since day one
  // but nothing could ever change it.
  async function toggleAvailability(engineer: User) {
    try {
      await api.patch(`/users/${engineer._id}`, { isAvailable: !engineer.isAvailable });
      toast.success(engineer.isAvailable ? "Marked unavailable" : "Marked available");
      reload();
    } catch {
      toast.error("Could not update availability");
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <Card>
          <CardContent className="p-0">
            <TableSkeleton rows={6} columns={5} />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const allIds = (engineers ?? []).map((e) => e._id);
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
    if (!confirm(`Delete ${selected.size} selected engineer(s)? This can't be undone.`)) return;
    setIsBulkDeleting(true);
    try {
      await api.post("/users/bulk-delete", { ids: Array.from(selected) });
      toast.success(`${selected.size} engineer(s) deleted`);
      setSelected(new Set());
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? (engineers ?? []).filter((e) => selected.has(e._id)) : engineers ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(
      `engineers-export-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows.map((r) => ({ ...r, skills: (r.skills ?? []).join(", ") })), CSV_COLUMNS)
    );
    toast.success(`Exported ${rows.length} engineer(s)`);
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
      const { data } = await api.post("/users/bulk-import", { role: "engineer", rows });
      if (data.failed?.length) {
        toast.error(`Imported ${data.createdCount}, ${data.failed.length} row(s) failed — see console`);
        console.warn("Engineer import failures:", data.failed);
      } else {
        toast.success(`Imported ${data.createdCount} engineer(s)`);
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
        title="Engineers"
        description="Field engineers available for job assignment."
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
              <Plus className="h-4 w-4" /> Add engineer
            </Button>
          </div>
        }
      />

      <Card>
        <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())} onDelete={handleBulkDelete} isDeleting={isBulkDeleting} />
        <CardContent className="p-0">
          {(engineers ?? []).length === 0 ? (
            <EmptyState icon={Users} message="No engineers added yet." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH width="40px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </TH>
                  <TH>Name</TH>
                  <TH>Phone</TH>
                  <TH>Skills</TH>
                  <TH>Availability</TH>
                  <TH width="56px"></TH>
                </TR>
              </THead>
              <TBody>
                {(engineers ?? []).map((e) => (
                  <TR key={e._id}>
                    <TD truncate={false}>
                      <input type="checkbox" checked={selected.has(e._id)} onChange={() => toggleOne(e._id)} aria-label={`Select ${e.name}`} />
                    </TD>
                    <TD className="font-medium text-zinc-100">{e.name}</TD>
                    <TD className="text-zinc-400">{e.phone}</TD>
                    <TD truncate={false}>
                      {e.skills && e.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {e.skills.map((s) => (
                            <Badge key={s} label={s} variant="outline" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </TD>
                    <TD truncate={false}>
                      <button onClick={() => toggleAvailability(e)}>
                        <Badge label={e.isAvailable ? "Available" : "Unavailable"} variant={e.isAvailable ? "green" : "gray"} />
                      </button>
                    </TD>
                    <TD truncate={false}>
                      <Button size="sm" variant="ghost" onClick={() => setEditTarget(e)} aria-label="Edit">
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

      <EngineerFormModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSaved={reload} />
      <EngineerFormModal isOpen={!!editTarget} engineer={editTarget ?? undefined} onClose={() => setEditTarget(null)} onSaved={reload} />
    </div>
  );
}

function EngineerFormModal({
  isOpen,
  engineer,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  engineer?: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isEdit = !!engineer;
  const [form, setForm] = useState({ name: engineer?.name ?? "", email: engineer?.email ?? "", phone: engineer?.phone ?? "", password: "" });
  const [skills, setSkills] = useState<string[]>(engineer?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addSkill() {
    if (!skillDraft.trim()) return;
    setSkills([...skills, skillDraft.trim()]);
    setSkillDraft("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit && engineer) {
        await api.patch(`/users/${engineer._id}`, { name: form.name, phone: form.phone, skills });
        toast.success("Engineer updated");
      } else {
        await api.post("/auth/register", { ...form, role: "engineer", skills });
        toast.success("Engineer added");
        setForm({ name: "", email: "", phone: "", password: "" });
        setSkills([]);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Could not ${isEdit ? "update" : "add"} engineer`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${engineer?.name}` : "Add engineer"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="engineer-form" type="submit" isLoading={isSubmitting}>
            {isEdit ? "Save changes" : "Add engineer"}
          </Button>
        </>
      }
    >
      <form id="engineer-form" onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <Label>Skills</Label>
          <div className="flex gap-2">
            <Input
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              placeholder="e.g. High voltage"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
          </div>
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3 text-zinc-600 hover:text-zinc-300" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
