import {
  LayoutDashboard,
  FileText,
  Inbox,
  Wrench,
  Package,
  Receipt,
  Users,
  UserCircle,
  History,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Contracts", to: "/admin/contracts", icon: FileText },
  { label: "Complaints", to: "/admin/complaints", icon: Inbox },
  { label: "Jobs", to: "/admin/jobs", icon: Wrench },
  { label: "Inventory", to: "/admin/inventory", icon: Package },
  { label: "Invoices", to: "/admin/invoices", icon: Receipt },
  { label: "Engineers", to: "/admin/engineers", icon: Users },
  { label: "Clients", to: "/admin/clients", icon: UserCircle },
];

// Engineer app is single-purpose by design — field engineers have one job
// to do (their jobs), not a multi-section back office. Keeping nav minimal
// matches the mobile-first, task-focused brief rather than forcing the
// admin sidebar pattern onto a phone-in-the-field use case.
export const engineerNavItems: NavItem[] = [
  { label: "My Jobs", to: "/engineer", icon: Wrench },
];

export const clientNavItems: NavItem[] = [
  { label: "Dashboard", to: "/client", icon: LayoutDashboard },
  { label: "My Contracts", to: "/client/contracts", icon: FileText },
  { label: "Complaints", to: "/client/complaints", icon: Inbox },
  { label: "Service History", to: "/client/history", icon: History },
  { label: "Invoices", to: "/client/invoices", icon: Receipt },
];
