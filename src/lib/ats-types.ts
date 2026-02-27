// ATS Module Types & Constants

import type { RequisitionFlow } from "./requisition-types";

// ── Pipeline Stages per Hire Type ──────────────────────────────────

export const PIPELINE_STAGES: Record<string, readonly string[]> = {
  studio: ["Sourced", "Screened", "Assignment", "In-house Interview", "Client Interview", "Offer", "Hired", "Rejected"],
  freelancer: ["Sourced", "Screened", "Portfolio Evaluation", "Capability Review", "Hired", "Rejected"],
  sales: ["Sourced", "Capability Portfolio View", "Shared with Client", "Rejected"],
  // sales = "Sample Profile Request"
} as const;

export function getStagesForFlow(flow: RequisitionFlow): readonly string[] {
  return PIPELINE_STAGES[flow] || PIPELINE_STAGES.freelancer;
}

// ── Candidate ──────────────────────────────────────────────────────

export interface CandidateNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface CandidateInteraction {
  id: string;
  type: "call" | "email" | "meeting" | "message" | "note";
  summary: string;
  author: string;
  timestamp: string;
}

export interface WorkSample {
  id: string;
  title: string;
  url: string;
  type: string; // "article" | "design" | "video" | "other"
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  linkedIn: string;
  portfolioUrl: string;
  resumeUrl: string;
  // Professional
  currentRole: string;
  experience: string; // e.g. "5 years"
  skills: string[];
  tags: string[];
  domainExpertise: string;
  languageSkills: string;
  toolsProficiency: string;
  // Rates & availability
  expectedRate: string;
  rateModel: string; // "Per Word" | "Hourly" | "Monthly" | "Per Assignment"
  availability: "Immediate" | "1 week" | "2 weeks" | "1 month" | "Not available";
  noticePeriod: string;
  city: string;
  // Scoring
  overallScore: number; // 1-5
  technicalScore: number;
  communicationScore: number;
  cultureFitScore: number;
  // Work samples
  workSamples: WorkSample[];
  // Interactions & notes
  interactions: CandidateInteraction[];
  notes: CandidateNote[];
  // Metadata
  source: string; // "LinkedIn" | "Referral" | "Job Board" | "Internal DB" | "Other"
  createdAt: string;
  updatedAt: string;
  // Past assignments within the company
  pastAssignments: string[];
}

// ── Pipeline Candidate (candidate in a specific requisition pipeline) ─

export interface PipelineCandidate {
  id: string;
  candidateId: string;
  requisitionId: string;
  currentStage: string;
  stageHistory: StageTransition[];
  assignmentSubmitted: boolean;
  assignmentScore: number | null;
  interviewRounds: InterviewRound[];
  capabilityRating: "Red" | "Yellow" | "Green" | null;
  capabilityNotes: string;
  offerAmount: string;
  offerStatus: "pending" | "accepted" | "rejected" | "negotiating" | null;
  rejectionReason: string;
  addedAt: string;
  updatedAt: string;
}

export interface StageTransition {
  from: string;
  to: string;
  movedBy: string;
  timestamp: string;
  notes: string;
}

export interface InterviewRound {
  id: string;
  roundNumber: number;
  type: "In-house" | "Client" | "Technical" | "HR";
  interviewer: string;
  scheduledAt: string;
  feedback: string;
  rating: number | null; // 1-5
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  meetingLink: string;
}

// ── Notifications ──────────────────────────────────────────────────

export type NotificationType = "stage_change" | "interview_scheduled" | "offer_sent" | "candidate_added" | "deadline_approaching" | "handover_ready" | "assignment_due";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  requisitionId?: string;
  candidateId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
