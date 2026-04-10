import { PayModel } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/requisition-types";

export interface CreatorHandover {
  id: string;
  requisitionId: string;
  dealId: string;
  creatorName: string;
  creatorEmail: string;
  creatorType: string;
  pepperPortalLink: string;
  phone: string;
  paymentModel: PayModel;
  finalizedPay: number;
  currency: CurrencyCode;
  handoverDate: string;
  sharedVia: ("email" | "slack")[];
  sharedTo: string;
  notes: string;
  recruiterName: string;
  marginFromRequisition: number;
  marginOverridden: boolean;
}

let handovers: CreatorHandover[] = [];

export function getHandovers(): CreatorHandover[] {
  return [...handovers];
}

export function getHandoversByDeal(dealId: string): CreatorHandover[] {
  return handovers.filter((h) => h.dealId === dealId);
}

export function addHandover(handover: Omit<CreatorHandover, "id">): CreatorHandover {
  const newHandover: CreatorHandover = {
    ...handover,
    id: `HO-${String(handovers.length + 1).padStart(3, "0")}`,
  };
  handovers = [...handovers, newHandover];
  return newHandover;
}

export function formatHandoverForSharing(h: CreatorHandover): string {
  return `🤝 *Creator Handover*
━━━━━━━━━━━━━━━━
*Name:* ${h.creatorName}
*Email:* ${h.creatorEmail}
*Type:* ${h.creatorType}
*Portal Link:* ${h.pepperPortalLink}
*Phone:* ${h.phone}
*Payment Model:* ${h.paymentModel}
*Finalized Pay:* ${h.currency === "USD" ? "$" : "₹"}${h.finalizedPay.toLocaleString()}
*Deal:* ${h.dealId}
*Recruiter:* ${h.recruiterName}
*Notes:* ${h.notes || "—"}
━━━━━━━━━━━━━━━━`;
}
