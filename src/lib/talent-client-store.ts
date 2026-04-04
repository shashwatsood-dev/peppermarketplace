import { PayModel, RoleType } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/requisition-types";

// Re-export all types from the dedicated types file
export type { CreatorDealStatus, DealStatus, HealthColor, ResourceSource, PodName, HRBPConnect, MonthlyPayment, DeployedCreatorV2, DealV2, ClientV2, PodV2 } from "./talent-client-types";
export { POD_NAMES } from "./talent-client-types";

import type { CreatorDealStatus, DealStatus, HealthColor, ResourceSource, DeployedCreatorV2, DealV2, ClientV2, PodV2, PodName, HRBPConnect } from "./talent-client-types";

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
    currency: "INR", signingEntity: entity, geography: geo, isContentStudio: false,
  };
}

import { initialPods } from "./pods-seed-data";
let pods: PodV2[] = initialPods;

export function getPods(): PodV2[] { return pods; }

export function addClientToPod(podName: PodName, client: Omit<ClientV2, "id" | "deals"> & { deals?: DealV2[] }): ClientV2 {
  const newClient: ClientV2 = {
    ...client,
    id: `CL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deals: client.deals || [],
  };
  pods = pods.map(p => p.name === podName ? { ...p, clients: [...p.clients, newClient] } : p);
  return newClient;
}

export function addDealToClient(clientId: string, deal: { dealName: string; dealType: string; status: DealStatus; currency: CurrencyCode; signingEntity: string; geography: string }): DealV2 {
  const newDeal: DealV2 = {
    id: `D-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...deal,
    creators: [],
    totalContractValue: 0,
    totalCreatorCost: 0,
    grossMargin: 0,
    grossMarginPercent: 0,
  };
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => c.id === clientId ? { ...c, deals: [...c.deals, newDeal] } : c),
  }));
  return newDeal;
}

export function exportAllDataAsCSV(): string {
  const rows: string[] = ["Pod,Client,VSD,PrincipalBOPM,DealName,DealType,DealStatus,Currency,CreatorName,Role,Source,PayModel,PayRate,Volume,Cost,Billing,City,Status"];
  for (const pod of pods) {
    for (const client of pod.clients) {
      for (const deal of client.deals) {
        if (deal.creators.length === 0) {
          rows.push([pod.name, client.clientName, client.vsdName, client.principalBOPM, deal.dealName, deal.dealType, deal.status, deal.currency, "", "", "", "", "", "", "", "", "", ""].join(","));
        }
        for (const cr of deal.creators) {
          rows.push([pod.name, client.clientName, client.vsdName, client.principalBOPM, deal.dealName, deal.dealType, deal.status, deal.currency, cr.creatorName, cr.role, cr.source, cr.payModel, cr.payRate, cr.expectedVolume, cr.totalCost, cr.clientBilling, cr.city, cr.dealStatus].join(","));
        }
      }
    }
  }
  return rows.join("\n");
}

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

// ── CSV Import for Talent x Client view ────────────────────────────

export function getClientCSVTemplate(): string {
  return "clientName,vsdName,principalBOPM,dealName,dealType,currency,creatorName,role,payModel,payRate,volume,cost,billing,city\nAcme Corp,John VSD,Jane BOPM,Content Retainer,Retainer,INR,Writer One,Writer,Per Word,5,100000,50000,85000,Mumbai";
}

export function parseClientCSV(csvText: string, podName: PodName): { added: number } {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return { added: 0 };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  let added = 0;
  const clientMap = new Map<string, { client: Partial<ClientV2>; deals: Map<string, { deal: Partial<DealV2>; creators: DeployedCreatorV2[] }> }>();

  for (let i = 1; i < lines.length; i++) {
    const vals: string[] = [];
    let current = ""; let inQ = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    vals.push(current.trim());

    const get = (k: string) => vals[headers.indexOf(k)] || "";
    const clientName = get("clientname");
    const dealName = get("dealname");
    if (!clientName || !dealName) continue;

    if (!clientMap.has(clientName)) {
      clientMap.set(clientName, {
        client: { clientName, vsdName: get("vsdname"), principalBOPM: get("principalbopm"), seniorBOPM: "", juniorBOPM: "" },
        deals: new Map(),
      });
    }
    const ce = clientMap.get(clientName)!;
    if (!ce.deals.has(dealName)) {
      ce.deals.set(dealName, {
        deal: { dealName, dealType: get("dealtype") || "Retainer" },
        creators: [],
      });
    }
    const de = ce.deals.get(dealName)!;
    const cost = Number(get("cost")) || 0;
    const billing = Number(get("billing")) || 0;
    de.creators.push(makeCreator(
      `DC-CSV-${Date.now()}-${i}`, get("creatorname") || "Unknown",
      (get("role") || "Writer") as RoleType, "Freelancer",
      (get("paymodel") || "Per Word") as PayModel,
      Number(get("payrate")) || 0, Number(get("volume")) || 0,
      cost, billing, "Active", "green", "green", get("city")
    ));
    added++;
  }

  // Add to pods
  for (const [, ce] of clientMap) {
    const deals: DealV2[] = [];
    for (const [, de] of ce.deals) {
      deals.push(makeDeal(`D-CSV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, de.deal.dealName || "", de.deal.dealType || "Retainer", "Active", de.creators));
    }
    const newClient: ClientV2 = {
      id: `CL-CSV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clientName: ce.client.clientName || "",
      vsdName: ce.client.vsdName || "",
      principalBOPM: ce.client.principalBOPM || "",
      seniorBOPM: ce.client.seniorBOPM || "",
      juniorBOPM: ce.client.juniorBOPM || "",
      deals,
    };
    const podIdx = pods.findIndex(p => p.name === podName);
    if (podIdx >= 0) {
      pods = pods.map((p, i) => i === podIdx ? { ...p, clients: [...p.clients, newClient] } : p);
    }
  }

  return { added };
}
