
-- requisition_slack_threads: maps requisitions to their Slack parent message
CREATE TABLE public.requisition_slack_threads (
  requisition_id text PRIMARY KEY,
  channel_id text NOT NULL,
  thread_ts text NOT NULL,
  raised_by_slack_user text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.requisition_slack_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to requisition_slack_threads"
  ON public.requisition_slack_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access slack_threads"
  ON public.requisition_slack_threads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- handover_reminders: tracks "Yet to start" creators for 2-day reminder cron
CREATE TABLE public.handover_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id text NOT NULL,
  creator_name text NOT NULL DEFAULT '',
  requisition_id text DEFAULT '',
  deal_id text DEFAULT '',
  handover_date timestamptz NOT NULL DEFAULT now(),
  last_reminded_at timestamptz,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_handover_reminders_unresolved ON public.handover_reminders (resolved, last_reminded_at);
ALTER TABLE public.handover_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to handover_reminders"
  ON public.handover_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access handover_reminders"
  ON public.handover_reminders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- app_settings: simple key/value store for Slack channel + toggle
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read app_settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage app_settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role full access app_settings"
  ON public.app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed defaults for Slack integration
INSERT INTO public.app_settings (key, value) VALUES
  ('slack_channel', '"#test-for-vsd-ops"'::jsonb),
  ('slack_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable pg_cron + pg_net for scheduled reminder
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
