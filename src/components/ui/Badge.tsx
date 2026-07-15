import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

type Variant = "accent" | "solid" | "outline" | "subtle" | "green" | "amber" | "red" | "blue" | "gray";

interface BadgeProps {
  label: string;
  variant?: Variant;
  icon?: LucideIcon;
  className?: string;
}

// Status badges are a deliberate, scoped exception to the app's
// monochrome-plus-one-accent rule: color is the fastest way to scan a table
// of 50 rows for what needs attention, and color + icon + text together
// (never color alone) keeps it accessible for colorblind users too.
// Everything else in the app (buttons, backgrounds, chrome) stays
// monochrome — this exception is intentionally contained to `variant`
// values used only via statusVisuals.ts.
const variantClasses: Record<Variant, string> = {
  accent: "bg-accent-muted text-accent border border-accent/20",
  solid: "bg-zinc-100 text-zinc-900",
  outline: "border border-zinc-700 text-zinc-200",
  subtle: "text-zinc-500",
  green: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
  amber: "bg-amber-950/60 text-amber-400 border border-amber-800/60",
  red: "bg-red-950/60 text-red-400 border border-red-800/60",
  blue: "bg-blue-950/60 text-blue-400 border border-blue-800/60",
  gray: "bg-zinc-900 text-zinc-400 border border-zinc-800",
};

export function Badge({ label, variant = "subtle", icon: Icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
