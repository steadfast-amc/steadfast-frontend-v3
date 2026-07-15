import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 py-16 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-zinc-600" />
      <p className="text-sm text-zinc-300">{message || "Could not load data — is the backend running?"}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}
