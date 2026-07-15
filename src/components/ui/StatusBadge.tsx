import { Badge } from "./Badge";
import {
  severityVisual,
  complaintStatusVisual,
  jobStatusVisual,
  contractStatusVisual,
  invoiceStatusVisual,
  billingTypeVisual,
} from "../../lib/statusVisuals";
import type {
  Severity,
  ComplaintStatus,
  JobStatus,
  ContractStatus,
  BillingType,
} from "../../types";

// Each function below is a thin, typed lookup — pages call
// <SeverityBadge value={complaint.severity} /> and never touch color logic.

export function SeverityBadge({ value }: { value: Severity }) {
  const v = severityVisual[value];
  return <Badge label={v.label} variant={v.variant} icon={v.icon} />;
}

export function ComplaintStatusBadge({ value }: { value: ComplaintStatus }) {
  const v = complaintStatusVisual[value];
  return <Badge label={v.label} variant={v.variant} icon={v.icon} />;
}

export function JobStatusBadge({ value }: { value: JobStatus }) {
  const v = jobStatusVisual[value];
  return <Badge label={v.label} variant={v.variant} icon={v.icon} />;
}

export function ContractStatusBadge({ value }: { value: ContractStatus }) {
  const v = contractStatusVisual[value];
  return <Badge label={v.label} variant={v.variant} icon={v.icon} />;
}

export function InvoiceStatusBadge({ value }: { value: "pending" | "paid" | "overdue" }) {
  const v = invoiceStatusVisual[value];
  return <Badge label={v.label} variant={v.variant} icon={v.icon} />;
}

export function BillingTypeBadge({ value }: { value: BillingType }) {
  const v = billingTypeVisual[value];
  return <Badge label={v.label} variant={v.variant} icon={v.icon} />;
}
