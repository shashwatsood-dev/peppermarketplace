import { supabase } from "@/integrations/supabase/client";
import type { PodV2, ClientV2, DealV2, DeployedCreatorV2, HRBPConnect, DealStatus, PodName, CreatorDealStatus, HealthColor, DealCapability } from "./talent-client-types";
import type { CurrencyCode } from "./requisition-types";
import type { PayModel, RoleType } from "./mock-data";
import type { ResourceSource } from "./talent-client-types";
import type { TablesUpdate } from "@/integrations/supabase/types";

// ── Fetch all data as PodV2[] ──────────────────────────────
export async function fetchPods(): Promise<PodV2[]> {
  const { data: clients, error: cErr } = await supabase.from("clients").select("*");
  if (cErr) throw cErr;

  const { data: deals, error: dErr } = await supabase.from("deals").select("*");
  if (dErr) throw dErr;

  const { data: creators, error: crErr } = await supabase.from("deployed_creators").select("*");
  if (crErr) throw crErr;

  const { data: connects, error: hErr } = await supabase.from("hrbp_connects").select("*");
  if (hErr) throw hErr;

  const { data: payments, error: pErr } = await supabase.from("monthly_payments").select("*");
  if (pErr) throw pErr;

  // Build lookup maps
  const connectsByCreator = new Map<string, HRBPConnect[]>();
  for (const c of connects || []) {
    const arr = connectsByCreator.get(c.creator_id) || [];
    arr.push({ id: c.id, date: c.date, summary: c.summary, outcome: c.outcome, hrbpName: c.hrbp_name });
    connectsByCreator.set(c.creator_id, arr);
  }

  const paymentsByCreator = new Map<string, { month: string; amount: number; paid: boolean }[]>();
  for (const p of payments || []) {
    const arr = paymentsByCreator.get(p.creator_id) || [];
    arr.push({ month: p.month, amount: Number(p.amount), paid: p.paid });
    paymentsByCreator.set(p.creator_id, arr);
  }

  const creatorsByDeal = new Map<string, DeployedCreatorV2[]>();
  for (const cr of creators || []) {
    const arr = creatorsByDeal.get(cr.deal_id) || [];
    arr.push({
      id: cr.id,
      creatorName: cr.creator_name,
      role: cr.role as RoleType,
      source: cr.source as ResourceSource,
      payModel: cr.pay_model as PayModel,
      payRate: Number(cr.pay_rate),
      expectedVolume: Number(cr.expected_volume),
      totalCost: Number(cr.total_cost),
      clientBilling: Number(cr.client_billing),
      grossMargin: Number(cr.client_billing) - Number(cr.total_cost),
      grossMarginPercent: Number(cr.client_billing) ? Math.round((Number(cr.client_billing) - Number(cr.total_cost)) / Number(cr.client_billing) * 1000) / 10 : 0,
      dealStatus: cr.deal_status as CreatorDealStatus,
      capabilityLeadRating: (cr.capability_lead_rating || "") as HealthColor | "",
      bopmRating: (cr.bopm_rating || "") as HealthColor | "",
      capabilityRatingReason: cr.capability_rating_reason,
      bopmRatingReason: cr.bopm_rating_reason,
      hrbpName: cr.hrbp_name,
      hrbpConnects: connectsByCreator.get(cr.id) || [],
      monthlyPayments: paymentsByCreator.get(cr.id) || [],
      startDate: cr.start_date,
      city: cr.city,
      opsLink: cr.ops_link,
      linkedinId: cr.linkedin_id,
      currency: cr.currency as CurrencyCode,
    });
    creatorsByDeal.set(cr.deal_id, arr);
  }

  const dealsByClient = new Map<string, DealV2[]>();
  for (const d of deals || []) {
    const dCreators = creatorsByDeal.get(d.id) || [];
    const cost = dCreators.reduce((s, c) => s + c.totalCost, 0);
    const rev = dCreators.reduce((s, c) => s + c.clientBilling, 0);
    const tcv = Number(d.total_contract_value);
    const tcc = Number(d.total_creator_cost);
    const finalRev = rev || tcv;
    const finalCost = cost || tcc;

    const arr = dealsByClient.get(d.client_id) || [];
    arr.push({
      id: d.id,
      dealName: d.deal_name,
      dealType: d.deal_type,
      status: d.status as DealStatus,
      creators: dCreators,
      totalContractValue: finalRev || tcv,
      totalCreatorCost: finalCost || tcc,
      grossMargin: (finalRev || tcv) - (finalCost || tcc),
      grossMarginPercent: (finalRev || tcv) ? Math.round(((finalRev || tcv) - (finalCost || tcc)) / (finalRev || tcv) * 1000) / 10 : 0,
      currency: d.currency as CurrencyCode,
      signingEntity: d.signing_entity,
      geography: d.geography,
      isContentStudio: d.is_content_studio,
      vsdName: d.vsd_name,
      mrr: Number(d.mrr),
      contractDuration: d.contract_duration,
      contractStartDate: d.contract_start_date,
      contractEndDate: d.contract_end_date,
      capabilities: (d.capabilities || []) as DealCapability[],
      capabilityLeader: d.capability_leader,
    });
    dealsByClient.set(d.client_id, arr);
  }

  // Group clients by pod
  const podMap = new Map<string, ClientV2[]>();
  for (const c of clients || []) {
    const podName = c.pod_name || "Unassigned";
    const arr = podMap.get(podName) || [];
    arr.push({
      id: c.id,
      clientName: c.client_name,
      vsdName: c.vsd_name,
      principalBOPM: c.principal_bopm,
      seniorBOPM: c.senior_bopm,
      juniorBOPM: c.junior_bopm,
      deals: dealsByClient.get(c.id) || [],
    });
    podMap.set(podName, arr);
  }

  const podOrder: PodName[] = ["Integrated", "India B2B", "US B2B", "FMCG", "BFSI", "Unassigned"];
  const result: PodV2[] = [];
  for (const name of podOrder) {
    result.push({ name, clients: podMap.get(name) || [] });
    podMap.delete(name);
  }
  for (const [name, clients] of podMap) {
    result.push({ name: name as PodName, clients });
  }

  return result;
}

// ── Mutations ──────────────────────────────────────────────

export async function dbAddClientToPod(podName: PodName, client: { clientName: string; vsdName: string; principalBOPM: string; seniorBOPM: string; juniorBOPM: string }) {
  const id = `CL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from("clients").insert({
    id, pod_name: podName, client_name: client.clientName, vsd_name: client.vsdName,
    principal_bopm: client.principalBOPM, senior_bopm: client.seniorBOPM, junior_bopm: client.juniorBOPM,
  });
  if (error) throw error;
  return id;
}

export async function dbUpdateClient(clientId: string, updates: Partial<{ vsdName: string; principalBOPM: string; seniorBOPM: string; juniorBOPM: string }>) {
  const mapped: TablesUpdate<"clients"> = {};
  if (updates.vsdName !== undefined) mapped.vsd_name = updates.vsdName;
  if (updates.principalBOPM !== undefined) mapped.principal_bopm = updates.principalBOPM;
  if (updates.seniorBOPM !== undefined) mapped.senior_bopm = updates.seniorBOPM;
  if (updates.juniorBOPM !== undefined) mapped.junior_bopm = updates.juniorBOPM;
  const { error } = await supabase.from("clients").update(mapped).eq("id", clientId);
  if (error) throw error;
}

export async function dbMoveClientToPod(clientId: string, targetPod: PodName) {
  const { error } = await supabase.from("clients").update({ pod_name: targetPod }).eq("id", clientId);
  if (error) throw error;
}

export async function dbAddDealToClient(clientId: string, deal: {
  dealName: string; dealType: string; status: DealStatus; currency: CurrencyCode;
  signingEntity: string; geography: string; isContentStudio?: boolean; vsdName?: string;
  mrr?: number; contractDuration?: string; contractStartDate?: string; contractEndDate?: string;
  capabilities?: string[]; capabilityLeader?: string;
}) {
  const id = `D-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from("deals").insert({
    id, client_id: clientId, deal_name: deal.dealName, deal_type: deal.dealType, status: deal.status,
    currency: deal.currency, signing_entity: deal.signingEntity, geography: deal.geography,
    is_content_studio: deal.isContentStudio ?? false, vsd_name: deal.vsdName ?? "",
    mrr: deal.mrr ?? 0, contract_duration: deal.contractDuration ?? "",
    contract_start_date: deal.contractStartDate ?? "", contract_end_date: deal.contractEndDate ?? "",
    capabilities: deal.capabilities ?? [], capability_leader: deal.capabilityLeader ?? "",
  });
  if (error) throw error;
  return id;
}

export async function dbUpdateDeal(dealId: string, updates: Partial<{
  dealName: string; dealType: string; status: DealStatus; isContentStudio: boolean; vsdName: string;
  totalContractValue: number; totalCreatorCost: number; currency: CurrencyCode; signingEntity: string; geography: string;
  mrr: number; contractDuration: string; contractStartDate: string; contractEndDate: string;
  capabilities: string[]; capabilityLeader: string;
}>) {
  const mapped: TablesUpdate<"deals"> = {};
  if (updates.dealName !== undefined) mapped.deal_name = updates.dealName;
  if (updates.dealType !== undefined) mapped.deal_type = updates.dealType;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.isContentStudio !== undefined) mapped.is_content_studio = updates.isContentStudio;
  if (updates.vsdName !== undefined) mapped.vsd_name = updates.vsdName;
  if (updates.totalContractValue !== undefined) mapped.total_contract_value = updates.totalContractValue;
  if (updates.totalCreatorCost !== undefined) mapped.total_creator_cost = updates.totalCreatorCost;
  if (updates.currency !== undefined) mapped.currency = updates.currency;
  if (updates.signingEntity !== undefined) mapped.signing_entity = updates.signingEntity;
  if (updates.geography !== undefined) mapped.geography = updates.geography;
  if (updates.mrr !== undefined) mapped.mrr = updates.mrr;
  if (updates.contractDuration !== undefined) mapped.contract_duration = updates.contractDuration;
  if (updates.contractStartDate !== undefined) mapped.contract_start_date = updates.contractStartDate;
  if (updates.contractEndDate !== undefined) mapped.contract_end_date = updates.contractEndDate;
  if (updates.capabilities !== undefined) mapped.capabilities = updates.capabilities;
  if (updates.capabilityLeader !== undefined) mapped.capability_leader = updates.capabilityLeader;
  const { error } = await supabase.from("deals").update(mapped).eq("id", dealId);
  if (error) throw error;
}

export async function dbAddCreatorToDeal(dealId: string, creator: {
  creatorName: string; role: RoleType; source: ResourceSource; payModel: PayModel;
  payRate: number; expectedVolume: number; totalCost: number; clientBilling: number;
  dealStatus: CreatorDealStatus; capabilityLeadRating: HealthColor | ""; bopmRating: HealthColor | "";
  city?: string; opsLink?: string; linkedinId?: string; currency?: CurrencyCode;
}) {
  const id = `DC-${Date.now()}`;
  const { error } = await supabase.from("deployed_creators").insert({
    id, deal_id: dealId, creator_name: creator.creatorName, role: creator.role, source: creator.source,
    pay_model: creator.payModel, pay_rate: creator.payRate, expected_volume: creator.expectedVolume,
    total_cost: creator.totalCost, client_billing: creator.clientBilling, deal_status: creator.dealStatus,
    capability_lead_rating: creator.capabilityLeadRating, bopm_rating: creator.bopmRating,
    start_date: new Date().toISOString().split("T")[0],
    city: creator.city || "", ops_link: creator.opsLink || "", linkedin_id: creator.linkedinId || "",
    currency: creator.currency || "INR",
  });
  if (error) throw error;
  return id;
}

export async function dbUpdateCreator(creatorId: string, updates: Partial<DeployedCreatorV2>) {
  const mapped: TablesUpdate<"deployed_creators"> = {};
  if (updates.creatorName !== undefined) mapped.creator_name = updates.creatorName;
  if (updates.role !== undefined) mapped.role = updates.role;
  if (updates.source !== undefined) mapped.source = updates.source;
  if (updates.payModel !== undefined) mapped.pay_model = updates.payModel;
  if (updates.payRate !== undefined) mapped.pay_rate = updates.payRate;
  if (updates.expectedVolume !== undefined) mapped.expected_volume = updates.expectedVolume;
  if (updates.totalCost !== undefined) mapped.total_cost = updates.totalCost;
  if (updates.clientBilling !== undefined) mapped.client_billing = updates.clientBilling;
  if (updates.dealStatus !== undefined) mapped.deal_status = updates.dealStatus;
  if (updates.capabilityLeadRating !== undefined) mapped.capability_lead_rating = updates.capabilityLeadRating;
  if (updates.bopmRating !== undefined) mapped.bopm_rating = updates.bopmRating;
  if (updates.capabilityRatingReason !== undefined) mapped.capability_rating_reason = updates.capabilityRatingReason;
  if (updates.bopmRatingReason !== undefined) mapped.bopm_rating_reason = updates.bopmRatingReason;
  if (updates.hrbpName !== undefined) mapped.hrbp_name = updates.hrbpName;
  if (updates.city !== undefined) mapped.city = updates.city;
  if (updates.opsLink !== undefined) mapped.ops_link = updates.opsLink;
  if (updates.linkedinId !== undefined) mapped.linkedin_id = updates.linkedinId;
  if (updates.currency !== undefined) mapped.currency = updates.currency;
  if (Object.keys(mapped).length === 0) return;
  const { error } = await supabase.from("deployed_creators").update(mapped).eq("id", creatorId);
  if (error) throw error;
}

export async function dbRemoveCreator(creatorId: string) {
  const { error } = await supabase.from("deployed_creators").delete().eq("id", creatorId);
  if (error) throw error;
}

export async function dbCopyCreatorsToDeal(sourceDealId: string, targetDealId: string, creatorIds: string[], removeFromSource: boolean) {
  const { data: creators, error } = await supabase.from("deployed_creators").select("*").in("id", creatorIds);
  if (error) throw error;
  if (!creators || creators.length === 0) return;

  const copies = creators.map(cr => ({
    id: `DC-CPY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deal_id: targetDealId, creator_name: cr.creator_name, role: cr.role, source: cr.source,
    pay_model: cr.pay_model, pay_rate: cr.pay_rate, expected_volume: cr.expected_volume,
    total_cost: cr.total_cost, client_billing: cr.client_billing, deal_status: cr.deal_status,
    capability_lead_rating: cr.capability_lead_rating, bopm_rating: cr.bopm_rating,
    capability_rating_reason: cr.capability_rating_reason, bopm_rating_reason: cr.bopm_rating_reason,
    hrbp_name: cr.hrbp_name, start_date: cr.start_date, city: cr.city,
    ops_link: cr.ops_link, linkedin_id: cr.linkedin_id, currency: cr.currency,
  }));
  const { error: insErr } = await supabase.from("deployed_creators").insert(copies);
  if (insErr) throw insErr;

  if (removeFromSource) {
    const { error: delErr } = await supabase.from("deployed_creators").delete().in("id", creatorIds);
    if (delErr) throw delErr;
  }
}

export async function dbAddHRBPConnect(creatorId: string, connect: { date: string; summary: string; outcome: string; hrbpName: string }) {
  const id = `HRBP-${Date.now()}`;
  const { error } = await supabase.from("hrbp_connects").insert({
    id, creator_id: creatorId, date: connect.date, summary: connect.summary,
    outcome: connect.outcome, hrbp_name: connect.hrbpName,
  });
  if (error) throw error;
}

export async function dbParseClientCSV(csvText: string, podName: PodName): Promise<{ added: number }> {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return { added: 0 };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  let added = 0;

  const clientMap = new Map<string, { clientName: string; vsdName: string; principalBOPM: string; deals: Map<string, { dealName: string; dealType: string; creators: { name: string; role: string; payModel: string; payRate: number; cost: number; billing: number; city: string }[] }> }>();

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
      clientMap.set(clientName, { clientName, vsdName: get("vsdname"), principalBOPM: get("principalbopm"), deals: new Map() });
    }
    const ce = clientMap.get(clientName)!;
    if (!ce.deals.has(dealName)) {
      ce.deals.set(dealName, { dealName, dealType: get("dealtype") || "Retainer", creators: [] });
    }
    ce.deals.get(dealName)!.creators.push({
      name: get("creatorname") || "Unknown", role: get("role") || "Writer",
      payModel: get("paymodel") || "Per Word", payRate: Number(get("payrate")) || 0,
      cost: Number(get("cost")) || 0, billing: Number(get("billing")) || 0, city: get("city") || "",
    });
    added++;
  }

  for (const [, ce] of clientMap) {
    const clientId = `CL-CSV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await supabase.from("clients").insert({
      id: clientId, pod_name: podName, client_name: ce.clientName,
      vsd_name: ce.vsdName, principal_bopm: ce.principalBOPM,
    });
    for (const [, de] of ce.deals) {
      const dealId = `D-CSV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await supabase.from("deals").insert({
        id: dealId, client_id: clientId, deal_name: de.dealName, deal_type: de.dealType,
      });
      for (let j = 0; j < de.creators.length; j++) {
        const cr = de.creators[j];
        await supabase.from("deployed_creators").insert({
          id: `DC-CSV-${Date.now()}-${j}`, deal_id: dealId, creator_name: cr.name,
          role: cr.role, pay_model: cr.payModel, pay_rate: cr.payRate,
          total_cost: cr.cost, client_billing: cr.billing, city: cr.city,
        });
      }
    }
  }

  return { added };
}

export function dbGetClientCSVTemplate(): string {
  return "clientName,vsdName,principalBOPM,dealName,dealType,currency,creatorName,role,payModel,payRate,volume,cost,billing,city\nAcme Corp,John VSD,Jane BOPM,Content Retainer,Retainer,INR,Writer One,Writer,Per Word,5,100000,50000,85000,Mumbai";
}

export function exportPodsAsCSV(pods: PodV2[]): string {
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
