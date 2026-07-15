import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  emphasis?: boolean; // true = this number needs attention right now (uses the accent)
  sublabel?: string;
}

export function StatCard({ label, value, icon: Icon, emphasis, sublabel }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", emphasis ? "text-accent" : "text-zinc-600")} />
      </div>
      <div className={cn("mt-3 text-2xl font-semibold", emphasis ? "text-accent" : "text-zinc-50")}>
        {value}
      </div>
      {sublabel && <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>}
    </Card>
  );
}
