import { useRef, useState, FormEvent } from "react";
import { Plus, Package, PackagePlus, Pencil, Download, Upload } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { parseCsv, toCsv, downloadCsv } from "../../lib/csv";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, Label } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BulkToolbar } from "../../components/ui/BulkToolbar";
import { PageHeaderSkeleton, TableSkeleton } from "../../components/ui/Skeleton";
import type { InventoryItem } from "../../types";

const CSV_COLUMNS = ["name", "unit", "totalStock", "unitCost", "lowStockThreshold", "vendor"];

export function Inventory() {
  const toast = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items, isLoading, error, reload } = useFetch<InventoryItem[]>(
    () => api.get("/inventory").then((r) => r.data.items),
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

  const allIds = (items ?? []).map((i) => i._id);
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
    if (!confirm(`Delete ${selected.size} selected item(s)? This can't be undone.`)) return;
    setIsBulkDeleting(true);
    try {
      await api.post("/inventory/bulk-delete", { ids: Array.from(selected) });
      toast.success(`${selected.size} item(s) deleted`);
      setSelected(new Set());
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? (items ?? []).filter((i) => selected.has(i._id)) : items ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(`inventory-export-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, CSV_COLUMNS));
    toast.success(`Exported ${rows.length} item(s)`);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error("No rows found in that file");
        return;
      }
      const { data } = await api.post("/inventory/bulk-import", { rows });
      if (data.failed?.length) {
        toast.error(`Imported ${data.createdCount}, ${data.failed.length} row(s) failed — see console`);
        console.warn("Inventory import failures:", data.failed);
      } else {
        toast.success(`Imported ${data.createdCount} item(s)`);
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
        title="Inventory"
        description="Stock on hand across all materials."
        action={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={isImporting}>
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </div>
        }
      />

      <Card>
        <BulkToolbar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={handleBulkDelete}
          isDeleting={isBulkDeleting}
        />
        <CardContent className="p-0">
          {(items ?? []).length === 0 ? (
            <EmptyState icon={Package} message="No inventory items yet." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH width="40px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </TH>
                  <TH>Item</TH>
                  <TH width="15%">Total</TH>
                  <TH width="15%">Reserved</TH>
                  <TH width="18%">Available</TH>
                  <TH width="15%">Unit cost</TH>
                  <TH width="90px"></TH>
                </TR>
              </THead>
              <TBody>
                {(items ?? []).map((item) => {
                  const isLow = item.availableStock <= item.lowStockThreshold;
                  return (
                    <TR key={item._id}>
                      <TD truncate={false}>
                        <input
                          type="checkbox"
                          checked={selected.has(item._id)}
                          onChange={() => toggleOne(item._id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </TD>
                      <TD className="font-medium text-zinc-100">{item.name}</TD>
                      <TD>{item.totalStock} {item.unit}</TD>
                      <TD className="text-zinc-500">{item.reservedStock} {item.unit}</TD>
                      <TD truncate={false}>
                        <div className="flex items-center gap-2">
                          {item.availableStock} {item.unit}
                          {isLow && <Badge label="Low stock" variant="outline" />}
                        </div>
                      </TD>
                      <TD>₹{item.unitCost}</TD>
                      <TD truncate={false}>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setRestockTarget(item)} aria-label="Restock">
                            <PackagePlus className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditTarget(item)} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ItemFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={reload}
      />
      <ItemFormModal
        isOpen={!!editTarget}
        item={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSaved={reload}
      />
      <RestockModal item={restockTarget} onClose={() => setRestockTarget(null)} onDone={reload} />
    </div>
  );
}

// Handles both "Add item" (no `item` prop) and "Edit item" (item passed in)
// — one form, one code path, so the two flows can never drift apart.
function ItemFormModal({
  isOpen,
  item,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  item?: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name ?? "",
    unit: item?.unit ?? "pcs",
    totalStock: item ? String(item.totalStock) : "",
    unitCost: item ? String(item.unitCost) : "",
    lowStockThreshold: item ? String(item.lowStockThreshold) : "5",
    vendor: item?.vendor ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const payload = {
      name: form.name,
      unit: form.unit,
      totalStock: Number(form.totalStock),
      unitCost: Number(form.unitCost),
      lowStockThreshold: Number(form.lowStockThreshold),
      vendor: form.vendor || undefined,
    };
    try {
      if (isEdit && item) {
        await api.patch(`/inventory/${item._id}`, payload);
        toast.success("Item updated");
      } else {
        await api.post("/inventory", payload);
        toast.success("Item added");
        setForm({ name: "", unit: "pcs", totalStock: "", unitCost: "", lowStockThreshold: "5", vendor: "" });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Could not ${isEdit ? "update" : "add"} item`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${item?.name}` : "Add inventory item"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="item-form" type="submit" isLoading={isSubmitting}>
            {isEdit ? "Save changes" : "Add item"}
          </Button>
        </>
      }
    >
      <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Unit</Label>
            <Input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, meters, kg" />
          </div>
          <div>
            <Label>Unit cost (₹)</Label>
            <Input required type="number" min={0} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{isEdit ? "Total stock" : "Initial stock"}</Label>
            <Input required type="number" min={0} value={form.totalStock} onChange={(e) => setForm({ ...form, totalStock: e.target.value })} />
          </div>
          <div>
            <Label>Low stock threshold</Label>
            <Input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Vendor (optional)</Label>
          <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}

function RestockModal({ item, onClose, onDone }: { item: InventoryItem | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [addQuantity, setAddQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/inventory/${item._id}/restock`, { addQuantity: Number(addQuantity) });
      toast.success("Stock updated");
      onDone();
      onClose();
      setAddQuantity("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title={`Restock ${item?.name ?? ""}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="restock-form" type="submit" isLoading={isSubmitting}>Add stock</Button>
        </>
      }
    >
      <form id="restock-form" onSubmit={handleSubmit}>
        <Label>Quantity to add</Label>
        <Input required type="number" min={1} value={addQuantity} onChange={(e) => setAddQuantity(e.target.value)} autoFocus />
      </form>
    </Modal>
  );
}
