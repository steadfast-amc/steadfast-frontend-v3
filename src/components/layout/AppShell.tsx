import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavItem } from "../../lib/navigation";

interface AppShellProps {
  navItems: NavItem[];
}

export function AppShell({ navItems }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Derive the page title from whichever nav item's path is the longest
  // match for the current URL — avoids every single page having to pass
  // its own title down through router config.
  const activeItem = [...navItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar items={navItems} isMobileOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <Topbar title={activeItem?.label ?? "Steadfast"} onMenuClick={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
