import { NavLink } from "react-router-dom";
import { X, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/auth";
import type { NavItem } from "../../lib/navigation";

interface SidebarProps {
  items: NavItem[];
  isMobileOpen: boolean;
  onClose: () => void;
}

const roleLabel: Record<string, string> = {
  admin: "Admin",
  engineer: "Field Engineer",
  client: "Client",
};

export function Sidebar({ items, isMobileOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-zinc-800 bg-canvas",
          "transition-transform duration-200 ease-out md:translate-x-0 md:static md:z-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" fill="currentColor" />
            <span className="text-sm font-semibold tracking-tight text-zinc-50">Steadfast</span>
          </div>
          <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-zinc-900 text-zinc-50 font-medium"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-4 w-4", isActive && "text-accent")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-800 px-5 py-4">
          <p className="truncate text-xs font-medium text-zinc-300">{user?.name}</p>
          <p className="text-xs text-zinc-600">
            Bright Electricals · {user ? roleLabel[user.role] : ""}
          </p>
        </div>
      </aside>
    </>
  );
}
