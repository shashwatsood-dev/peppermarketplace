import { PayModel, RoleType } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/requisition-types";

export type CreatorDealStatus = "Yet to start" | "Active" | "Inactive" | "Removed" | "Flagged";
export type DealStatus = "Active" | "Completed" | "On Hold" | "Disputed" | "New Deal in SLA/PO";
export type HealthColor = "green" | "yellow" | "red";
export type ResourceSource = "Freelancer" | "In-house";

export const POD_NAMES = ["Aamir", "Sumit", "Neema", "Sneha", "Aditya"] as const;
export const ALL_POD_NAMES = [...POD_NAMES, "Unassigned"] as const;
export type PodName = typeof ALL_POD_NAMES[number];

export interface HRBPConnect {
  id: string;
  date: string;
  summary: string;
  outcome: string;
  hrbpName: string;
}

export interface MonthlyPayment {
  month: string;
  amount: number;
  paid: boolean;
}

export interface DeployedCreatorV2 {
  id: string;
  creatorName: string;
  role: RoleType;
  source: ResourceSource;
  payModel: PayModel;
  payRate: number;
  expectedVolume: number;
  totalCost: number;
  clientBilling: number;
  grossMargin: number;
  grossMarginPercent: number;
  dealStatus: CreatorDealStatus;
  capabilityLeadRating: HealthColor | "";
  bopmRating: HealthColor | "";
  capabilityRatingReason: string;
  bopmRatingReason: string;
  hrbpName: string;
  hrbpConnects: HRBPConnect[];
  monthlyPayments: MonthlyPayment[];
  startDate: string;
  city: string;
  opsLink: string;
  linkedinId: string;
  currency: CurrencyCode;
}

export const DEAL_CAPABILITIES = ["SEO", "Content", "Creative"] as const;
export type DealCapability = typeof DEAL_CAPABILITIES[number];

export interface DealV2 {
  id: string;
  dealName: string;
  dealType: string;
  totalContractValue: number;
  totalCreatorCost: number;
  grossMargin: number;
  grossMarginPercent: number;
  status: DealStatus;
  creators: DeployedCreatorV2[];
  currency: CurrencyCode;
  signingEntity: string;
  geography: string;
  isContentStudio: boolean;
  vsdName: string;
  mrr: number;
  contractDuration: string;
  contractStartDate: string;
  contractEndDate: string;
  capabilities: DealCapability[];
  capabilityLeader: string;
  healthStatus: HealthColor | "";
}

export interface DealNote {
  id: string;
  dealId: string;
  note: string;
  author: string;
  createdAt: string;
}

export interface CreatorEngagementNote {
  id: string;
  creatorId: string;
  note: string;
  author: string;
  noteType: string;
  createdAt: string;
}

export interface ClientV2 {
  id: string;
  clientName: string;
  vsdName: string;
  principalBOPM: string;
  seniorBOPM: string;
  juniorBOPM: string;
  deals: DealV2[];
}

export interface PodV2 {
  name: PodName;
  clients: ClientV2[];
}
