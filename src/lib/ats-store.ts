// ATS In-Memory Store with Mock Data

import type { Candidate, PipelineCandidate, AppNotification, InterviewRound } from "./ats-types";

// ── Candidates ─────────────────────────────────────────────────────

let candidates: Candidate[] = [
  {
    id: "CND-001", name: "Ananya Desai", email: "ananya@email.com", phone: "+91 98765 43210", altPhone: "",
    linkedIn: "https://linkedin.com/in/ananya-desai", portfolioUrl: "https://ananya.writer.io",
    resumeUrl: "", currentRole: "Senior Fintech Writer", experience: "6 years",
    skills: ["Fintech", "Banking", "SEO", "Long-form"], tags: ["fintech", "top-rated", "english"],
    domainExpertise: "Fintech, Payments, Banking", languageSkills: "English (Native), Hindi",
    toolsProficiency: "Google Docs, Grammarly, WordPress, Notion",
    expectedRate: "₹3.5/word", rateModel: "Per Word",
    availability: "Immediate", noticePeriod: "", city: "Mumbai",
    overallScore: 4.8, technicalScore: 5, communicationScore: 4.5, cultureFitScore: 4.5,
    workSamples: [
      { id: "ws-1", title: "Razorpay Payments Guide", url: "https://example.com/sample1", type: "article" },
      { id: "ws-2", title: "Banking API Deep Dive", url: "https://example.com/sample2", type: "article" },
    ],
    interactions: [
      { id: "int-1", type: "call", summary: "Initial screening call — strong fintech background, available immediately", author: "Ravi Kumar", timestamp: "2026-02-15T10:00:00Z" },
      { id: "int-2", type: "email", summary: "Sent assignment brief for Razorpay content", author: "Ravi Kumar", timestamp: "2026-02-16T11:00:00Z" },
    ],
    notes: [
      { id: "n-1", text: "Excellent writer, 4.8 rating on platform. Previously worked with PhonePe.", author: "Neha Gupta", timestamp: "2026-02-15T12:00:00Z" },
    ],
    source: "Internal DB", createdAt: "2026-01-20T10:00:00Z", updatedAt: "2026-02-20T14:00:00Z",
    pastAssignments: ["PhonePe Blog Series", "HDFC Case Study"],
  },
  {
    id: "CND-002", name: "Varun Reddy", email: "varun@email.com", phone: "+91 98765 43217", altPhone: "+91 77665 54432",
    linkedIn: "https://linkedin.com/in/varun-reddy", portfolioUrl: "https://varun.design",
    resumeUrl: "", currentRole: "UI/UX Designer", experience: "5 years",
    skills: ["Figma", "Illustrator", "B2B SaaS", "Infographics"], tags: ["designer", "healthcare", "fintech"],
    domainExpertise: "Healthcare, Fintech, SaaS", languageSkills: "English, Telugu",
    toolsProficiency: "Figma, Adobe Illustrator, Canva, Photoshop",
    expectedRate: "₹5,500/assignment", rateModel: "Per Assignment",
    availability: "1 week", noticePeriod: "1 week", city: "Hyderabad",
    overallScore: 4.3, technicalScore: 4.5, communicationScore: 4, cultureFitScore: 4,
    workSamples: [
      { id: "ws-3", title: "SaaS Dashboard Redesign", url: "https://example.com/sample3", type: "design" },
    ],
    interactions: [
      { id: "int-3", type: "call", summary: "Portfolio review call — strong visual sense, fast turnaround", author: "Ravi Kumar", timestamp: "2026-02-10T10:00:00Z" },
    ],
    notes: [],
    source: "LinkedIn", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-02-18T10:00:00Z",
    pastAssignments: ["Freshworks Infographics"],
  },
  {
    id: "CND-003", name: "Meera Joshi", email: "meera.j@email.com", phone: "+91 88776 55443", altPhone: "",
    linkedIn: "https://linkedin.com/in/meera-joshi", portfolioUrl: "https://meerajoshi.com",
    resumeUrl: "https://example.com/meera-resume.pdf", currentRole: "Content Strategist", experience: "8 years",
    skills: ["Content Strategy", "SEO", "SaaS", "Thought Leadership"], tags: ["senior", "saas", "strategy"],
    domainExpertise: "SaaS, Enterprise Tech, Cloud Computing", languageSkills: "English (Native)",
    toolsProficiency: "Google Docs, SEMrush, Ahrefs, Notion, HubSpot",
    expectedRate: "₹6/word", rateModel: "Per Word",
    availability: "2 weeks", noticePeriod: "2 weeks", city: "Bangalore",
    overallScore: 4.6, technicalScore: 4.5, communicationScore: 5, cultureFitScore: 4,
    workSamples: [
      { id: "ws-4", title: "Cloud Migration Whitepaper", url: "https://example.com/sample4", type: "article" },
      { id: "ws-5", title: "SaaS Buyer's Guide", url: "https://example.com/sample5", type: "article" },
    ],
    interactions: [
      { id: "int-4", type: "meeting", summary: "In-person meet at Bangalore office — very articulate, domain depth", author: "Neha Gupta", timestamp: "2026-02-12T14:00:00Z" },
    ],
    notes: [
      { id: "n-2", text: "Strong candidate for Freshworks account. Rates slightly above budget — negotiate.", author: "Neha Gupta", timestamp: "2026-02-12T15:00:00Z" },
    ],
    source: "Referral", createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-02-22T10:00:00Z",
    pastAssignments: [],
  },
  {
    id: "CND-004", name: "Rahul Kapoor", email: "rahul.k@email.com", phone: "+91 99001 12233", altPhone: "",
    linkedIn: "https://linkedin.com/in/rahul-kapoor", portfolioUrl: "",
    resumeUrl: "https://example.com/rahul-resume.pdf", currentRole: "Finance Writer", experience: "4 years",
    skills: ["Finance", "SEBI", "Mutual Funds", "Hindi"], tags: ["finance", "hindi", "bilingual"],
    domainExpertise: "Finance, Investments, Insurance", languageSkills: "Hindi (Native), English",
    toolsProficiency: "Google Docs, WordPress",
    expectedRate: "₹2.5/word", rateModel: "Per Word",
    availability: "Immediate", noticePeriod: "", city: "Delhi",
    overallScore: 3.8, technicalScore: 4, communicationScore: 3.5, cultureFitScore: 4,
    workSamples: [
      { id: "ws-6", title: "Zerodha Mutual Fund Guide (Hindi)", url: "https://example.com/sample6", type: "article" },
    ],
    interactions: [],
    notes: [],
    source: "Job Board", createdAt: "2026-02-10T10:00:00Z", updatedAt: "2026-02-10T10:00:00Z",
    pastAssignments: [],
  },
  {
    id: "CND-005", name: "Sneha Agarwal", email: "sneha.a@email.com", phone: "+91 77889 90011", altPhone: "",
    linkedIn: "https://linkedin.com/in/sneha-agarwal", portfolioUrl: "https://sneha.studio",
    resumeUrl: "", currentRole: "Video Editor & Animator", experience: "3 years",
    skills: ["After Effects", "Premiere Pro", "Motion Graphics", "Short-form"], tags: ["video", "animator"],
    domainExpertise: "Social Media, EdTech", languageSkills: "English, Hindi",
    toolsProficiency: "Adobe After Effects, Premiere Pro, DaVinci Resolve",
    expectedRate: "₹8,000/video", rateModel: "Per Assignment",
    availability: "1 week", noticePeriod: "", city: "Pune",
    overallScore: 4.1, technicalScore: 4.5, communicationScore: 3.5, cultureFitScore: 4,
    workSamples: [
      { id: "ws-7", title: "EdTech Explainer Video", url: "https://example.com/sample7", type: "video" },
    ],
    interactions: [],
    notes: [],
    source: "LinkedIn", createdAt: "2026-02-18T10:00:00Z", updatedAt: "2026-02-18T10:00:00Z",
    pastAssignments: [],
  },
];

// ── Pipeline Candidates (linked to requisitions) ───────────────────

let pipelineCandidates: PipelineCandidate[] = [
  // CS-001 (Studio / Razorpay) pipeline
  {
    id: "PC-001", candidateId: "CND-001", requisitionId: "CS-001", currentStage: "Assignment",
    stageHistory: [
      { from: "", to: "Sourced", movedBy: "Ravi Kumar", timestamp: "2026-02-15T10:00:00Z", notes: "Added from internal DB" },
      { from: "Sourced", to: "Screened", movedBy: "Ravi Kumar", timestamp: "2026-02-16T10:00:00Z", notes: "Passed screening call" },
      { from: "Screened", to: "Assignment", movedBy: "Ravi Kumar", timestamp: "2026-02-17T10:00:00Z", notes: "Assignment sent" },
    ],
    assignmentSubmitted: true, assignmentScore: 4.2,
    interviewRounds: [],
    capabilityRating: null, capabilityNotes: "",
    offerAmount: "", offerStatus: null, rejectionReason: "",
    addedAt: "2026-02-15T10:00:00Z", updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "PC-002", candidateId: "CND-003", requisitionId: "CS-001", currentStage: "Screened",
    stageHistory: [
      { from: "", to: "Sourced", movedBy: "Neha Gupta", timestamp: "2026-02-18T10:00:00Z", notes: "Referral from existing writer" },
      { from: "Sourced", to: "Screened", movedBy: "Neha Gupta", timestamp: "2026-02-19T14:00:00Z", notes: "Great call — very experienced" },
    ],
    assignmentSubmitted: false, assignmentScore: null,
    interviewRounds: [],
    capabilityRating: null, capabilityNotes: "",
    offerAmount: "", offerStatus: null, rejectionReason: "",
    addedAt: "2026-02-18T10:00:00Z", updatedAt: "2026-02-19T14:00:00Z",
  },
  // F-001 (Freelancer / Freshworks) pipeline
  {
    id: "PC-003", candidateId: "CND-002", requisitionId: "F-001", currentStage: "Hired",
    stageHistory: [
      { from: "", to: "Sourced", movedBy: "Neha Gupta", timestamp: "2026-01-20T10:00:00Z", notes: "" },
      { from: "Sourced", to: "Screened", movedBy: "Neha Gupta", timestamp: "2026-01-22T10:00:00Z", notes: "" },
      { from: "Screened", to: "Portfolio Evaluation", movedBy: "Neha Gupta", timestamp: "2026-01-25T10:00:00Z", notes: "Portfolio reviewed by capability team" },
      { from: "Portfolio Evaluation", to: "Capability Review", movedBy: "Neha Gupta", timestamp: "2026-01-28T10:00:00Z", notes: "Approved by capability lead" },
      { from: "Capability Review", to: "Hired", movedBy: "Neha Gupta", timestamp: "2026-02-01T10:00:00Z", notes: "Onboarded" },
    ],
    assignmentSubmitted: false, assignmentScore: null,
    interviewRounds: [],
    capabilityRating: "Green", capabilityNotes: "Strong portfolio, good fit for Freshworks",
    offerAmount: "₹5,500/assignment", offerStatus: "accepted", rejectionReason: "",
    addedAt: "2026-01-20T10:00:00Z", updatedAt: "2026-02-01T10:00:00Z",
  },
  // S-001 (Sales/Sample Profile / Stripe)
  {
    id: "PC-004", candidateId: "CND-004", requisitionId: "S-001", currentStage: "Sourced",
    stageHistory: [
      { from: "", to: "Sourced", movedBy: "Ravi Kumar", timestamp: "2026-02-23T10:00:00Z", notes: "Quick find for sample profile" },
    ],
    assignmentSubmitted: false, assignmentScore: null,
    interviewRounds: [],
    capabilityRating: null, capabilityNotes: "",
    offerAmount: "", offerStatus: null, rejectionReason: "",
    addedAt: "2026-02-23T10:00:00Z", updatedAt: "2026-02-23T10:00:00Z",
  },
  // F-002 (Freelancer / Zerodha)
  {
    id: "PC-005", candidateId: "CND-004", requisitionId: "F-002", currentStage: "Portfolio Evaluation",
    stageHistory: [
      { from: "", to: "Sourced", movedBy: "Ravi Kumar", timestamp: "2026-02-20T10:00:00Z", notes: "" },
      { from: "Sourced", to: "Screened", movedBy: "Ravi Kumar", timestamp: "2026-02-21T10:00:00Z", notes: "" },
      { from: "Screened", to: "Portfolio Evaluation", movedBy: "Ravi Kumar", timestamp: "2026-02-22T10:00:00Z", notes: "Sent to BFSI capability team" },
    ],
    assignmentSubmitted: false, assignmentScore: null,
    interviewRounds: [],
    capabilityRating: null, capabilityNotes: "",
    offerAmount: "", offerStatus: null, rejectionReason: "",
    addedAt: "2026-02-20T10:00:00Z", updatedAt: "2026-02-22T10:00:00Z",
  },
];

// ── Notifications ──────────────────────────────────────────────────

let notifications: AppNotification[] = [
  {
    id: "notif-1", type: "stage_change", title: "Candidate moved to Assignment",
    message: "Ananya Desai moved to Assignment stage for Razorpay (CS-001)",
    requisitionId: "CS-001", candidateId: "CND-001", read: false,
    createdAt: "2026-02-20T10:00:00Z", actionUrl: "/ats/CS-001",
  },
  {
    id: "notif-2", type: "deadline_approaching", title: "Deadline approaching",
    message: "CS-001 (Razorpay) target closure date is Feb 28 — 1 day remaining",
    requisitionId: "CS-001", read: false,
    createdAt: "2026-02-27T08:00:00Z", actionUrl: "/ats/CS-001",
  },
  {
    id: "notif-3", type: "handover_ready", title: "Candidate ready for handover",
    message: "Varun Reddy (F-001) has been hired and is ready for handover",
    requisitionId: "F-001", candidateId: "CND-002", read: true,
    createdAt: "2026-02-01T10:00:00Z", actionUrl: "/handover",
  },
];

// ── CRUD Operations ────────────────────────────────────────────────

// Candidates
export function getCandidates(): Candidate[] { return [...candidates]; }
export function getCandidateById(id: string): Candidate | undefined { return candidates.find(c => c.id === id); }

export function addCandidate(candidate: Omit<Candidate, "id" | "createdAt" | "updatedAt">): Candidate {
  const newCandidate: Candidate = {
    ...candidate,
    id: `CND-${String(candidates.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  candidates = [...candidates, newCandidate];
  return newCandidate;
}

export function updateCandidate(id: string, updates: Partial<Candidate>): void {
  candidates = candidates.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
}

// Pipeline
export function getPipelineCandidates(requisitionId: string): PipelineCandidate[] {
  return pipelineCandidates.filter(pc => pc.requisitionId === requisitionId);
}

export function getAllPipelineCandidates(): PipelineCandidate[] { return [...pipelineCandidates]; }

export function addToPipeline(candidateId: string, requisitionId: string, addedBy: string): PipelineCandidate {
  const pc: PipelineCandidate = {
    id: `PC-${String(pipelineCandidates.length + 1).padStart(3, "0")}`,
    candidateId, requisitionId,
    currentStage: "Sourced",
    stageHistory: [{ from: "", to: "Sourced", movedBy: addedBy, timestamp: new Date().toISOString(), notes: "Added to pipeline" }],
    assignmentSubmitted: false, assignmentScore: null,
    interviewRounds: [],
    capabilityRating: null, capabilityNotes: "",
    offerAmount: "", offerStatus: null, rejectionReason: "",
    addedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  pipelineCandidates = [...pipelineCandidates, pc];
  addNotification({ type: "candidate_added", title: "Candidate added to pipeline", message: `${getCandidateById(candidateId)?.name} added to ${requisitionId}`, requisitionId, candidateId, actionUrl: `/ats/${requisitionId}` });
  return pc;
}

export function movePipelineStage(pcId: string, newStage: string, movedBy: string, notes: string = ""): void {
  pipelineCandidates = pipelineCandidates.map(pc => {
    if (pc.id !== pcId) return pc;
    const transition = { from: pc.currentStage, to: newStage, movedBy, timestamp: new Date().toISOString(), notes };
    const updated = { ...pc, currentStage: newStage, stageHistory: [...pc.stageHistory, transition], updatedAt: new Date().toISOString() };
    // Notification
    const candidate = getCandidateById(pc.candidateId);
    addNotification({ type: "stage_change", title: `Moved to ${newStage}`, message: `${candidate?.name} moved to ${newStage} for ${pc.requisitionId}`, requisitionId: pc.requisitionId, candidateId: pc.candidateId, actionUrl: `/ats/${pc.requisitionId}` });
    return updated;
  });
}

export function updatePipelineCandidate(pcId: string, updates: Partial<PipelineCandidate>): void {
  pipelineCandidates = pipelineCandidates.map(pc => pc.id === pcId ? { ...pc, ...updates, updatedAt: new Date().toISOString() } : pc);
}

export function addInterviewRound(pcId: string, round: Omit<InterviewRound, "id">): void {
  const newRound: InterviewRound = { ...round, id: crypto.randomUUID() };
  pipelineCandidates = pipelineCandidates.map(pc => pc.id === pcId ? { ...pc, interviewRounds: [...pc.interviewRounds, newRound], updatedAt: new Date().toISOString() } : pc);
  const pc = pipelineCandidates.find(p => p.id === pcId);
  if (pc) {
    const candidate = getCandidateById(pc.candidateId);
    addNotification({ type: "interview_scheduled", title: "Interview scheduled", message: `${round.type} interview for ${candidate?.name} on ${round.scheduledAt}`, requisitionId: pc.requisitionId, candidateId: pc.candidateId, actionUrl: `/ats/${pc.requisitionId}` });
  }
}

// Notifications
export function getNotifications(): AppNotification[] { return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
export function getUnreadCount(): number { return notifications.filter(n => !n.read).length; }
export function markAsRead(id: string): void { notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n); }
export function markAllAsRead(): void { notifications = notifications.map(n => ({ ...n, read: true })); }

function addNotification(n: Omit<AppNotification, "id" | "read" | "createdAt">): void {
  notifications = [{ ...n, id: `notif-${Date.now()}`, read: false, createdAt: new Date().toISOString() }, ...notifications];
}

// ── Analytics helpers ──────────────────────────────────────────────

export function getPipelineAnalytics() {
  const all = pipelineCandidates;
  const totalCandidates = candidates.length;
  const activePipelines = new Set(all.map(pc => pc.requisitionId)).size;

  // Funnel counts
  const stageCounts: Record<string, number> = {};
  all.forEach(pc => { stageCounts[pc.currentStage] = (stageCounts[pc.currentStage] || 0) + 1; });

  // Conversion rates
  const sourced = all.length;
  const screened = all.filter(pc => {
    const stages = pc.stageHistory.map(s => s.to);
    return stages.includes("Screened") || stages.includes("Portfolio Evaluation") || stages.includes("Assignment") || stages.includes("Capability Review") || stages.includes("In-house Interview") || stages.includes("Client Interview") || stages.includes("Hired");
  }).length;
  const hired = all.filter(pc => pc.currentStage === "Hired").length;
  const rejected = all.filter(pc => pc.currentStage === "Rejected").length;
  const offers = all.filter(pc => pc.offerStatus !== null).length;

  // Aging — average days in pipeline
  const agingDays = all.map(pc => {
    const added = new Date(pc.addedAt);
    const now = new Date();
    return Math.round((now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));
  });
  const avgAging = agingDays.length ? Math.round(agingDays.reduce((a, b) => a + b, 0) / agingDays.length) : 0;

  return {
    totalCandidates, activePipelines, stageCounts,
    sourced, screened, hired, rejected, offers,
    screeningRate: sourced ? Math.round(screened / sourced * 100) : 0,
    hireRate: sourced ? Math.round(hired / sourced * 100) : 0,
    offerAcceptRate: offers ? Math.round(all.filter(pc => pc.offerStatus === "accepted").length / offers * 100) : 0,
    avgAging,
  };
}

// ── Bulk Operations ────────────────────────────────────────────────

export function bulkAddCandidates(candidatesData: Omit<Candidate, "id" | "createdAt" | "updatedAt">[]): Candidate[] {
  return candidatesData.map(c => addCandidate(c));
}

export function getCSVTemplate(): string {
  return "name,email,phone,currentRole,experience,city,skills,domainExpertise,languageSkills,toolsProficiency,expectedRate,rateModel,availability,source,linkedIn,portfolioUrl\nJohn Doe,john@email.com,+91 99999 00000,Writer,3 years,Mumbai,\"Fintech,SEO\",Fintech,English,\"Google Docs,Grammarly\",₹3/word,Per Word,Immediate,LinkedIn,https://linkedin.com/in/john,https://john.portfolio.com";
}

export function parseCandidateCSV(csvText: string): Omit<Candidate, "id" | "createdAt" | "updatedAt">[] {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map(line => {
    // Simple CSV parsing (handles quoted fields)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());
    
    const get = (key: string) => values[headers.indexOf(key)] || "";
    const skills = get("skills").split(",").map(s => s.trim()).filter(Boolean);
    
    return {
      name: get("name"), email: get("email"), phone: get("phone"), altPhone: "",
      linkedIn: get("linkedin"), portfolioUrl: get("portfoliourl"), resumeUrl: "",
      currentRole: get("currentrole"), experience: get("experience"),
      skills, tags: skills.map(s => s.toLowerCase()),
      domainExpertise: get("domainexpertise"), languageSkills: get("languageskills"),
      toolsProficiency: get("toolsproficiency"),
      expectedRate: get("expectedrate"), rateModel: get("ratemodel") || "Per Word",
      availability: (get("availability") || "Immediate") as Candidate["availability"],
      noticePeriod: "", city: get("city"),
      overallScore: 0, technicalScore: 0, communicationScore: 0, cultureFitScore: 0,
      workSamples: [], interactions: [], notes: [],
      source: get("source") || "Other", pastAssignments: [],
    };
  });
}

// Get pipeline funnel metrics for a requisition (auto-populated from ATS)
export function getPipelineFunnelForReq(reqId: string) {
  const pcs = pipelineCandidates.filter(pc => pc.requisitionId === reqId);
  const stageReached = (pc: PipelineCandidate, stage: string) =>
    pc.stageHistory.some(s => s.to === stage) || pc.currentStage === stage;
  
  return {
    identified: pcs.length,
    contacted: pcs.filter(pc => pc.stageHistory.length > 1).length,
    screened: pcs.filter(pc => stageReached(pc, "Screened") || stageReached(pc, "Assignment") || stageReached(pc, "Portfolio Evaluation") || stageReached(pc, "In-house Interview") || stageReached(pc, "Client Interview") || stageReached(pc, "Capability Review") || stageReached(pc, "Hired")).length,
    shared: pcs.filter(pc => stageReached(pc, "Shared with Client") || stageReached(pc, "Client Interview") || stageReached(pc, "Capability Portfolio View")).length,
    interviews: pcs.reduce((sum, pc) => sum + pc.interviewRounds.length, 0),
    offers: pcs.filter(pc => pc.offerStatus !== null).length,
    selected: pcs.filter(pc => pc.currentStage === "Hired").length,
    dropOffs: pcs.filter(pc => pc.currentStage === "Rejected").length,
  };
}
