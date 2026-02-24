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
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
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
  "Per Word", "Per Assignment", "Monthly Retainer", "Hourly",
] as const;

export const DEAL_TYPES_SALES = ["Retainer", "Project-based", "Pilot", "Studio"] as const;
export const RESOURCE_TYPES_SALES = ["Dedicated Content Studio", "Freelancer(s)"] as const;
export const RESOURCE_SPECIFIC_TYPES = ["Writer", "Editor", "Designer", "Video Editor", "Production House", "Other"] as const;

export const STUDIO_TYPES = ["Onsite", "Hybrid", "Remote"] as const;
export const VSD_DEAL_TYPES = ["Retainer", "Non-Retainer"] as const;

export const FREELANCER_TALENT_TYPES = [
  "India-based talent for Indian clients",
  "India-based talent for Global clients",
  "Global talent for Global clients",
] as const;

export const REPLACEMENT_RISK = ["High", "Medium", "Low"] as const;

export type OpportunityStage = typeof OPPORTUNITY_STAGES[number];
export type UrgencyValue = typeof URGENCY_LEVELS[number]["value"];
export type CreatorType = typeof CREATOR_TYPES[number];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];
export type PaymentModel = typeof PAYMENT_MODELS[number];

export type RequisitionFlow = "sales" | "studio" | "freelancer";

export type AdvancedRequisitionStatus =
  | "Yet to start"
  | "In progress"
  | "RMG approval Pending"
  | "Approved but not assigned"
  | "On hold"
  | "Scrapped"
  | "Closed – allotment pending"
  | "Closed – allotted";

export interface SalesFlowData {
  clientName: string;
  opportunityName: string;
  dealType: string;
  resourceType: string;
  specificResourceTypes: string[];
  otherResourceTypeSpec: string;
  expectedCreatorPay: string;
  expectedClientBilling: string;
  expectedMarginPercent: number;
  opportunityStage: OpportunityStage | "";
  urgency: UrgencyValue;
}

export interface VSDLineItem {
  id: string;
  creatorType: string;
  otherCreatorTypeSpec: string;
  numberOfCreators: number;
  experienceLevel: string;
  paymentModel: string;
  estimatedMonthlyOutput: string;
  estimatedHoursPerMonth: string;
  clientUnitPrice: number;
  targetUnitMargin: number;
  supplyUnitPay: number;
  isCombinedPay: boolean;
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

export interface HiringFlowData {
  clientName: string;
  dealId: string;
  dealType: string;
  // Studio-specific
  studioType: string;
  geography: string;
  // Freelancer-specific
  talentType: string;
  // Common
  opportunityStage: OpportunityStage | "";
  clientDetails: string;
  // Deal-level financial (moved from line items)
  mrr: number;
  contractDuration: string;
  targetMarginPercent: number;
  lineItems: VSDLineItem[];
  // Urgency & SLA
  urgencyScale: number; // 1-10
  isReplacementHiring: boolean;
  replacementOf: string;
}

export interface AdvancedRequisition {
  id: string;
  raisedByName: string;
  raisedByPhone: string;
  flow: RequisitionFlow;
  // Flow-specific data
  salesData?: SalesFlowData;
  hiringData?: HiringFlowData;
  // Status & workflow
  status: AdvancedRequisitionStatus;
  // Approval
  rmgNotes: string;
  rejectionReason: string;
  // Assignment
  podLeadAssigned: string;
  recruiterAssigned: string;
  targetClosureDate: string;
  // Links (in update view)
  linkedInRecruiterLink: string;
  atsSheetLink: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Financial summary
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

// Helpers
export function createEmptyLineItem(): VSDLineItem {
  return {
    id: crypto.randomUUID(),
    creatorType: "",
    otherCreatorTypeSpec: "",
    numberOfCreators: 1,
    experienceLevel: "",
    paymentModel: "",
    estimatedMonthlyOutput: "",
    estimatedHoursPerMonth: "",
    clientUnitPrice: 0,
    targetUnitMargin: 0,
    supplyUnitPay: 0,
    isCombinedPay: false,
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

// ID generation
let salesCounter = 1;
let freelancerCounter = 1;
let studioCounter = 1;

export function generateReqId(flow: RequisitionFlow): string {
  switch (flow) {
    case "sales": return `S-${String(salesCounter++).padStart(3, "0")}`;
    case "freelancer": return `F-${String(freelancerCounter++).padStart(3, "0")}`;
    case "studio": return `CS-${String(studioCounter++).padStart(3, "0")}`;
  }
}

// Flag logic
export function getReqFlag(req: AdvancedRequisition): "red" | "yellow" | null {
  if (req.status.startsWith("Closed") || req.status === "Scrapped") return null;
  const daysOpen = Math.round((Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  if (req.flow === "sales" || req.flow === "freelancer") {
    if (daysOpen >= 5) return "red";
    if (daysOpen >= 4) return "yellow";
  } else if (req.flow === "studio") {
    if (daysOpen >= 30) return "red";
    if (daysOpen >= 25) return "yellow";
  }
  return null;
}
