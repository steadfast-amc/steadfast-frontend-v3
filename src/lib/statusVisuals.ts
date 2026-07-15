import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  CircleDot,
  XCircle,
  FileText,
  Wrench,
} from "lucide-react";
import type {
  JobStatus,
  ComplaintStatus,
  ContractStatus,
  Severity,
  BillingType,
} from "../types";

interface StatusVisual {
  label: string;
  variant: "accent" | "solid" | "outline" | "subtle" | "green" | "amber" | "red" | "blue" | "gray";
  icon?: typeof AlertTriangle;
}

// Color mapping follows one consistent convention across every status type
// in the app, so a color always means the same thing everywhere:
//   red    = blocked / needs urgent attention / rejected
//   amber  = in progress / awaiting someone's action
//   green  = resolved / approved / good state
//   blue   = informational / new / not yet actioned
//   gray   = closed / inactive / no action needed

export const severityVisual: Record<Severity, StatusVisual> = {
  P1: { label: "P1 · Critical", variant: "red", icon: AlertTriangle },
  P2: { label: "P2 · Urgent", variant: "amber" },
  P3: { label: "P3 · Routine", variant: "gray" },
};

export const complaintStatusVisual: Record<ComplaintStatus, StatusVisual> = {
  new: { label: "New", variant: "blue", icon: CircleDot },
  triaged: { label: "Triaged", variant: "amber" },
  quote_sent: { label: "Quote sent", variant: "amber", icon: FileText },
  quote_approved: { label: "Quote approved", variant: "green", icon: CheckCircle2 },
  job_created: { label: "Job created", variant: "blue", icon: Wrench },
  closed: { label: "Closed", variant: "gray", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "red", icon: XCircle },
};

export const jobStatusVisual: Record<JobStatus, StatusVisual> = {
  assigned: { label: "Assigned", variant: "blue", icon: CircleDot },
  in_progress: { label: "In progress", variant: "amber", icon: Wrench },
  pending_confirmation: { label: "Pending confirmation", variant: "amber", icon: Clock },
  confirmed: { label: "Confirmed", variant: "green", icon: CheckCircle2 },
  disputed: { label: "Disputed", variant: "red", icon: AlertTriangle },
  billed: { label: "Billed", variant: "gray", icon: FileText },
};

export const contractStatusVisual: Record<ContractStatus, StatusVisual> = {
  active: { label: "Active", variant: "green", icon: CheckCircle2 },
  expiring_soon: { label: "Expiring soon", variant: "amber", icon: Clock },
  expired: { label: "Expired", variant: "red", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "gray", icon: XCircle },
};

export const invoiceStatusVisual: Record<"pending" | "paid" | "overdue", StatusVisual> = {
  pending: { label: "Pending", variant: "amber", icon: Clock },
  paid: { label: "Paid", variant: "green", icon: CheckCircle2 },
  overdue: { label: "Overdue", variant: "red", icon: AlertTriangle },
};

export const billingTypeVisual: Record<BillingType, StatusVisual> = {
  amc_covered: { label: "AMC covered", variant: "blue" },
  chargeable: { label: "Chargeable", variant: "amber" },
  undetermined: { label: "Undetermined", variant: "gray" },
};
