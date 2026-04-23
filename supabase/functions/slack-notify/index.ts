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

// ---------- Default templates (used if app_settings has none) ----------
const DEFAULT_TEMPLATES: Record<EventType, string> = {
  requisition_created: [
    ":rocket: *New Requisition Raised* — `{{requisitionId}}`",
    "*Raised By:* {{raisedBy}}",
    "*Client:* {{clientName}}",
    "*Deal:* {{dealId}}",
    "*Flow:* {{flow}}",
    "*Creator Type:* {{creatorType}}",
    "*Payment Model:* {{paymentModel}}",
    "*# Creators:* {{numCreators}}",
    "*Stage:* {{stage}}",
    "*Expected Pay:* {{expectedPay}}",
    "*SoW:* {{sow}}",
    "*Notes:* {{notes}}",
  ].join("\n"),
  daily_update_posted: [
    ":bar_chart: *Daily Funnel Update*",
    "• Identified: *{{identified}}*  • Contacted: *{{contacted}}*  • Screened: *{{screened}}*",
    "• Shared: *{{shared}}*  • Interviews: *{{interviews}}*  • Offers: *{{offers}}*",
    "• Selected: *{{selected}}*  • Drop-offs: *{{dropOffs}}*",
    "*Notes:* {{notes}}",
    "*Blockers:* {{blockers}}",
    "_— {{recruiterName}}_",
  ].join("\n"),
  creator_handover: [
    ":handshake: *Creator Handover*",
    "*Name:* {{creatorName}}",
    "*Type:* {{creatorType}}",
    "*Payment:* {{paymentModel}} @ {{currencySymbol}}{{finalizedPay}}",
    "*Deal:* {{dealId}}",
    "*Recruiter:* {{recruiterName}}",
    "*Notes:* {{notes}}",
  ].join("\n"),
  status_change:
    ":arrows_counterclockwise: *Status Changed:* `{{oldStatus}}` → `{{newStatus}}` by {{changedBy}}{{ccRaiser}}",
  handover_reminder:
    ":bell: {{raiserMention}} — *{{creatorName}}* was handed over {{daysAgo}} days ago and is still in *Yet to start*. Please allot the first assignment.",
};

function render(template: string, vars: Record<string, unknown>): string {
  // Replace {{key}} with value; remove lines that consist of a label + empty value (e.g. "*Notes:* ").
  let out = template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
  // Drop lines whose value portion (after a colon) is empty/whitespace, e.g. "*Notes:* " or "_— _"
  out = out
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // "*Label:* " with nothing after
      if (/^\*[^*]+:\*\s*$/.test(trimmed)) return false;
      // "_— _" (dangling recruiter)
      if (/^_[—-]\s*_$/.test(trimmed)) return false;
      return true;
    })
    .join("\n");
  return out;
}

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

async function findChannelId(name: string): Promise<string | null> {
  const clean = name.replace(/^#/, "").toLowerCase();
  let cursor = "";
  do {
    const url = `${GATEWAY_URL}/conversations.list?limit=999&types=public_channel${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
      },
    });
    const data = await res.json();
    if (!data.ok) return null;
    const m = data.channels?.find((c: any) => c.name?.toLowerCase() === clean);
    if (m) return m.id;
    cursor = data.response_metadata?.next_cursor || "";
  } while (cursor);
  return null;
}

async function postWithJoinFallback(channel: string, body: Record<string, unknown>) {
  let result = await slackCall("chat.postMessage", { ...body, channel });
  if (!result.ok && result.error === "not_in_channel") {
    // Try resolving channel ID and joining
    const id = channel.startsWith("C") || channel.startsWith("G") ? channel : await findChannelId(channel);
    if (id) {
      const joined = await slackCall("conversations.join", { channel: id });
      if (joined.ok) {
        result = await slackCall("chat.postMessage", { ...body, channel: id });
      } else {
        // Surface clear hint
        result.hint = `Bot is not in ${channel} and could not auto-join (${joined.error}). Either approve the channels:join / chat:write.public scope in the Slack connector, or run "/invite @<bot>" in the channel.`;
      }
    }
  }
  return result;
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
  const { data } = await admin
    .from("app_settings")
    .select("*")
    .in("key", [
      "slack_channel",
      "slack_enabled",
      "slack_template_requisition_created",
      "slack_template_daily_update_posted",
      "slack_template_creator_handover",
      "slack_template_status_change",
      "slack_template_handover_reminder",
    ]);
  const map: Record<string, unknown> = {};
  (data || []).forEach((r: any) => { map[r.key] = r.value; });
  const tmpl = (key: string, fallback: string) => {
    const v = map[`slack_template_${key}`];
    return typeof v === "string" && v.trim() ? v : fallback;
  };
  return {
    channel: (map.slack_channel as string) || "#test-for-vsd-ops",
    enabled: map.slack_enabled !== false,
    templates: {
      requisition_created: tmpl("requisition_created", DEFAULT_TEMPLATES.requisition_created),
      daily_update_posted: tmpl("daily_update_posted", DEFAULT_TEMPLATES.daily_update_posted),
      creator_handover: tmpl("creator_handover", DEFAULT_TEMPLATES.creator_handover),
      status_change: tmpl("status_change", DEFAULT_TEMPLATES.status_change),
      handover_reminder: tmpl("handover_reminder", DEFAULT_TEMPLATES.handover_reminder),
    },
  };
}

function buildVars(p: Payload, raiserMention: string): Record<string, unknown> {
  const d = (p.data || {}) as any;
  const currencySymbol =
    d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : d.currency === "GBP" ? "£" : "₹";
  return {
    ...d,
    requisitionId: p.requisitionId || "",
    raisedBy: raiserMention || p.raisedByName || "Unknown",
    raisedByName: p.raisedByName || "",
    raiserMention: raiserMention || (p.raisedByName ? `*${p.raisedByName}*` : "Hey"),
    ccRaiser: raiserMention ? ` (cc ${raiserMention})` : "",
    currencySymbol,
    finalizedPay: typeof d.finalizedPay === "number" ? d.finalizedPay.toLocaleString() : (d.finalizedPay || ""),
    changedBy: d.changedBy || "User",
  };
}

async function getOrCreateThread(requisitionId: string, channel: string, parentText: string, raiserSlackId: string | null) {
  const { data: existing } = await admin
    .from("requisition_slack_threads")
    .select("*")
    .eq("requisition_id", requisitionId)
    .maybeSingle();
  if (existing?.thread_ts) return existing;

  const post = await postWithJoinFallback(channel, { text: parentText, mrkdwn: true });
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
    const raiserMention = raiserSlackId
      ? `<@${raiserSlackId}>`
      : (payload.raisedByName ? `*${payload.raisedByName}*` : "");

    const vars = buildVars(payload, raiserMention);
    const template = settings.templates[payload.type] || "Unknown event";
    const text = render(template, vars);

    // Parent message for new requisitions — store thread
    if (payload.type === "requisition_created" && payload.requisitionId) {
      const thread = await getOrCreateThread(payload.requisitionId, channel, text, raiserSlackId);
      return new Response(JSON.stringify({ ok: !!thread, thread }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find existing thread for this requisition (if any)
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

    const body: Record<string, unknown> = { text, mrkdwn: true };
    if (threadTs) body.thread_ts = threadTs;
    const result = await postWithJoinFallback(threadChannel, body);

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
