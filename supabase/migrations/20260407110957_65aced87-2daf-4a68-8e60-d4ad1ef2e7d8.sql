ALTER TABLE public.deals
  ADD COLUMN mrr numeric NOT NULL DEFAULT 0,
  ADD COLUMN contract_duration text NOT NULL DEFAULT '',
  ADD COLUMN contract_start_date text NOT NULL DEFAULT '',
  ADD COLUMN contract_end_date text NOT NULL DEFAULT '',
  ADD COLUMN capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN capability_leader text NOT NULL DEFAULT '';