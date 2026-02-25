import { PayModel, RoleType } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/requisition-types";

export type CreatorDealStatus = "Active" | "Inactive" | "Removed" | "Flagged";
export type DealStatus = "Active" | "Completed" | "On Hold";
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
  month: string; // YYYY-MM
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

const CITIES = ["Mumbai", "Bangalore", "Delhi", "Chennai", "Pune", "Hyderabad", "Kochi", "New York", "San Francisco"];

function makeCreator(
  id: string, name: string, role: RoleType, source: ResourceSource,
  payModel: PayModel, payRate: number, volume: number, cost: number,
  billing: number, status: CreatorDealStatus = "Active",
  capRating: HealthColor = "green", bopmRating: HealthColor = "green",
  city: string = ""
): DeployedCreatorV2 {
  return {
    id, creatorName: name, role, source, payModel, payRate,
    expectedVolume: volume, totalCost: cost, clientBilling: billing,
    grossMargin: billing - cost,
    grossMarginPercent: Math.round((billing - cost) / billing * 100 * 10) / 10,
    dealStatus: status, capabilityLeadRating: capRating, bopmRating: bopmRating,
    capabilityRatingReason: "", bopmRatingReason: "",
    hrbpName: "", hrbpConnects: [], monthlyPayments: [],
    startDate: "2026-01-01",
    city: city || CITIES[Math.floor(Math.random() * CITIES.length)],
  };
}

function makeDeal(id: string, name: string, type: string, status: DealStatus, creators: DeployedCreatorV2[], geo: string = "", entity: string = ""): DealV2 {
  const cost = creators.reduce((s, c) => s + c.totalCost, 0);
  const rev = creators.reduce((s, c) => s + c.clientBilling, 0);
  return {
    id, dealName: name, dealType: type, status, creators,
    totalContractValue: rev, totalCreatorCost: cost,
    grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0,
    currency: "INR", signingEntity: entity, geography: geo,
  };
}

let pods: PodV2[] = [
  {
    name: "Integrated",
    clients: [{
      id: "CL-001", clientName: "Razorpay", vsdName: "Amit Shah", principalBOPM: "Priya Sharma", seniorBOPM: "Neha Gupta", juniorBOPM: "Riya Patel",
      deals: [
        makeDeal("D-001", "Fintech Content Hub", "Retainer", "Active", [
          makeCreator("DC-001", "Ananya Desai", "Writer", "Freelancer", "Per Word", 7, 120000, 84000, 140000),
          makeCreator("DC-002", "Divya Krishnan", "Writer", "Freelancer", "Per Word", 6.5, 100000, 65000, 108000),
          makeCreator("DC-003", "Sanya Malhotra", "Editor", "In-house", "Retainer", 3500, 6, 21000, 36000),
        ], "India", "Pepper Content Global Private Limited"),
        makeDeal("D-002", "Payment Docs Refresh", "Project", "Completed", [
          makeCreator("DC-004", "Rohan Kapoor", "Writer", "Freelancer", "Per Word", 5.5, 50000, 27500, 45000),
        ]),
      ],
    }],
  },
  {
    name: "India B2B",
    clients: [
      {
        id: "CL-002", clientName: "Freshworks", vsdName: "Karan Mehta", principalBOPM: "Vikram Singh", seniorBOPM: "Arun Das", juniorBOPM: "Pooja Rao",
        deals: [makeDeal("D-003", "Customer Success Content", "Retainer", "Active", [
          makeCreator("DC-005", "Ananya Desai", "Writer", "Freelancer", "Per Word", 7, 150000, 105000, 175000),
          makeCreator("DC-006", "Varun Reddy", "Designer", "Freelancer", "Per Assignment", 5500, 15, 82500, 140000),
          makeCreator("DC-007", "Internal Design Team", "Designer", "In-house", "Retainer", 0, 10, 0, 25000),
        ])],
      },
      {
        id: "CL-003", clientName: "Zerodha", vsdName: "Sneha Jain", principalBOPM: "Priya Sharma", seniorBOPM: "", juniorBOPM: "Tanvi Nair",
        deals: [makeDeal("D-004", "Investment Education Series", "Retainer", "Active", [
          makeCreator("DC-008", "Megha Rao", "Designer", "Freelancer", "Per Assignment", 4500, 20, 90000, 156000, "Active", "green", "yellow"),
          makeCreator("DC-009", "Karthik Nair", "Video", "Freelancer", "Per Assignment", 13000, 8, 104000, 160000, "Active", "yellow", "green"),
        ])],
      },
    ],
  },
  {
    name: "US B2B",
    clients: [{
      id: "CL-004", clientName: "Notion", vsdName: "Lisa Chen", principalBOPM: "Arjun Mehta", seniorBOPM: "Maya Patel", juniorBOPM: "",
      deals: [makeDeal("D-005", "SaaS Blog Overhaul", "Project", "Active", [
        makeCreator("DC-010", "Rohan Kapoor", "Writer", "Freelancer", "Per Word", 5.5, 80000, 44000, 72000, "Active", "green", "red"),
        makeCreator("DC-011", "Megha Rao", "Designer", "Freelancer", "Per Assignment", 4500, 20, 90000, 156000),
        makeCreator("DC-012", "Internal Copy Team", "Writer", "In-house", "Retainer", 0, 30000, 0, 18000),
      ], "US", "Pepper Content Inc")],
    }],
  },
  {
    name: "FMCG",
    clients: [{
      id: "CL-005", clientName: "Swiggy", vsdName: "Rahul Verma", principalBOPM: "Arjun Mehta", seniorBOPM: "", juniorBOPM: "Isha Kulkarni",
      deals: [makeDeal("D-006", "Brand Storytelling", "Project", "Active", [
        makeCreator("DC-013", "Aditya Joshi", "Writer", "Freelancer", "Per Word", 4.5, 60000, 27000, 42000, "Flagged", "red", "yellow"),
        makeCreator("DC-014", "Karthik Nair", "Video", "Freelancer", "Per Assignment", 13000, 5, 65000, 100000),
      ])],
    }],
  },
  {
    name: "BFSI",
    clients: [{
      id: "CL-006", clientName: "HDFC Bank", vsdName: "Manish Gupta", principalBOPM: "Vikram Singh", seniorBOPM: "Neha Gupta", juniorBOPM: "",
      deals: [makeDeal("D-007", "Digital Banking Content", "Retainer", "Active", [
        makeCreator("DC-015", "Divya Krishnan", "Writer", "Freelancer", "Per Word", 6.5, 90000, 58500, 99000),
        makeCreator("DC-016", "Sanya Malhotra", "Editor", "In-house", "Retainer", 3500, 6, 21000, 36000),
      ])],
    }],
  },
];

export function getPods(): PodV2[] { return pods; }

export function updateClient(clientId: string, updates: Partial<Pick<ClientV2, "vsdName" | "principalBOPM" | "seniorBOPM" | "juniorBOPM">>) {
  pods = pods.map(p => ({ ...p, clients: p.clients.map(c => c.id === clientId ? { ...c, ...updates } : c) }));
}

export function updateDeal(dealId: string, updates: Partial<Pick<DealV2, "dealName" | "dealType" | "status" | "totalContractValue" | "totalCreatorCost" | "currency" | "signingEntity" | "geography">>) {
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => {
        if (d.id !== dealId) return d;
        const updated = { ...d, ...updates };
        if (updates.totalContractValue !== undefined || updates.totalCreatorCost !== undefined) {
          const rev = updates.totalContractValue ?? d.totalContractValue;
          const cost = updates.totalCreatorCost ?? d.totalCreatorCost;
          updated.grossMargin = rev - cost;
          updated.grossMarginPercent = rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0;
        }
        return updated;
      }),
    })),
  }));
}

export function updateCreatorInDeal(dealId: string, creatorId: string, updates: Partial<DeployedCreatorV2>) {
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => {
        if (d.id !== dealId) return d;
        const creators = d.creators.map(cr => cr.id === creatorId ? { ...cr, ...updates } : cr);
        const cost = creators.reduce((s, cr) => s + cr.totalCost, 0);
        const rev = creators.reduce((s, cr) => s + cr.clientBilling, 0);
        return { ...d, creators, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
      }),
    })),
  }));
}

export function addCreatorToDeal(dealId: string, creator: Omit<DeployedCreatorV2, "id" | "grossMargin" | "grossMarginPercent" | "capabilityRatingReason" | "bopmRatingReason" | "hrbpName" | "hrbpConnects" | "monthlyPayments" | "startDate" | "city"> & { city?: string }) {
  const newCreator: DeployedCreatorV2 = {
    ...creator,
    id: `DC-${Date.now()}`,
    grossMargin: creator.clientBilling - creator.totalCost,
    grossMarginPercent: creator.clientBilling ? Math.round((creator.clientBilling - creator.totalCost) / creator.clientBilling * 100 * 10) / 10 : 0,
    capabilityRatingReason: "", bopmRatingReason: "",
    hrbpName: "", hrbpConnects: [], monthlyPayments: [],
    startDate: new Date().toISOString().split("T")[0],
    city: creator.city || "",
  };
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => {
        if (d.id !== dealId) return d;
        const creators = [...d.creators, newCreator];
        const cost = creators.reduce((s, cr) => s + cr.totalCost, 0);
        const rev = creators.reduce((s, cr) => s + cr.clientBilling, 0);
        return { ...d, creators, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
      }),
    })),
  }));
}

export function addHRBPConnect(dealId: string, creatorId: string, connect: Omit<HRBPConnect, "id">) {
  const entry: HRBPConnect = { ...connect, id: `HRBP-${Date.now()}` };
  updateCreatorInDeal(dealId, creatorId, {});
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => ({
        ...d, creators: d.creators.map(cr => cr.id === creatorId && d.id === dealId ? { ...cr, hrbpConnects: [...cr.hrbpConnects, entry] } : cr),
      })),
    })),
  }));
}

export function recalcDealFinancials(dealId: string) {
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => {
        if (d.id !== dealId) return d;
        const cost = d.creators.reduce((s, cr) => s + cr.totalCost, 0);
        const rev = d.creators.reduce((s, cr) => s + cr.clientBilling, 0);
        return { ...d, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
      }),
    })),
  }));
}
