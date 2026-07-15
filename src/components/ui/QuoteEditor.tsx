import { useState } from "react";
import { Plus, Trash2, Send } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import type { QuoteLineItem } from "../../types";

// A mini-excel-lite line-item editor: add/delete rows, edit description /
// quantity / unit cost inline, line totals and grand total recompute live.
// The server is still the source of truth for the final totals (it
// recomputes on save — see complaint.controller.ts::updateQuote/reviseQuote)
// so nothing here needs to be trusted, only previewed.
export function QuoteEditor({
  initialLineItems,
  onSave,
  isSaving,
  saveLabel = "Send quote",
}: {
  initialLineItems: QuoteLineItem[];
  onSave: (lineItems: { description: string; quantity: number; unitCost: number }[]) => void;
  isSaving?: boolean;
  saveLabel?: string;
}) {
  const [rows, setRows] = useState<{ description: string; quantity: string; unitCost: string }[]>(
    initialLineItems.length > 0
      ? initialLineItems.map((li) => ({
          description: li.description,
          quantity: String(li.quantity),
          unitCost: String(li.unitCost),
        }))
      : [{ description: "", quantity: "1", unitCost: "" }]
  );

  function updateRow(i: number, field: "description" | "quantity" | "unitCost", value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { description: "", quantity: "1", unitCost: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  const total = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0), 0);
  const canSave = rows.every((r) => r.description.trim() && Number(r.quantity) > 0 && Number(r.unitCost) >= 0);

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-zinc-800">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/40">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Item / description</th>
              <th className="w-20 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Qty</th>
              <th className="w-28 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Unit cost (₹)</th>
              <th className="w-28 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Line total</th>
              <th className="w-9 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {rows.map((row, i) => {
              const lineTotal = (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);
              return (
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <Input
                      value={row.description}
                      onChange={(e) => updateRow(i, "description", e.target.value)}
                      placeholder="e.g. MCB 32A replacement"
                      className="h-8 border-transparent bg-transparent px-1 focus-visible:border-accent"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      value={row.quantity}
                      onChange={(e) => updateRow(i, "quantity", e.target.value)}
                      className="h-8 border-transparent bg-transparent px-1 focus-visible:border-accent"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      value={row.unitCost}
                      onChange={(e) => updateRow(i, "unitCost", e.target.value)}
                      className="h-8 border-transparent bg-transparent px-1 focus-visible:border-accent"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right text-zinc-300">₹{lineTotal.toLocaleString("en-IN")}</td>
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1}
                      className="text-zinc-600 hover:text-zinc-200 disabled:opacity-30"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" /> Add row
        </Button>
        <div className="text-sm font-semibold text-zinc-100">
          Total: ₹{total.toLocaleString("en-IN")}
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-3 w-full"
        disabled={!canSave}
        isLoading={isSaving}
        onClick={() =>
          onSave(
            rows.map((r) => ({
              description: r.description.trim(),
              quantity: Number(r.quantity),
              unitCost: Number(r.unitCost),
            }))
          )
        }
      >
        <Send className="h-3.5 w-3.5" /> {saveLabel}
      </Button>
    </div>
  );
}
