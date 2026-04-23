import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

type EventType =
  | "requisition_created"
  | "daily_update_posted"
  | "creator_handover"
  | "status_change"
  | "handover_reminder";

interface Payload {
  type: EventType;
  requisitionId?: string;
  raisedByName?: string;
  raisedByEmail?: string;
  data: Record<string, unknown>;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function slackCall(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": SLACK_API_KEY,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) console.warn(`[slack ${method}] error:`, json.error, json);
  return json;
}

async function lookupUserByEmail(email?: string): Promise<string | null> {
  if (!email) return null;
  try {
    const res = await fetch(`${GATEWAY_URL}/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
      },
    });
    const j = await res.json();
    return j.ok && j.user?.id ? j.user.id : null;
  } catch { return null; }
}

async function getSettings() {
  const { data } = await admin.from("app_settings").select("*").in("key", ["slack_channel", "slack_enabled"]);
  const map: Record<string, unknown> = {};
  (data || []).forEach((r: any) => { map[r.key] = r.value; });
  return {
    channel: (map.slack_channel as string) || "#test-for-vsd-ops",
    enabled: map.slack_enabled !== false,
  };
}

async function getOrCreateThread(requisitionId: string, channel: string, parentText: string, raiserSlackId: string | null) {
  const { data: existing } = await admin
    .from("requisition_slack_threads")
    .select("*")
    .eq("requisition_id", requisitionId)
    .maybeSingle();
  if (existing?.thread_ts) return existing;

  const post = await slackCall("chat.postMessage", { channel, text: parentText, mrkdwn: true });
  if (!post.ok) return null;

  const row = {
    requisition_id: requisitionId,
    channel_id: post.channel,
    thread_ts: post.ts,
    raised_by_slack_user: raiserSlackId || "",
  };
  await admin.from("requisition_slack_threads").upsert(row);
  return row;
}

function fmtRequisitionParent(p: Payload, raiserMention: string): string {
  const d = p.data as any;
  return [
    `:rocket: *New Requisition Raised* — \`${p.requisitionId}\``,
    `*Raised By:* ${raiserMention || p.raisedByName || "Unknown"}`,
    d.clientName ? `*Client:* ${d.clientName}` : null,
    d.dealId ? `*Deal:* ${d.dealId}` : null,
    d.flow ? `*Flow:* ${d.flow}` : null,
    d.creatorType ? `*Creator Type:* ${d.creatorType}` : null,
    d.paymentModel ? `*Payment Model:* ${d.paymentModel}` : null,
    d.numCreators ? `*# Creators:* ${d.numCreators}` : null,
    d.stage ? `*Stage:* ${d.stage}` : null,
    d.expectedPay ? `*Expected Pay:* ${d.expectedPay}` : null,
    d.sow ? `*SoW:* ${d.sow}` : null,
    d.notes ? `*Notes:* ${d.notes}` : null,
  ].filter(Boolean).join("\n");
}

function fmtDailyUpdate(d: any): string {
  return [
    ":bar_chart: *Daily Funnel Update*",
    `• Identified: *${d.identified ?? 0}*  • Contacted: *${d.contacted ?? 0}*  • Screened: *${d.screened ?? 0}*`,
    `• Shared: *${d.shared ?? 0}*  • Interviews: *${d.interviews ?? 0}*  • Offers: *${d.offers ?? 0}*`,
    `• Selected: *${d.selected ?? 0}*  • Drop-offs: *${d.dropOffs ?? 0}*`,
    d.notes ? `*Notes:* ${d.notes}` : null,
    d.blockers ? `*Blockers:* ${d.blockers}` : null,
    d.recruiterName ? `_— ${d.recruiterName}_` : null,
  ].filter(Boolean).join("\n");
}

function fmtHandover(d: any): string {
  const cur = d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : d.currency === "GBP" ? "£" : "₹";
  return [
    ":handshake: *Creator Handover*",
    `*Name:* ${d.creatorName}`,
    d.creatorType ? `*Type:* ${d.creatorType}` : null,
    d.paymentModel ? `*Payment:* ${d.paymentModel} @ ${cur}${(d.finalizedPay || 0).toLocaleString()}` : null,
    d.dealId ? `*Deal:* ${d.dealId}` : null,
    d.recruiterName ? `*Recruiter:* ${d.recruiterName}` : null,
    d.notes ? `*Notes:* ${d.notes}` : null,
  ].filter(Boolean).join("\n");
}

function fmtStatusChange(d: any, raiserMention: string): string {
  return `:arrows_counterclockwise: *Status Changed:* \`${d.oldStatus}\` → \`${d.newStatus}\` by ${d.changedBy || "User"}${raiserMention ? ` (cc ${raiserMention})` : ""}`;
}

function fmtReminder(d: any, raiserMention: string): string {
  return `:bell: ${raiserMention || "Hey"} — *${d.creatorName}* was handed over ${d.daysAgo} days ago and is still in *Yet to start*. Please allot the first assignment.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    const settings = await getSettings();
    if (!settings.enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const channel = settings.channel;
    const raiserSlackId = await lookupUserByEmail(payload.raisedByEmail);
    const raiserMention = raiserSlackId ? `<@${raiserSlackId}>` : (payload.raisedByName ? `*${payload.raisedByName}*` : "");

    // For requisition_created, post parent message + store thread
    if (payload.type === "requisition_created" && payload.requisitionId) {
      const text = fmtRequisitionParent(payload, raiserMention);
      const thread = await getOrCreateThread(payload.requisitionId, channel, text, raiserSlackId);
      return new Response(JSON.stringify({ ok: true, thread }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For all other events, find the existing thread
    let threadTs: string | null = null;
    let threadChannel = channel;
    if (payload.requisitionId) {
      const { data: t } = await admin
        .from("requisition_slack_threads")
        .select("*")
        .eq("requisition_id", payload.requisitionId)
        .maybeSingle();
      if (t) { threadTs = t.thread_ts; threadChannel = t.channel_id; }
    }

    let text = "";
    if (payload.type === "daily_update_posted") text = fmtDailyUpdate(payload.data);
    else if (payload.type === "creator_handover") text = fmtHandover(payload.data);
    else if (payload.type === "status_change") text = fmtStatusChange(payload.data, raiserMention);
    else if (payload.type === "handover_reminder") text = fmtReminder(payload.data, raiserMention);
    else text = "Unknown event";

    const body: Record<string, unknown> = { channel: threadChannel, text, mrkdwn: true };
    if (threadTs) body.thread_ts = threadTs;
    const result = await slackCall("chat.postMessage", body);

    return new Response(JSON.stringify({ ok: result.ok, slack: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[slack-notify] fatal:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
