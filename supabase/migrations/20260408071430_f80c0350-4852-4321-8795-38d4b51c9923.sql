CREATE TABLE IF NOT EXISTS public.requisitions (
  id text PRIMARY KEY,
  flow text NOT NULL,
  status text NOT NULL DEFAULT 'RMG approval Pending',
  client_name text NOT NULL DEFAULT '',
  deal_id text NOT NULL DEFAULT '',
  pod_name text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requisitions_status ON public.requisitions (status);
CREATE INDEX IF NOT EXISTS idx_requisitions_flow ON public.requisitions (flow);
CREATE INDEX IF NOT EXISTS idx_requisitions_client_name ON public.requisitions (client_name);
CREATE INDEX IF NOT EXISTS idx_requisitions_pod_name ON public.requisitions (pod_name);

CREATE OR REPLACE FUNCTION public.update_requisitions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_requisitions_updated_at ON public.requisitions;
CREATE TRIGGER update_requisitions_updated_at
BEFORE UPDATE ON public.requisitions
FOR EACH ROW
EXECUTE FUNCTION public.update_requisitions_updated_at();

ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to requisitions" ON public.requisitions;
CREATE POLICY "Allow all access to requisitions"
ON public.requisitions
FOR ALL
TO public
USING (true)
WITH CHECK (true);