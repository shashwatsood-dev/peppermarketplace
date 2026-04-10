-- Add health_status column to deals
ALTER TABLE public.deals ADD COLUMN health_status text NOT NULL DEFAULT '';

-- Create deal_notes table
CREATE TABLE public.deal_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id text NOT NULL,
  note text NOT NULL,
  author text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to deal_notes"
  ON public.deal_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create creator_engagement_notes table
CREATE TABLE public.creator_engagement_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id text NOT NULL,
  note text NOT NULL,
  author text NOT NULL DEFAULT '',
  note_type text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_engagement_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to creator_engagement_notes"
  ON public.creator_engagement_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create agreements storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('agreements', 'agreements', false, 10485760);

CREATE POLICY "Authenticated users can upload agreements"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'agreements');

CREATE POLICY "Authenticated users can view agreements"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'agreements');

CREATE POLICY "Authenticated users can delete agreements"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'agreements');