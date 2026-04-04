import { PayModel, RoleType } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/requisition-types";

export type CreatorDealStatus = "Active" | "Inactive" | "Removed" | "Flagged";
export type DealStatus = "Active" | "Completed" | "On Hold" | "Disputed" | "New Deal in SLA/PO";
export type HealthColor = "green" | "yellow" | "red";
export type ResourceSource = "Freelancer" | "In-house";

export const POD_NAMES = ["Integrated", "India B2B", "US B2B", "FMCG", "BFSI"] as const;
export type PodName = typeof POD_NAMES[number];

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
}

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
