import { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-3 h-6 w-6 text-zinc-700" />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
