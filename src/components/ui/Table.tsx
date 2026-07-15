import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

// table-fixed makes every column's width a share of the table's own width
// (set per-column via TH's optional `width` prop, or split evenly if
// omitted) instead of growing to fit its longest cell. Combined with
// `truncate` on TD, long content always ellipsizes to whatever room the
// viewport gives that column — shrinking the browser window re-flows the
// ellipsis point automatically, with no horizontal scrollbar and no JS.
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full">
      <table className={cn("w-full table-fixed text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-zinc-800", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-zinc-900", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-zinc-900/40 transition-colors", className)} {...props} />;
}

// `width` accepts any CSS width ("48px", "20%", "3rem") and is applied as an
// inline style — the one per-column knob a page can set when a column needs
// to stay narrow (e.g. an actions column) or wide (e.g. a description column).
export function TH({ className, width, style, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { width?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500",
        className
      )}
      style={{ ...(width ? { width } : {}), ...style }}
      {...props}
    />
  );
}

// Truncates with a dynamic ellipsis by default. `title` falls back to the
// cell's own text so hovering reveals the full content without a custom
// tooltip component. Pass `truncate={false}` to opt a specific cell out
// (e.g. one that already renders a badge/button, which shouldn't clip).
export function TD({
  className,
  title,
  children,
  truncate = true,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { truncate?: boolean }) {
  const autoTitle = title ?? (typeof children === "string" ? children : undefined);
  return (
    <td
      className={cn("px-4 py-3 text-zinc-300", truncate && "max-w-0 truncate", className)}
      title={autoTitle}
      {...props}
    >
      {children}
    </td>
  );
}
