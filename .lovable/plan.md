

## Slack Workflow for Requisitions

End-to-end Slack integration mirroring the existing Supply Requisition Bot, posting to **#test-for-vsd-ops** during testing.

### What gets built

**1. Slack connection (Bot)**
- Connect Slack via the Lovable Slack connector (bot mode). The bot will post into `#test-for-vsd-ops` (configurable).
- A small `app_settings` table stores: `slack_channel`, `slack_enabled`, plus per-requisition `slack_thread_ts` mappings.

**2. New table — `requisition_slack_threads`**
| Column | Type |
|---|---|
| `requisition_id` | text (PK) |
| `channel_id` | text |
| `thread_ts` | text (parent message timestamp) |
| `raised_by_slack_user` | text (resolved via `users.lookupByEmail` if available) |
| `created_at` | timestamptz |

This is how all subsequent updates find the right thread.

**3. Edge Function — `slack-notify`**
Single dispatcher invoked from the app. Action types:
- `requisition_created` — posts the **parent** message (formatted exactly like the screenshot: Raised By, Client, Creator Model, Type, Archetype, Payment Model, # creators, Stage, Expected Pay, SoW, Notes). Stores `thread_ts` in `requisition_slack_threads`.
- `daily_update_posted` — replies in thread with the funnel numbers + notes/blockers.
- `creator_handover` — replies in thread with handover details (creator name, type, pay, deal, recruiter).
- `status_change` — replies in thread tagging the original raiser ("Status changed from X → Y by @user").
- `handover_reminder` — replies in thread "@raiser — creator <name> handed over <N> days ago, still in *Yet to start*. Please allot first assignment."

All branches resolve thread via `requisition_slack_threads`. If missing (legacy req), they post as a new top-level message.

**4. Auto-trigger wiring (frontend invocations)**
- `NewRequisition.tsx` submit → `slack-notify { type: 'requisition_created' }`
- `RequisitionsAdvanced.tsx` daily update save → `slack-notify { type: 'daily_update_posted' }`
- `RequisitionsAdvanced.tsx` status change → `slack-notify { type: 'status_change' }`
- `CreatorHandover.tsx` submit → for each creator, `slack-notify { type: 'creator_handover' }` AND auto-set the deal-creator's status to **"Yet to start"** in `deployed_creators`.

**5. Handover → "Yet to start" automation**
- On handover submit, `INSERT/UPDATE deployed_creators` with `deal_status = 'Yet to start'`, linked to the chosen deal.
- New table `handover_reminders` tracks `creator_id`, `handover_date`, `last_reminded_at`, `requisition_id`.

**6. 2-day reminder cron**
- New edge function `handover-reminder-cron` scheduled via `pg_cron` to run daily.
- Query: deployed_creators where `deal_status = 'Yet to start'` AND `handover_date >= 2 days ago` AND (`last_reminded_at IS NULL` OR `last_reminded_at >= 2 days ago`).
- For each, calls `slack-notify { type: 'handover_reminder' }` and updates `last_reminded_at`.
- Stops automatically when status flips to `Active` (or anything other than `Yet to start`).

**7. Settings UI (Admin only)**
- New section in `Settings.tsx`: "Slack Integration"
  - Connection status indicator
  - Channel input (default `#test-for-vsd-ops`)
  - Toggle: enable/disable notifications
  - "Send test message" button

### Daily Update Auto-Trigger Note

Daily updates today are user-saved (manual or auto-fetched from ATS). Each save will trigger a thread reply. If you want a *time-based* daily summary regardless of user action, we add a second cron (`daily-update-cron`) that posts current ATS funnel deltas at a fixed hour for every active req.

### Technical Stack

- **Slack auth**: Lovable Slack connector (bot token via `SLACK_API_KEY`, called through `connector-gateway.lovable.dev/slack`).
- **User mention**: Resolve `raisedByPhone`/raiser email → Slack user ID via `users.lookupByEmail`. Fallback: plain text name.
- **Idempotency**: Parent thread is created once per requisition (uniqueness on `requisition_id` PK).
- **Migrations**: `requisition_slack_threads`, `handover_reminders`, `app_settings`; pg_cron job for reminder function; add `deal_status = 'Yet to start'` is already supported.
- **Edge functions**: `slack-notify`, `handover-reminder-cron`.

### Approval needed

After approval, the first action is to connect Slack and pick the bot — you'll be prompted to authorize the workspace. Then everything above is wired automatically with `#test-for-vsd-ops` as the test channel.

