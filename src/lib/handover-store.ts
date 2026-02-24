import { PayModel } from "@/lib/mock-data";

export interface CreatorHandover {
  id: string;
  requisitionId: string;
  dealId: string;
  creatorName: string;
  pepperIdNumber: string;
  pepperPortalLink: string;
  phone: string;
  paymentModel: PayModel;
  finalizedPay: number;
  handoverDate: string;
  sharedVia: ("email" | "slack")[];
  sharedTo: string;
  notes: string;
}

// In-memory store (no backend)
let handovers: CreatorHandover[] = [
  {
    id: "HO-001",
    requisitionId: "REQ-004",
    dealId: "DEAL-003",
    creatorName: "Ananya Desai",
    pepperIdNumber: "PEP-1001",
    pepperPortalLink: "https://ops.peppercontent.io/creators/PEP-1001",
    phone: "+91 98765 43210",
    paymentModel: "Per Word",
    finalizedPay: 7,
    handoverDate: "2026-02-10",
    sharedVia: ["email"],
    sharedTo: "vikram.singh@pepper.com",
    notes: "Senior fintech writer, 4.8 rating",
  },
  {
    id: "HO-002",
    requisitionId: "REQ-004",
    dealId: "DEAL-003",
    creatorName: "Varun Reddy",
    pepperIdNumber: "PEP-1008",
    pepperPortalLink: "https://ops.peppercontent.io/creators/PEP-1008",
    phone: "+91 98765 43217",
    paymentModel: "Per Assignment",
    finalizedPay: 5500,
    handoverDate: "2026-02-10",
    sharedVia: ["slack"],
    sharedTo: "#account-management",
    notes: "Designer for healthcare & fintech",
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
*Pepper ID:* ${h.pepperIdNumber}
*Portal Link:* ${h.pepperPortalLink}
*Phone:* ${h.phone}
*Payment Model:* ${h.paymentModel}
*Finalized Pay:* ₹${h.finalizedPay.toLocaleString()}
*Deal:* ${h.dealId}
*Notes:* ${h.notes || "—"}
━━━━━━━━━━━━━━━━`;
}
