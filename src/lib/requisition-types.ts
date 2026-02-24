// Advanced Requisition Management Types & Constants

export const OPPORTUNITY_STAGES = [
  "Pre-Proposal",
  "Proposal",
  "Negotiation",
  "(Free) Pilot before SLA",
  "(Paid) Pilot before SLA",
  "SLA back-and-forth",
  "SLA signed; awaiting contraction",
  "SLA signed & contraction is on the platform",
  "SLA signed & contraction is on the platform AND escalated",
] as const;

export const URGENCY_LEVELS = [
  { value: "low", label: "Low (15+ days)", color: "success" },
  { value: "medium", label: "Medium (7–14 days)", color: "info" },
  { value: "high", label: "High (3–7 days)", color: "warning" },
  { value: "critical", label: "Critical (0–3 days)", color: "destructive" },
] as const;

export const CREATOR_TYPES = [
  "Writer", "Editor", "Reviewer", "AI Generator", "AI Generator + Reviewer",
  "Quality Lead", "Copywriter", "Designer", "Video Editor", "Animator",
  "Production House", "Agency", "Other",
] as const;

export const EXPERIENCE_LEVELS = [
  "Junior (0–2 yrs)", "Mid (2–5 yrs)", "Senior (5–8 yrs)", "Expert (8+ yrs)",
] as const;

export const PAYMENT_MODELS = [
  "Per Word", "Per Assignment", "Monthly Retainer", "Hourly", "Per Output Unit",
] as const;

export const DEPARTMENTS = ["Sales", "VSD", "Account Management", "Other"] as const;

export const DEAL_TYPES_SALES = ["Retainer", "Project-based", "Pilot", "Enterprise Studio"] as const;
export const RESOURCE_TYPES_SALES = ["Dedicated Content Studio", "Freelancer(s)"] as const;
export const RESOURCE_SPECIFIC_TYPES = ["Writer", "Editor", "Designer", "Video Editor", "Production House", "Other"] as const;

export const STUDIO_TYPES = ["Dedicated", "On-Demand", "Hybrid"] as const;
export const VSD_DEAL_TYPES = ["Retainer", "Non-Retainer"] as const;

export const REPLACEMENT_RISK = ["High", "Medium", "Low"] as const;

export type OpportunityStage = typeof OPPORTUNITY_STAGES[number];
export type UrgencyValue = typeof URGENCY_LEVELS[number]["value"];
export type CreatorType = typeof CREATOR_TYPES[number];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];
export type PaymentModel = typeof PAYMENT_MODELS[number];

export type RequisitionFlow = "sales" | "vsd";

export type AdvancedRequisitionStatus =
  | "Draft"
  | "Submitted"
  | "Pending Head of Supply Review"
  | "Rejected"
  | "Approved – Assigning"
  | "In Progress"
  | "Shortlisting"
  | "Client Interview"
  | "Closed – Filled"
  | "Closed – Dropped";

export interface SalesFlowData {
  clientName: string;
  opportunityName: string;
  dealType: string;
  resourceType: string;
  specificResourceTypes: string[];
  expectedCreatorPay: string;
  expectedClientBilling: string;
  expectedMarginPercent: number;
  opportunityStage: OpportunityStage | "";
  urgency: UrgencyValue;
}

export interface VSDLineItem {
  id: string;
  creatorTypes: string[];
  numberOfCreators: number;
  experienceLevel: string;
  paymentModel: string;
  estimatedMonthlyOutput: string;
  estimatedHoursPerMonth: string;
  clientPay: number;
  creatorPay: number;
  isCombinedPay: boolean;
  targetMarginPercent: number;
  // Calculated
  grossMargin: number;
  grossMarginPercent: number;
  // Creator details
  domainExpertise: string;
  languageRequirement: string;
  toolsRequired: string;
  portfolioExpectation: string;
  turnaroundTime: string;
  replacementRisk: string;
}

export interface VSDFlowData {
  clientName: string;
  dealId: string;
  dealType: string;
  studioType: string;
  geography: string;
  opportunityStage: OpportunityStage | "";
  clientDetails: string;
  lineItems: VSDLineItem[];
  // Urgency & SLA
  requiredStartDate: string;
  deadlineToClose: string;
  urgency: UrgencyValue;
  isReplacementHiring: boolean;
  replacementOf: string;
}

export interface AdvancedRequisition {
  id: string;
  // Raised by
  raisedByName: string;
  raisedByPhone: string;
  department: string;
  flow: RequisitionFlow;
  // Flow-specific data
  salesData?: SalesFlowData;
  vsdData?: VSDFlowData;
  // Status & workflow
  status: AdvancedRequisitionStatus;
  // Approval
  headOfSupplyNotes: string;
  rejectionReason: string;
  // Assignment
  taManagerAssigned: string;
  recruiterAssigned: string;
  linkedInRecruiterLink: string;
  targetClosureDate: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Financial summary (VSD)
  totalClientRevenue: number;
  totalCreatorCost: number;
  grossMargin: number;
  grossMarginPercent: number;
  targetMarginPercent: number;
  // Daily updates
  dailyUpdates: DailyUpdate[];
  // Audit log
  auditLog: AuditEntry[];
}

export interface DailyUpdate {
  id: string;
  date: string;
  recruiterName: string;
  profilesIdentified: number;
  profilesContacted: number;
  profilesScreened: number;
  profilesShared: number;
  interviewsScheduled: number;
  offersRolledOut: number;
  selected: number;
  dropOffs: number;
  blockers: string;
  notes: string;
}

export interface AuditEntry {
  id: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  editedBy: string;
  timestamp: string;
}

// Helper
export function createEmptyLineItem(): VSDLineItem {
  return {
    id: crypto.randomUUID(),
    creatorTypes: [],
    numberOfCreators: 1,
    experienceLevel: "",
    paymentModel: "",
    estimatedMonthlyOutput: "",
    estimatedHoursPerMonth: "",
    clientPay: 0,
    creatorPay: 0,
    isCombinedPay: false,
    targetMarginPercent: 40,
    grossMargin: 0,
    grossMarginPercent: 0,
    domainExpertise: "",
    languageRequirement: "",
    toolsRequired: "",
    portfolioExpectation: "",
    turnaroundTime: "",
    replacementRisk: "",
  };
}

export function calcLineItemMargins(item: VSDLineItem): VSDLineItem {
  const gm = item.clientPay - item.creatorPay;
  const gmPercent = item.clientPay > 0 ? (gm / item.clientPay) * 100 : 0;
  return { ...item, grossMargin: gm, grossMarginPercent: gmPercent };
}

export function getMarginRiskColor(actual: number, target: number): string {
  if (actual >= target) return "success";
  if (actual >= target - 5) return "warning";
  return "destructive";
}

export function getMarginRiskLabel(actual: number, target: number): string {
  if (actual >= target) return "Safe";
  if (actual >= target - 5) return "Watch";
  return "Risk";
}
