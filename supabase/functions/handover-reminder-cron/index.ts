import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const now = Date.now();
    const { data: reminders } = await admin
      .from("handover_reminders")
      .select("*")
      .eq("resolved", false);

    let sent = 0;
    let resolved = 0;

    for (const r of reminders || []) {
      // Check current creator status
      const { data: creator } = await admin
        .from("deployed_creators")
        .select("deal_status, creator_name")
        .eq("id", r.creator_id)
        .maybeSingle();

      // If creator no longer "Yet to start", auto-resolve
      if (!creator || creator.deal_status !== "Yet to start") {
        await admin.from("handover_reminders").update({ resolved: true }).eq("id", r.id);
        resolved++;
        continue;
      }

      const handoverTime = new Date(r.handover_date).getTime();
      const lastReminded = r.last_reminded_at ? new Date(r.last_reminded_at).getTime() : 0;
      const timeSinceHandover = now - handoverTime;
      const timeSinceLastReminder = now - lastReminded;

      // Send first reminder after 2 days; then every 2 days
      if (timeSinceHandover >= TWO_DAYS_MS && (lastReminded === 0 || timeSinceLastReminder >= TWO_DAYS_MS)) {
        const daysAgo = Math.floor(timeSinceHandover / (24 * 60 * 60 * 1000));
        await admin.functions.invoke("slack-notify", {
          body: {
            type: "handover_reminder",
            requisitionId: r.requisition_id || undefined,
            data: { creatorName: r.creator_name || creator.creator_name, daysAgo },
          },
        });
        await admin.from("handover_reminders").update({ last_reminded_at: new Date().toISOString() }).eq("id", r.id);
        sent++;
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, resolved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[handover-reminder-cron] error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
