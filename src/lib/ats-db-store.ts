// ATS Database Store — replaces in-memory ats-store for persistence
import { supabase } from "@/integrations/supabase/client";

// ── Types matching DB schema ───────────────────────────────────────

export interface DbCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  alt_phone: string;
  linkedin: string;
  portfolio_url: string;
  resume_url: string;
  role_title: string;
  experience: string;
  skills: string[];
  tags: string[];
  domain_expertise: string;
  language_skills: string;
  tools_proficiency: string;
  expected_rate: string;
  rate_model: string;
  availability: string;
  notice_period: string;
  city: string;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  culture_fit_score: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface DbPipelineCandidate {
  id: string;
  candidate_id: string;
  requisition_id: string;
  current_stage: string;
  stage_history: any[];
  assignment_submitted: boolean;
  assignment_score: number | null;
  capability_rating: string | null;
  capability_notes: string;
  offer_amount: string;
  offer_status: string | null;
  rejection_reason: string;
  screening_notes: string;
  portfolio_links: any[];
  availability: string;
  added_at: string;
  updated_at: string;
}

export interface DbCandidateNote {
  id: string;
  pipeline_candidate_id: string;
  note_text: string;
  author: string;
  created_at: string;
}

export interface DbInterviewRound {
  id: string;
  pipeline_candidate_id: string;
  round_number: number;
  interview_type: string;
  interviewer: string;
  scheduled_at: string;
  feedback: string;
  rating: number | null;
  status: string;
  meeting_link: string;
  created_at: string;
}

export interface DbWorkSample {
  id: string;
  candidate_id: string;
  title: string;
  url: string;
  sample_type: string;
  created_at: string;
}

export interface DbPipelineStage {
  id: string;
  requisition_id: string;
  stage_name: string;
  order_index: number;
  created_at: string;
}

// ── Candidates CRUD ────────────────────────────────────────────────

export async function fetchCandidates(): Promise<DbCandidate[]> {
  const { data, error } = await supabase.from("ats_candidates").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as DbCandidate[];
}

export async function fetchCandidateById(id: string): Promise<DbCandidate | null> {
  const { data, error } = await supabase.from("ats_candidates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as DbCandidate | null;
}

export async function createCandidate(candidate: Omit<DbCandidate, "created_at" | "updated_at">): Promise<DbCandidate> {
  const { data, error } = await supabase.from("ats_candidates").insert(candidate as any).select().single();
  if (error) throw error;
  return data as unknown as DbCandidate;
}

export async function updateCandidateDb(id: string, updates: Partial<DbCandidate>): Promise<void> {
  const { error } = await supabase.from("ats_candidates").update(updates as any).eq("id", id);
  if (error) throw error;
}

// ── Pipeline Candidates CRUD ───────────────────────────────────────

export async function fetchPipelineCandidates(requisitionId: string): Promise<DbPipelineCandidate[]> {
  const { data, error } = await supabase.from("ats_pipeline_candidates").select("*").eq("requisition_id", requisitionId);
  if (error) throw error;
  return (data || []) as unknown as DbPipelineCandidate[];
}

export async function fetchAllPipelineCandidates(): Promise<DbPipelineCandidate[]> {
  const { data, error } = await supabase.from("ats_pipeline_candidates").select("*");
  if (error) throw error;
  return (data || []) as unknown as DbPipelineCandidate[];
}

export async function addToPipelineDb(candidateId: string, requisitionId: string, addedBy: string): Promise<DbPipelineCandidate> {
  const id = `PC-${Date.now()}`;
  const now = new Date().toISOString();
  const pc = {
    id,
    candidate_id: candidateId,
    requisition_id: requisitionId,
    current_stage: "Sourced",
    stage_history: [{ from: "", to: "Sourced", movedBy: addedBy, timestamp: now, notes: "Added to pipeline" }],
    assignment_submitted: false,
    assignment_score: null,
    capability_rating: null,
    capability_notes: "",
    offer_amount: "",
    offer_status: null,
    rejection_reason: "",
    screening_notes: "",
    portfolio_links: [],
    availability: "",
  };
  const { data, error } = await supabase.from("ats_pipeline_candidates").insert(pc as any).select().single();
  if (error) throw error;
  return data as unknown as DbPipelineCandidate;
}

export async function movePipelineStageDb(pcId: string, newStage: string, movedBy: string, notes: string = ""): Promise<void> {
  // Fetch current
  const { data: pc, error: fetchErr } = await supabase.from("ats_pipeline_candidates").select("*").eq("id", pcId).single();
  if (fetchErr || !pc) throw fetchErr || new Error("Not found");

  const currentHistory = (pc as any).stage_history || [];
  const transition = { from: (pc as any).current_stage, to: newStage, movedBy, timestamp: new Date().toISOString(), notes };

  const { error } = await supabase.from("ats_pipeline_candidates").update({
    current_stage: newStage,
    stage_history: [...currentHistory, transition],
  } as any).eq("id", pcId);
  if (error) throw error;
}

export async function updatePipelineCandidateDb(pcId: string, updates: Partial<DbPipelineCandidate>): Promise<void> {
  const { error } = await supabase.from("ats_pipeline_candidates").update(updates as any).eq("id", pcId);
  if (error) throw error;
}

// ── Notes CRUD ─────────────────────────────────────────────────────

export async function fetchNotes(pipelineCandidateId: string): Promise<DbCandidateNote[]> {
  const { data, error } = await supabase.from("ats_candidate_notes").select("*").eq("pipeline_candidate_id", pipelineCandidateId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as DbCandidateNote[];
}

export async function addNoteDb(pipelineCandidateId: string, text: string, author: string): Promise<DbCandidateNote> {
  const { data, error } = await supabase.from("ats_candidate_notes").insert({
    pipeline_candidate_id: pipelineCandidateId,
    note_text: text,
    author,
  } as any).select().single();
  if (error) throw error;
  return data as unknown as DbCandidateNote;
}

// ── Interview Rounds CRUD ──────────────────────────────────────────

export async function fetchInterviewRounds(pipelineCandidateId: string): Promise<DbInterviewRound[]> {
  const { data, error } = await supabase.from("ats_interview_rounds").select("*").eq("pipeline_candidate_id", pipelineCandidateId).order("round_number");
  if (error) throw error;
  return (data || []) as unknown as DbInterviewRound[];
}

export async function addInterviewRoundDb(pipelineCandidateId: string, round: Omit<DbInterviewRound, "id" | "pipeline_candidate_id" | "created_at">): Promise<DbInterviewRound> {
  const { data, error } = await supabase.from("ats_interview_rounds").insert({
    pipeline_candidate_id: pipelineCandidateId,
    ...round,
  } as any).select().single();
  if (error) throw error;
  return data as unknown as DbInterviewRound;
}

export async function updateInterviewRoundDb(id: string, updates: Partial<DbInterviewRound>): Promise<void> {
  const { error } = await supabase.from("ats_interview_rounds").update(updates as any).eq("id", id);
  if (error) throw error;
}

// ── Work Samples CRUD ──────────────────────────────────────────────

export async function fetchWorkSamples(candidateId: string): Promise<DbWorkSample[]> {
  const { data, error } = await supabase.from("ats_work_samples").select("*").eq("candidate_id", candidateId).order("created_at");
  if (error) throw error;
  return (data || []) as unknown as DbWorkSample[];
}

export async function addWorkSampleDb(candidateId: string, title: string, url: string, sampleType: string = "other"): Promise<DbWorkSample> {
  const { data, error } = await supabase.from("ats_work_samples").insert({
    candidate_id: candidateId,
    title,
    url,
    sample_type: sampleType,
  } as any).select().single();
  if (error) throw error;
  return data as unknown as DbWorkSample;
}

// ── Custom Pipeline Stages CRUD ────────────────────────────────────

export async function fetchPipelineStages(requisitionId: string): Promise<DbPipelineStage[]> {
  const { data, error } = await supabase.from("ats_pipeline_stages").select("*").eq("requisition_id", requisitionId).order("order_index");
  if (error) throw error;
  return (data || []) as unknown as DbPipelineStage[];
}

export async function savePipelineStages(requisitionId: string, stages: { stage_name: string; order_index: number }[]): Promise<void> {
  // Delete existing
  await supabase.from("ats_pipeline_stages").delete().eq("requisition_id", requisitionId);
  // Insert new
  if (stages.length > 0) {
    const { error } = await supabase.from("ats_pipeline_stages").insert(
      stages.map(s => ({ requisition_id: requisitionId, ...s })) as any
    );
    if (error) throw error;
  }
}

// ── Seed mock candidates into DB if empty ──────────────────────────

export async function seedCandidatesIfEmpty(): Promise<void> {
  const { count } = await supabase.from("ats_candidates").select("*", { count: "exact", head: true });
  if ((count || 0) > 0) return;

  const mockCandidates = [
    {
      id: "CND-001", name: "Ananya Desai", email: "ananya@email.com", phone: "+91 98765 43210", alt_phone: "",
      linkedin: "https://linkedin.com/in/ananya-desai", portfolio_url: "https://ananya.writer.io", resume_url: "",
      role_title: "Senior Fintech Writer", experience: "6 years",
      skills: ["Fintech", "Banking", "SEO", "Long-form"], tags: ["fintech", "top-rated", "english"],
      domain_expertise: "Fintech, Payments, Banking", language_skills: "English (Native), Hindi",
      tools_proficiency: "Google Docs, Grammarly, WordPress, Notion",
      expected_rate: "₹3.5/word", rate_model: "Per Word", availability: "Immediate", notice_period: "", city: "Mumbai",
      overall_score: 4.8, technical_score: 5, communication_score: 4.5, culture_fit_score: 4.5, source: "Internal DB",
    },
    {
      id: "CND-002", name: "Varun Reddy", email: "varun@email.com", phone: "+91 98765 43217", alt_phone: "+91 77665 54432",
      linkedin: "https://linkedin.com/in/varun-reddy", portfolio_url: "https://varun.design", resume_url: "",
      role_title: "UI/UX Designer", experience: "5 years",
      skills: ["Figma", "Illustrator", "B2B SaaS", "Infographics"], tags: ["designer", "healthcare", "fintech"],
      domain_expertise: "Healthcare, Fintech, SaaS", language_skills: "English, Telugu",
      tools_proficiency: "Figma, Adobe Illustrator, Canva, Photoshop",
      expected_rate: "₹5,500/assignment", rate_model: "Per Assignment", availability: "1 week", notice_period: "1 week", city: "Hyderabad",
      overall_score: 4.3, technical_score: 4.5, communication_score: 4, culture_fit_score: 4, source: "LinkedIn",
    },
    {
      id: "CND-003", name: "Meera Joshi", email: "meera.j@email.com", phone: "+91 88776 55443", alt_phone: "",
      linkedin: "https://linkedin.com/in/meera-joshi", portfolio_url: "https://meerajoshi.com",
      resume_url: "https://example.com/meera-resume.pdf", role_title: "Content Strategist", experience: "8 years",
      skills: ["Content Strategy", "SEO", "SaaS", "Thought Leadership"], tags: ["senior", "saas", "strategy"],
      domain_expertise: "SaaS, Enterprise Tech, Cloud Computing", language_skills: "English (Native)",
      tools_proficiency: "Google Docs, SEMrush, Ahrefs, Notion, HubSpot",
      expected_rate: "₹6/word", rate_model: "Per Word", availability: "2 weeks", notice_period: "2 weeks", city: "Bangalore",
      overall_score: 4.6, technical_score: 4.5, communication_score: 5, culture_fit_score: 4, source: "Referral",
    },
    {
      id: "CND-004", name: "Rahul Kapoor", email: "rahul.k@email.com", phone: "+91 99001 12233", alt_phone: "",
      linkedin: "https://linkedin.com/in/rahul-kapoor", portfolio_url: "", resume_url: "https://example.com/rahul-resume.pdf",
      role_title: "Finance Writer", experience: "4 years",
      skills: ["Finance", "SEBI", "Mutual Funds", "Hindi"], tags: ["finance", "hindi", "bilingual"],
      domain_expertise: "Finance, Investments, Insurance", language_skills: "Hindi (Native), English",
      tools_proficiency: "Google Docs, WordPress",
      expected_rate: "₹2.5/word", rate_model: "Per Word", availability: "Immediate", notice_period: "", city: "Delhi",
      overall_score: 3.8, technical_score: 4, communication_score: 3.5, culture_fit_score: 4, source: "Job Board",
    },
    {
      id: "CND-005", name: "Sneha Agarwal", email: "sneha.a@email.com", phone: "+91 77889 90011", alt_phone: "",
      linkedin: "https://linkedin.com/in/sneha-agarwal", portfolio_url: "https://sneha.studio", resume_url: "",
      role_title: "Video Editor & Animator", experience: "3 years",
      skills: ["After Effects", "Premiere Pro", "Motion Graphics", "Short-form"], tags: ["video", "animator"],
      domain_expertise: "Social Media, EdTech", language_skills: "English, Hindi",
      tools_proficiency: "Adobe After Effects, Premiere Pro, DaVinci Resolve",
      expected_rate: "₹8,000/video", rate_model: "Per Assignment", availability: "1 week", notice_period: "", city: "Pune",
      overall_score: 4.1, technical_score: 4.5, communication_score: 3.5, culture_fit_score: 4, source: "LinkedIn",
    },
  ];

  await supabase.from("ats_candidates").insert(mockCandidates as any);
}
