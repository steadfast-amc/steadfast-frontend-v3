// Mirrors src/config/constants.ts on the backend — keep these in sync.
export const ROLES = ["admin", "engineer", "client"] as const;
export type Role = (typeof ROLES)[number];

export const COMPLAINT_CATEGORIES = [
  "wiring",
  "mcb_breaker",
  "transformer",
  "lighting",
  "panel",
  "motor_pump",
  "earthing",
  "other",
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const SEVERITY_LEVELS = ["P1", "P2", "P3"] as const;
export type Severity = (typeof SEVERITY_LEVELS)[number];

export const BILLING_TYPES = ["amc_covered", "chargeable", "undetermined"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

export const COMPLAINT_STATUSES = [
  "new",
  "triaged",
  "quote_sent",
  "quote_approved",
  "job_created",
  "closed",
  "rejected",
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const JOB_STATUSES = [
  "assigned",
  "in_progress",
  "pending_confirmation",
  "confirmed",
  "disputed",
  "billed",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const CONTRACT_STATUSES = ["active", "expiring_soon", "expired", "cancelled"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  skills?: string[];
  isAvailable?: boolean;
  isActive: boolean;
}

export interface AuthorizedPersonnel {
  _id: string;
  name: string;
  phone: string;
  designation: string;
}

export interface Contract {
  _id: string;
  client: User | string;
  siteAddress: string;
  feeAmount: number;
  billingCycle: "monthly" | "quarterly" | "annual";
  includedVisitsPerCycle: number;
  visitsUsedThisCycle: number;
  additionalVisitCharge: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  coveredScope: string;
  authorizedPersonnel: AuthorizedPersonnel[];
  renewalProposal?: {
    proposedEndDate: string;
    proposedFeeAmount: number;
    proposedAt: string;
    confirmedAt?: string;
  };
}

export interface AiSuggestion {
  category: ComplaintCategory;
  severity: Severity;
  billingType: BillingType;
  confidence: number;
  modelVersion: string;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Complaint {
  _id: string;
  ticketId: string;
  client: User | string;
  contract: Contract | string;
  description: string;
  photoUrls: string[];
  locationNote?: string;
  aiSuggestion?: AiSuggestion;
  category?: ComplaintCategory;
  severity?: Severity;
  billingType: BillingType;
  quote?: {
    lineItems: QuoteLineItem[];
    totalAmount: number;
    sentAt: string;
    approvedAt?: string;
  };
  status: ComplaintStatus;
  createdAt: string;
}

export interface MaterialUsed {
  materialId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Job {
  _id: string;
  jobId: string;
  complaint: Complaint | string;
  contract: Contract | string;
  client: User | string;
  engineer: User | string;
  materialsUsed: MaterialUsed[];
  photosBefore: string[];
  photosAfter: string[];
  status: JobStatus;
  qrToken?: string;
  verifiedBy?: { name: string; phone: string };
  verifiedAt?: string;
  disputeReason?: string;
  createdAt: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  unitCost: number;
  lowStockThreshold: number;
  vendor?: string;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  type: "job_chargeable" | "amc_subscription" | "overage_visit";
  client: User | string;
  contract: Contract | string;
  job?: string;
  lineItems: QuoteLineItem[];
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  paidAt?: string;
}
