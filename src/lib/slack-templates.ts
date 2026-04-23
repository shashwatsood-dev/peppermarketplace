export type SlackTemplateKey =
  | "requisition_created"
  | "daily_update_posted"
  | "creator_handover"
  | "status_change"
  | "handover_reminder";

export const SLACK_TEMPLATE_LABELS: Record<SlackTemplateKey, string> = {
  requisition_created: "New Requisition",
  daily_update_posted: "Daily Funnel Update",
  creator_handover: "Creator Handover",
  status_change: "Status Change",
  handover_reminder: "Handover Reminder (2-day)",
};

export const SLACK_TEMPLATE_VARS: Record<SlackTemplateKey, string[]> = {
  requisition_created: [
    "requisitionId", "raisedBy", "clientName", "dealId", "flow",
    "creatorType", "paymentModel", "numCreators", "stage", "expectedPay",
    "sow", "notes",
  ],
  daily_update_posted: [
    "identified", "contacted", "screened", "shared", "interviews",
    "offers", "selected", "dropOffs", "notes", "blockers", "recruiterName",
  ],
  creator_handover: [
    "creatorName", "creatorType", "paymentModel", "currencySymbol",
    "finalizedPay", "dealId", "recruiterName", "notes",
  ],
  status_change: ["oldStatus", "newStatus", "changedBy", "ccRaiser"],
  handover_reminder: ["raiserMention", "creatorName", "daysAgo"],
};

export const DEFAULT_SLACK_TEMPLATES: Record<SlackTemplateKey, string> = {
  requisition_created: [
    ":rocket: *New Requisition Raised*  ·  `{{requisitionId}}`",
    "Hey team — a fresh requisition just landed. Quick snapshot below :point_down:",
    "",
    ":bust_in_silhouette: *Raised by:*  {{raisedBy}}",
    ":office: *Client:*  *{{clientName}}*   ·   :briefcase: *Deal:*  `{{dealId}}`",
    ":twisted_rightwards_arrows: *Flow:*  {{flow}}   ·   :dart: *Stage:*  {{stage}}",
    "",
    ":sparkles: *Role / Creator Type:*  {{creatorType}}",
    ":busts_in_silhouette: *# of Creators Needed:*  *{{numCreators}}*",
    ":moneybag: *Payment Model:*  {{paymentModel}}   ·   *Expected Pay:*  {{expectedPay}}",
    "",
    ":scroll: *Scope of Work:*",
    "> {{sow}}",
    "",
    ":memo: *Notes:*  {{notes}}",
    "",
    "_Replies, daily updates and handovers for this req will land in this thread._ :thread:",
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
    ":handshake: *Creator Handover — welcome aboard!*",
    "A new creator is being handed over to the delivery team. Please take it from here :rocket:",
    "",
    ":star2: *Creator:*  *{{creatorName}}*",
    ":art: *Type / Role:*  {{creatorType}}",
    ":moneybag: *Payment:*  {{paymentModel}} @ *{{currencySymbol}}{{finalizedPay}}*",
    ":briefcase: *Deal:*  `{{dealId}}`",
    ":mag: *Recruiter:*  {{recruiterName}}",
    "",
    ":memo: *Handover Notes:*",
    "> {{notes}}",
    "",
    "_Status auto-set to *Yet to start*. Please allot the first assignment within 2 days._ :alarm_clock:",
  ].join("\n"),
  status_change:
    ":arrows_counterclockwise: *Requisition Status Changed:* `{{oldStatus}}` → `{{newStatus}}` by {{changedBy}}{{ccRaiser}}",
  handover_reminder:
    ":bell: {{raiserMention}} — *{{creatorName}}* was handed over {{daysAgo}} days ago and is still in *Yet to start*. Please allot the first assignment.",
};
