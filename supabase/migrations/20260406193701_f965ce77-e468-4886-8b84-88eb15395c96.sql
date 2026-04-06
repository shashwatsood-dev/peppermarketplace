
-- Clients table (pod_name is text, maps to the pod grouping)
CREATE TABLE public.clients (
  id TEXT PRIMARY KEY,
  pod_name TEXT NOT NULL DEFAULT 'Unassigned',
  client_name TEXT NOT NULL,
  vsd_name TEXT NOT NULL DEFAULT '',
  principal_bopm TEXT NOT NULL DEFAULT '',
  senior_bopm TEXT NOT NULL DEFAULT '',
  junior_bopm TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deals table
CREATE TABLE public.deals (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  deal_type TEXT NOT NULL DEFAULT 'Retainer',
  status TEXT NOT NULL DEFAULT 'Active',
  currency TEXT NOT NULL DEFAULT 'INR',
  signing_entity TEXT NOT NULL DEFAULT '',
  geography TEXT NOT NULL DEFAULT '',
  is_content_studio BOOLEAN NOT NULL DEFAULT false,
  vsd_name TEXT NOT NULL DEFAULT '',
  total_contract_value NUMERIC NOT NULL DEFAULT 0,
  total_creator_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deployed creators table
CREATE TABLE public.deployed_creators (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Writer',
  source TEXT NOT NULL DEFAULT 'Freelancer',
  pay_model TEXT NOT NULL DEFAULT 'Per Word',
  pay_rate NUMERIC NOT NULL DEFAULT 0,
  expected_volume NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  client_billing NUMERIC NOT NULL DEFAULT 0,
  deal_status TEXT NOT NULL DEFAULT 'Active',
  capability_lead_rating TEXT NOT NULL DEFAULT '',
  bopm_rating TEXT NOT NULL DEFAULT '',
  capability_rating_reason TEXT NOT NULL DEFAULT '',
  bopm_rating_reason TEXT NOT NULL DEFAULT '',
  hrbp_name TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  ops_link TEXT NOT NULL DEFAULT '',
  linkedin_id TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HRBP connects table
CREATE TABLE public.hrbp_connects (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES public.deployed_creators(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  hrbp_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly payments table
CREATE TABLE public.monthly_payments (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES public.deployed_creators(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployed_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hrbp_connects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon and authenticated (app uses client-side auth currently)
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to deployed_creators" ON public.deployed_creators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to hrbp_connects" ON public.hrbp_connects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to monthly_payments" ON public.monthly_payments FOR ALL USING (true) WITH CHECK (true);
