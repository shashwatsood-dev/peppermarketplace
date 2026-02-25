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

let handovers: CreatorHandover[] = [
  {
    id: "HO-001",
    requisitionId: "REQ-004",
    dealId: "DEAL-003",
    creatorName: "Ananya Desai",
    creatorEmail: "ananya@email.com",
    creatorType: "Writer",
    pepperPortalLink: "https://ops.peppercontent.io/creators/PEP-1001",
    phone: "+91 98765 43210",
    paymentModel: "Per Word",
    finalizedPay: 7,
    currency: "INR",
    handoverDate: "2026-02-10",
    sharedVia: ["email"],
    sharedTo: "vikram.singh@pepper.com",
    notes: "Senior fintech writer, 4.8 rating",
    recruiterName: "Neha Gupta",
    marginFromRequisition: 40,
    marginOverridden: false,
  },
  {
    id: "HO-002",
    requisitionId: "REQ-004",
    dealId: "DEAL-003",
    creatorName: "Varun Reddy",
    creatorEmail: "varun@email.com",
    creatorType: "Designer",
    pepperPortalLink: "https://ops.peppercontent.io/creators/PEP-1008",
    phone: "+91 98765 43217",
    paymentModel: "Per Assignment",
    finalizedPay: 5500,
    currency: "INR",
    handoverDate: "2026-02-10",
    sharedVia: ["slack"],
    sharedTo: "#account-management",
    notes: "Designer for healthcare & fintech",
    recruiterName: "Ravi Kumar",
    marginFromRequisition: 41.1,
    marginOverridden: false,
  },
];

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
