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
