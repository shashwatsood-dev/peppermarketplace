import { PayModel, RoleType } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/requisition-types";

// Re-export all types from the dedicated types file
export type { CreatorDealStatus, DealStatus, HealthColor, ResourceSource, PodName, HRBPConnect, MonthlyPayment, DeployedCreatorV2, DealV2, ClientV2, PodV2 } from "./talent-client-types";
export { POD_NAMES, ALL_POD_NAMES } from "./talent-client-types";

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
    opsLink: "", linkedinId: "", currency: "INR",
  };
}

function makeDeal(id: string, name: string, type: string, status: DealStatus, creators: DeployedCreatorV2[], geo: string = "", entity: string = "", vsd: string = ""): DealV2 {
  const cost = creators.reduce((s, c) => s + c.totalCost, 0);
  const rev = creators.reduce((s, c) => s + c.clientBilling, 0);
  return {
    id, dealName: name, dealType: type, status, creators,
    totalContractValue: rev, totalCreatorCost: cost,
    grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0,
    currency: "INR", signingEntity: entity, geography: geo, isContentStudio: false, vsdName: vsd,
    mrr: 0, contractDuration: "", contractStartDate: "", contractEndDate: "", capabilities: [], capabilityLeader: "", healthStatus: "",
  };
}

import { initialPods } from "./pods-seed-data";
import { importedCreatorsByDeal, newClientDeals } from "./csv-creator-import";

// Merge CSV-imported creators into seed data
function mergeImportedData(basePods: PodV2[]): PodV2[] {
  let result = basePods.map(p => ({
    ...p,
    clients: p.clients.map(c => ({
      ...c,
      deals: c.deals.map(d => {
        const imported = importedCreatorsByDeal[d.id];
        if (!imported || imported.length === 0) return d;
        const creators = [...d.creators, ...imported];
        const cost = creators.reduce((s, cr) => s + cr.totalCost, 0);
        const rev = creators.reduce((s, cr) => s + cr.clientBilling, 0);
        return { ...d, creators, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
      }),
    })),
  }));

  // Add new clients/deals from CSV
  const unassignedPodIdx = result.findIndex(p => p.name === "Unassigned");
  for (const nd of newClientDeals) {
    // Check if client already exists
    let found = false;
    result = result.map(p => ({
      ...p,
      clients: p.clients.map(c => {
        if (c.clientName.toLowerCase() === nd.clientName.toLowerCase()) {
          found = true;
          const cost = nd.creators.reduce((s, cr) => s + cr.totalCost, 0);
          const rev = nd.creators.reduce((s, cr) => s + cr.clientBilling, 0);
          const newDeal: DealV2 = {
            id: nd.csvDealId ? `D-${nd.csvDealId}` : `D-NEW-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
            dealName: nd.dealName, dealType: "Retainer", status: "Active" as const,
            creators: nd.creators, totalContractValue: rev, totalCreatorCost: cost,
            grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0,
            currency: "INR", signingEntity: "", geography: "", isContentStudio: false, vsdName: "",
            mrr: 0, contractDuration: "", contractStartDate: "", contractEndDate: "", capabilities: [], capabilityLeader: "", healthStatus: "",
          };
          return { ...c, deals: [...c.deals, newDeal] };
        }
        return c;
      }),
    }));
    if (!found && unassignedPodIdx >= 0) {
      const cost = nd.creators.reduce((s, cr) => s + cr.totalCost, 0);
      const rev = nd.creators.reduce((s, cr) => s + cr.clientBilling, 0);
      const newClient: ClientV2 = {
        id: `CL-NEW-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        clientName: nd.clientName, vsdName: "", principalBOPM: "", seniorBOPM: "", juniorBOPM: "",
        deals: [{
          id: nd.csvDealId ? `D-${nd.csvDealId}` : `D-NEW-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
          dealName: nd.dealName, dealType: "Retainer", status: "Active",
          creators: nd.creators, totalContractValue: rev, totalCreatorCost: cost,
          grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0,
          currency: "INR", signingEntity: "", geography: "", isContentStudio: false, vsdName: "",
          mrr: 0, contractDuration: "", contractStartDate: "", contractEndDate: "", capabilities: [], capabilityLeader: "", healthStatus: "",
        }],
      };
      result = result.map((p, i) => i === unassignedPodIdx ? { ...p, clients: [...p.clients, newClient] } : p);
    }
  }

  return result;
}

let pods: PodV2[] = mergeImportedData(initialPods);

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

export function addDealToClient(clientId: string, deal: { dealName: string; dealType: string; status: DealStatus; currency: CurrencyCode; signingEntity: string; geography: string; isContentStudio?: boolean; vsdName?: string }): DealV2 {
  const newDeal: DealV2 = {
    id: `D-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...deal,
    isContentStudio: deal.isContentStudio ?? false,
    vsdName: deal.vsdName ?? "",
    creators: [],
    totalContractValue: 0,
    totalCreatorCost: 0,
    grossMargin: 0,
    grossMarginPercent: 0,
    mrr: 0, contractDuration: "", contractStartDate: "", contractEndDate: "", capabilities: [], capabilityLeader: "", healthStatus: "",
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

export function moveClientToPod(clientId: string, targetPod: PodName) {
  let client: ClientV2 | undefined;
  pods = pods.map(p => ({ ...p, clients: p.clients.filter(c => { if (c.id === clientId) { client = c; return false; } return true; }) }));
  if (client) {
    pods = pods.map(p => p.name === targetPod ? { ...p, clients: [...p.clients, client!] } : p);
  }
}

export function updateDeal(dealId: string, updates: Partial<Pick<DealV2, "dealName" | "dealType" | "status" | "totalContractValue" | "totalCreatorCost" | "currency" | "signingEntity" | "geography" | "isContentStudio" | "vsdName">>) {
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

export function addCreatorToDeal(dealId: string, creator: Omit<DeployedCreatorV2, "id" | "grossMargin" | "grossMarginPercent" | "capabilityRatingReason" | "bopmRatingReason" | "hrbpName" | "hrbpConnects" | "monthlyPayments" | "startDate" | "city"> & { city?: string; opsLink?: string; linkedinId?: string; currency?: CurrencyCode }) {
  const newCreator: DeployedCreatorV2 = {
    ...creator,
    id: `DC-${Date.now()}`,
    grossMargin: creator.clientBilling - creator.totalCost,
    grossMarginPercent: creator.clientBilling ? Math.round((creator.clientBilling - creator.totalCost) / creator.clientBilling * 100 * 10) / 10 : 0,
    capabilityRatingReason: "", bopmRatingReason: "",
    hrbpName: "", hrbpConnects: [], monthlyPayments: [],
    startDate: new Date().toISOString().split("T")[0],
    city: creator.city || "",
    opsLink: creator.opsLink || "",
    linkedinId: creator.linkedinId || "",
    currency: creator.currency || "INR",
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

// ── Copy/Transfer Creators between Deals ───────────────────────────

export function copyCreatorsToDeal(sourceDealId: string, targetDealId: string, creatorIds: string[], removeFromSource: boolean = false) {
  let creatorsToCopy: DeployedCreatorV2[] = [];

  // Find the creators in the source deal
  for (const p of pods) {
    for (const c of p.clients) {
      for (const d of c.deals) {
        if (d.id === sourceDealId) {
          creatorsToCopy = d.creators.filter(cr => creatorIds.includes(cr.id));
        }
      }
    }
  }

  if (creatorsToCopy.length === 0) return;

  // Add copies to target deal with new IDs
  const newCreators = creatorsToCopy.map(cr => ({
    ...cr,
    id: `DC-CPY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }));

  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => {
        if (d.id === targetDealId) {
          const creators = [...d.creators, ...newCreators];
          const cost = creators.reduce((s, cr) => s + cr.totalCost, 0);
          const rev = creators.reduce((s, cr) => s + cr.clientBilling, 0);
          return { ...d, creators, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
        }
        if (removeFromSource && d.id === sourceDealId) {
          const creators = d.creators.filter(cr => !creatorIds.includes(cr.id));
          const cost = creators.reduce((s, cr) => s + cr.totalCost, 0);
          const rev = creators.reduce((s, cr) => s + cr.clientBilling, 0);
          return { ...d, creators, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
        }
        return d;
      }),
    })),
  }));
}

export function removeCreatorFromDeal(dealId: string, creatorId: string) {
  pods = pods.map(p => ({
    ...p, clients: p.clients.map(c => ({
      ...c, deals: c.deals.map(d => {
        if (d.id !== dealId) return d;
        const creators = d.creators.filter(cr => cr.id !== creatorId);
        const cost = creators.reduce((s, cr) => s + cr.totalCost, 0);
        const rev = creators.reduce((s, cr) => s + cr.clientBilling, 0);
        return { ...d, creators, totalCreatorCost: cost, totalContractValue: rev, grossMargin: rev - cost, grossMarginPercent: rev ? Math.round((rev - cost) / rev * 100 * 10) / 10 : 0 };
      }),
    })),
  }));
}

export function getDealsForClient(clientId: string): DealV2[] {
  for (const p of pods) {
    for (const c of p.clients) {
      if (c.id === clientId) return c.deals;
    }
  }
  return [];
}

export function findClientForDeal(dealId: string): ClientV2 | undefined {
  for (const p of pods) {
    for (const c of p.clients) {
      if (c.deals.some(d => d.id === dealId)) return c;
    }
  }
  return undefined;
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
