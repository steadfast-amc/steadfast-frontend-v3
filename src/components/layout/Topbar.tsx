import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ title, onMenuClick, actions }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-canvas/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-zinc-400 hover:text-zinc-100 md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <span className="text-sm text-zinc-400">{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="text-zinc-500 hover:text-zinc-100"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
