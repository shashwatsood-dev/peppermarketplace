import { supabase } from "@/integrations/supabase/client";

export type SlackEventType =
  | "requisition_created"
  | "daily_update_posted"
  | "creator_handover"
  | "status_change"
  | "handover_reminder";

export interface SlackNotifyPayload {
  type: SlackEventType;
  requisitionId?: string;
  raisedByName?: string;
  raisedByEmail?: string;
  data: Record<string, unknown>;
}

/**
 * Fire-and-forget Slack notification. Errors are logged but never thrown so
 * UI flows are not blocked by Slack failures.
 */
export async function notifySlack(payload: SlackNotifyPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("slack-notify", { body: payload });
    if (error) console.warn("[slack-notify] error:", error.message);
  } catch (err) {
    console.warn("[slack-notify] invoke failed:", err);
  }
}
