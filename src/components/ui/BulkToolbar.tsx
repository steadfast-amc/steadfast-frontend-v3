import { Trash2, X } from "lucide-react";
import { Button } from "./Button";

export function BulkToolbar({
  count,
  onClear,
  onDelete,
  isDeleting,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
      <span className="text-sm text-zinc-300">{count} selected</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete} isLoading={isDeleting}>
          <Trash2 className="h-3.5 w-3.5" /> Delete selected
        </Button>
      </div>
    </div>
  );
}
