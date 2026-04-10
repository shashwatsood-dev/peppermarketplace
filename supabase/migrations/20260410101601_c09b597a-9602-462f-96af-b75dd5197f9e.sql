
-- ATS Candidates
CREATE TABLE public.ats_candidates (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  alt_phone text NOT NULL DEFAULT '',
  linkedin text NOT NULL DEFAULT '',
  portfolio_url text NOT NULL DEFAULT '',
  resume_url text NOT NULL DEFAULT '',
  role_title text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  domain_expertise text NOT NULL DEFAULT '',
  language_skills text NOT NULL DEFAULT '',
  tools_proficiency text NOT NULL DEFAULT '',
  expected_rate text NOT NULL DEFAULT '',
  rate_model text NOT NULL DEFAULT 'Per Word',
  availability text NOT NULL DEFAULT 'Immediate',
  notice_period text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  overall_score numeric NOT NULL DEFAULT 0,
  technical_score numeric NOT NULL DEFAULT 0,
  communication_score numeric NOT NULL DEFAULT 0,
  culture_fit_score numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'Other',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ats_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to ats_candidates"
  ON public.ats_candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pipeline candidates
CREATE TABLE public.ats_pipeline_candidates (
  id text PRIMARY KEY,
  candidate_id text NOT NULL REFERENCES public.ats_candidates(id) ON DELETE CASCADE,
  requisition_id text NOT NULL,
  current_stage text NOT NULL DEFAULT 'Sourced',
  stage_history jsonb NOT NULL DEFAULT '[]',
  assignment_submitted boolean NOT NULL DEFAULT false,
  assignment_score numeric,
  capability_rating text,
  capability_notes text NOT NULL DEFAULT '',
  offer_amount text NOT NULL DEFAULT '',
  offer_status text,
  rejection_reason text NOT NULL DEFAULT '',
  screening_notes text NOT NULL DEFAULT '',
  portfolio_links jsonb NOT NULL DEFAULT '[]',
  availability text NOT NULL DEFAULT '',
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ats_pipeline_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to ats_pipeline_candidates"
  ON public.ats_pipeline_candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Shared notes
CREATE TABLE public.ats_candidate_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_candidate_id text NOT NULL REFERENCES public.ats_pipeline_candidates(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  author text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ats_candidate_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to ats_candidate_notes"
  ON public.ats_candidate_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Interview rounds
CREATE TABLE public.ats_interview_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_candidate_id text NOT NULL REFERENCES public.ats_pipeline_candidates(id) ON DELETE CASCADE,
  round_number integer NOT NULL DEFAULT 1,
  interview_type text NOT NULL DEFAULT 'In-house',
  interviewer text NOT NULL DEFAULT '',
  scheduled_at text NOT NULL DEFAULT '',
  feedback text NOT NULL DEFAULT '',
  rating numeric,
  status text NOT NULL DEFAULT 'scheduled',
  meeting_link text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ats_interview_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to ats_interview_rounds"
  ON public.ats_interview_rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Work samples
CREATE TABLE public.ats_work_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id text NOT NULL REFERENCES public.ats_candidates(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  sample_type text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ats_work_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to ats_work_samples"
  ON public.ats_work_samples FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_ats_candidates_updated_at
  BEFORE UPDATE ON public.ats_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ats_pipeline_candidates_updated_at
  BEFORE UPDATE ON public.ats_pipeline_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
