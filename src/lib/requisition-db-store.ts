import { supabase } from "@/integrations/supabase/client";
import type { AdvancedRequisition } from "./requisition-types";
import type { Json } from "@/integrations/supabase/types";

// ── Fetch all requisitions from Supabase ──────────────────
export async function fetchRequisitions(): Promise<AdvancedRequisition[]> {
  const { data, error } = await supabase.from("requisitions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => {
    const payload = row.payload as Record<string, unknown>;
    return {
      ...(payload as unknown as AdvancedRequisition),
      id: row.id,
      status: row.status,
    };
  });
}

// ── Create a new requisition ──────────────────────────────
export async function dbCreateRequisition(req: AdvancedRequisition): Promise<string> {
  const { error } = await supabase.from("requisitions").insert({
    id: req.id,
    flow: req.flow,
    status: req.status,
    client_name: req.flow === "sales" ? req.salesData?.clientName || "" : req.hiringData?.clientName || "",
    deal_id: req.flow !== "sales" ? req.hiringData?.dealId || "" : "",
    pod_name: req.flow !== "sales" ? req.hiringData?.pod || "" : "",
    payload: req as unknown as Record<string, unknown>,
  });
  if (error) throw error;
  return req.id;
}

// ── Update requisition (status + full payload) ────────────
export async function dbUpdateRequisition(reqId: string, updates: Partial<AdvancedRequisition>, fullReq: AdvancedRequisition): Promise<void> {
  const merged = { ...fullReq, ...updates };
  const { error } = await supabase.from("requisitions").update({
    status: merged.status,
    client_name: merged.flow === "sales" ? merged.salesData?.clientName || "" : merged.hiringData?.clientName || "",
    deal_id: merged.flow !== "sales" ? merged.hiringData?.dealId || "" : "",
    pod_name: merged.flow !== "sales" ? merged.hiringData?.pod || "" : "",
    payload: merged as unknown as Record<string, unknown>,
  }).eq("id", reqId);
  if (error) throw error;
}

// ── Delete a requisition ──────────────────────────────────
export async function dbDeleteRequisition(reqId: string): Promise<void> {
  const { error } = await supabase.from("requisitions").delete().eq("id", reqId);
  if (error) throw error;
}
