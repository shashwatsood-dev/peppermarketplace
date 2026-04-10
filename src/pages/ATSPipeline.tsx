import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchRequisitions } from "@/lib/requisition-db-store";
import { getStagesForFlow } from "@/lib/ats-types";
import {
  fetchCandidates, fetchPipelineCandidates, fetchCandidateById, createCandidate, updateCandidateDb,
  addToPipelineDb, movePipelineStageDb, updatePipelineCandidateDb,
  fetchNotes, addNoteDb, fetchInterviewRounds, addInterviewRoundDb, updateInterviewRoundDb,
  fetchWorkSamples, addWorkSampleDb, fetchPipelineStages, savePipelineStages,
  seedCandidatesIfEmpty,
  type DbCandidate, type DbPipelineCandidate, type DbCandidateNote, type DbInterviewRound, type DbWorkSample,
} from "@/lib/ats-db-store";
import { addHandover } from "@/lib/handover-store";
import { RESOURCE_SPECIFIC_TYPES } from "@/lib/requisition-types";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, User, Star, Calendar, MessageSquare,
  FileText, CheckCircle, XCircle, ArrowRightLeft, Link2,
  Mail, Send, GripVertical, DollarSign, Settings2, Trash2, Edit,
} from "lucide-react";

const RATE_MODELS = ["Per Word", "Hourly", "Monthly", "Per Assignment"];
const SOURCES = ["LinkedIn", "Referral", "Job Board", "Internal DB", "Other"];
const AVAILABILITY_OPTIONS = ["Immediate", "1 week", "2 weeks", "1 month", "Not available"];

const ATSPipeline = () => {
  const { reqId } = useParams<{ reqId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentUser = profile?.name || profile?.email || "User";

  const [req, setReq] = useState<import("@/lib/requisition-types").AdvancedRequisition | null>(null);
  const [reqLoading, setReqLoading] = useState(true);
  const [pipeline, setPipeline] = useState<DbPipelineCandidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<DbCandidate[]>([]);
  const [candidateCache, setCandidateCache] = useState<Record<string, DbCandidate>>({});

  // Custom stages
  const [customStages, setCustomStages] = useState<string[]>([]);
  const [stagesDialogOpen, setStagesDialogOpen] = useState(false);
  const [editStages, setEditStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState("");

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [hiredPayDialogOpen, setHiredPayDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const [selectedPC, setSelectedPC] = useState<DbPipelineCandidate | null>(null);
  const [searchCandidate, setSearchCandidate] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [moveTarget, setMoveTarget] = useState("");
  const [hiredPC, setHiredPC] = useState<DbPipelineCandidate | null>(null);
  const [finalizedPay, setFinalizedPay] = useState("");
  const [draggedPC, setDraggedPC] = useState<string | null>(null);

  // Add candidate
  const [addMode, setAddMode] = useState<"db" | "new">("db");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newOtherRole, setNewOtherRole] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newRateModel, setNewRateModel] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newSource, setNewSource] = useState("LinkedIn");
  const [newSkills, setNewSkills] = useState("");
  const [newLinkedIn, setNewLinkedIn] = useState("");
  const [newAvailability, setNewAvailability] = useState("Immediate");

  // Interview form
  const [intType, setIntType] = useState<string>("In-house");
  const [intInterviewer, setIntInterviewer] = useState("");
  const [intDate, setIntDate] = useState("");
  const [intFeedback, setIntFeedback] = useState("");
  const [intRating, setIntRating] = useState<number>(0);
  const [intMeetingLink, setIntMeetingLink] = useState("");

  // Detail view state
  const [detailNotes, setDetailNotes] = useState<DbCandidateNote[]>([]);
  const [detailInterviews, setDetailInterviews] = useState<DbInterviewRound[]>([]);
  const [detailWorkSamples, setDetailWorkSamples] = useState<DbWorkSample[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [screeningNotes, setScreeningNotes] = useState("");
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");

  // Email
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Edit candidate
  const [editCandidateOpen, setEditCandidateOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<DbCandidate | null>(null);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        await seedCandidatesIfEmpty();
        const [reqs, candidates] = await Promise.all([
          fetchRequisitions(),
          fetchCandidates(),
        ]);
        setReq(reqs.find(r => r.id === reqId) || null);
        setAllCandidates(candidates);

        const cacheMap: Record<string, DbCandidate> = {};
        candidates.forEach(c => { cacheMap[c.id] = c; });
        setCandidateCache(cacheMap);

        if (reqId) {
          const [pcs, stages] = await Promise.all([
            fetchPipelineCandidates(reqId),
            fetchPipelineStages(reqId),
          ]);
          setPipeline(pcs);
          if (stages.length > 0) {
            setCustomStages(stages.map(s => s.stage_name));
          }
        }
      } catch (err) {
        console.error("Error loading ATS data:", err);
      } finally {
        setReqLoading(false);
      }
    };
    load();
  }, [reqId]);

  const refreshPipeline = useCallback(async () => {
    if (!reqId) return;
    const pcs = await fetchPipelineCandidates(reqId);
    setPipeline(pcs);
  }, [reqId]);

  // Roles from requisition
  const reqRoles = useMemo(() => {
    if (!req) return [];
    if (req.flow === "sales") return req.salesData?.specificResourceTypes || [];
    return req.hiringData?.lineItems.map(li => li.creatorType === "Other" ? li.otherCreatorTypeSpec : li.creatorType).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) || [];
  }, [req]);

  if (reqLoading) return <p className="text-muted-foreground p-4">Loading requisition…</p>;
  if (!req) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate("/requisitions")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
      <p className="text-muted-foreground">Requisition not found.</p>
    </div>
  );

  const defaultStages = getStagesForFlow(req.flow) as string[];
  const stages = customStages.length > 0 ? customStages : [...defaultStages];
  const activeStages = stages.filter(s => s !== "Rejected");
  const clientName = req.flow === "sales" ? req.salesData?.clientName : req.hiringData?.clientName;
  const flowLabel = req.flow === "sales" ? "Sample Profile" : req.flow === "studio" ? "Content Studio" : "Freelancer";

  const candidatesInStage = (stage: string) => pipeline.filter(pc => pc.current_stage === stage);
  const getCandidate = (id: string) => candidateCache[id];

  // Custom stages management
  const handleSaveCustomStages = async () => {
    try {
      await savePipelineStages(reqId!, editStages.map((name, i) => ({ stage_name: name, order_index: i })));
      setCustomStages(editStages);
      setStagesDialogOpen(false);
      toast.success("Pipeline stages updated");
    } catch (err: any) {
      toast.error("Failed to save stages: " + err.message);
    }
  };

  const handleAddCandidate = async (candidateId: string) => {
    if (pipeline.some(pc => pc.candidate_id === candidateId)) {
      toast.error("Already in pipeline"); return;
    }
    try {
      await addToPipelineDb(candidateId, reqId!, currentUser);
      await refreshPipeline();
      toast.success("Candidate added");
      setAddDialogOpen(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddNewCandidate = async () => {
    if (!newName || !newEmail) { toast.error("Name and email required"); return; }
    const role = newRole === "Other" ? newOtherRole : newRole;
    try {
      const candidate = await createCandidate({
        id: `CND-${Date.now()}`,
        name: newName, email: newEmail, phone: newPhone, alt_phone: "",
        linkedin: newLinkedIn, portfolio_url: "", resume_url: "",
        role_title: role, experience: "",
        skills: newSkills.split(",").map(s => s.trim()).filter(Boolean),
        tags: newSkills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
        domain_expertise: "", language_skills: "", tools_proficiency: "",
        expected_rate: newRate, rate_model: newRateModel,
        availability: newAvailability, notice_period: "", city: newCity,
        overall_score: 0, technical_score: 0, communication_score: 0, culture_fit_score: 0,
        source: newSource,
      });
      setCandidateCache(prev => ({ ...prev, [candidate.id]: candidate }));
      await addToPipelineDb(candidate.id, reqId!, currentUser);
      await refreshPipeline();
      toast.success("New candidate created & added");
      setAddDialogOpen(false);
      setNewName(""); setNewEmail(""); setNewPhone(""); setNewRole(""); setNewOtherRole("");
      setNewCity(""); setNewRateModel(""); setNewRate(""); setNewSkills(""); setNewLinkedIn(""); setNewAvailability("Immediate");
    } catch (err: any) { toast.error(err.message); }
  };

  // Drag-and-drop
  const handleDragStart = (e: React.DragEvent, pcId: string) => { e.dataTransfer.setData("pcId", pcId); setDraggedPC(pcId); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDropToStage = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const pcId = e.dataTransfer.getData("pcId");
    if (!pcId) return;
    const pc = pipeline.find(p => p.id === pcId);
    if (!pc || pc.current_stage === stage) { setDraggedPC(null); return; }
    if (stage === "Hired") {
      setHiredPC(pc); setFinalizedPay(pc.offer_amount || ""); setHiredPayDialogOpen(true); setDraggedPC(null); return;
    }
    try {
      await movePipelineStageDb(pcId, stage, currentUser);
      await refreshPipeline();
      toast.success(`Moved to ${stage}`);
    } catch (err: any) { toast.error(err.message); }
    setDraggedPC(null);
  };

  const handleConfirmHire = async () => {
    if (!hiredPC) return;
    try {
      await movePipelineStageDb(hiredPC.id, "Hired", currentUser, `Finalized pay: ${finalizedPay}`);
      await updatePipelineCandidateDb(hiredPC.id, { offer_amount: finalizedPay, offer_status: "accepted" });
      await refreshPipeline();
      toast.success("Candidate hired!");
    } catch (err: any) { toast.error(err.message); }
    setHiredPayDialogOpen(false); setDraggedPC(null);
  };

  const openMove = (pc: DbPipelineCandidate) => { setSelectedPC(pc); setMoveTarget(""); setMoveNotes(""); setMoveDialogOpen(true); };

  const handleMove = async () => {
    if (!selectedPC || !moveTarget) return;
    if (moveTarget === "Hired") {
      setHiredPC(selectedPC); setFinalizedPay(selectedPC.offer_amount || ""); setHiredPayDialogOpen(true); setMoveDialogOpen(false); return;
    }
    try {
      await movePipelineStageDb(selectedPC.id, moveTarget, currentUser, moveNotes);
      await refreshPipeline();
      toast.success(`Moved to ${moveTarget}`);
    } catch (err: any) { toast.error(err.message); }
    setMoveDialogOpen(false);
  };

  const openDetail = async (pc: DbPipelineCandidate) => {
    setSelectedPC(pc);
    setScreeningNotes(pc.screening_notes || "");
    try {
      const [notes, interviews, candidate] = await Promise.all([
        fetchNotes(pc.id),
        fetchInterviewRounds(pc.id),
        fetchCandidateById(pc.candidate_id),
      ]);
      setDetailNotes(notes);
      setDetailInterviews(interviews);
      if (candidate) {
        const ws = await fetchWorkSamples(candidate.id);
        setDetailWorkSamples(ws);
        setCandidateCache(prev => ({ ...prev, [candidate.id]: candidate }));
      }
    } catch (err) { console.error(err); }
    setDetailDialogOpen(true);
  };

  const handleAddNote = async () => {
    if (!selectedPC || !newNoteText.trim()) return;
    try {
      const note = await addNoteDb(selectedPC.id, newNoteText, currentUser);
      setDetailNotes(prev => [note, ...prev]);
      setNewNoteText("");
      toast.success("Note added");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveScreeningNotes = async () => {
    if (!selectedPC) return;
    try {
      await updatePipelineCandidateDb(selectedPC.id, { screening_notes: screeningNotes });
      toast.success("Screening notes saved");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddPortfolioLink = async () => {
    if (!selectedPC || !newPortfolioUrl) return;
    const candidate = getCandidate(selectedPC.candidate_id);
    if (!candidate) return;
    try {
      const ws = await addWorkSampleDb(candidate.id, newPortfolioTitle || "Sample", newPortfolioUrl);
      setDetailWorkSamples(prev => [...prev, ws]);
      setNewPortfolioTitle(""); setNewPortfolioUrl("");
      toast.success("Portfolio link added");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleScheduleInterview = async () => {
    if (!selectedPC || !intInterviewer || !intDate) { toast.error("Fill all fields"); return; }
    try {
      const round = await addInterviewRoundDb(selectedPC.id, {
        round_number: detailInterviews.length + 1,
        interview_type: intType, interviewer: intInterviewer,
        scheduled_at: intDate, feedback: intFeedback,
        rating: intRating || null, status: intFeedback ? "completed" : "scheduled",
        meeting_link: intMeetingLink,
      });
      setDetailInterviews(prev => [...prev, round]);
      toast.success("Interview scheduled");
      setInterviewDialogOpen(false);
      setIntInterviewer(""); setIntDate(""); setIntFeedback(""); setIntRating(0); setIntMeetingLink("");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateInterviewFeedback = async (roundId: string, feedback: string, rating: number) => {
    try {
      await updateInterviewRoundDb(roundId, { feedback, rating, status: "completed" });
      setDetailInterviews(prev => prev.map(ir => ir.id === roundId ? { ...ir, feedback, rating, status: "completed" } : ir));
      toast.success("Interview feedback saved");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReject = async (pc: DbPipelineCandidate, reason: string) => {
    try {
      await movePipelineStageDb(pc.id, "Rejected", currentUser, reason);
      await updatePipelineCandidateDb(pc.id, { rejection_reason: reason });
      await refreshPipeline();
      toast.success("Candidate rejected");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleHandover = (pc: DbPipelineCandidate) => {
    const candidate = getCandidate(pc.candidate_id);
    if (!candidate) return;
    addHandover({
      requisitionId: req.id, dealId: req.hiringData?.dealId || req.id,
      creatorName: candidate.name, creatorEmail: candidate.email,
      creatorType: candidate.role_title, pepperPortalLink: "",
      phone: candidate.phone, paymentModel: (candidate.rate_model as any) || "Per Word",
      finalizedPay: parseFloat(pc.offer_amount?.replace(/[^\d.]/g, "") || "0"),
      currency: req.currency, handoverDate: new Date().toISOString().split("T")[0],
      sharedVia: ["email"], sharedTo: "",
      notes: `Auto-handover from ATS pipeline ${req.id}`,
      recruiterName: req.recruiterAssigned || currentUser,
      marginFromRequisition: req.grossMarginPercent, marginOverridden: false,
    });
    toast.success(`${candidate.name} handed over!`);
  };

  const handleEditCandidate = (candidateId: string) => {
    const c = getCandidate(candidateId);
    if (c) { setEditCandidate({ ...c }); setEditCandidateOpen(true); }
  };

  const handleSaveEditCandidate = async () => {
    if (!editCandidate) return;
    try {
      await updateCandidateDb(editCandidate.id, editCandidate);
      setCandidateCache(prev => ({ ...prev, [editCandidate.id]: editCandidate }));
      setEditCandidateOpen(false);
      toast.success("Candidate updated");
    } catch (err: any) { toast.error(err.message); }
  };

  const ensureUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return "https://" + url;
  };

  const filteredCandidates = allCandidates.filter(c =>
    c.name.toLowerCase().includes(searchCandidate.toLowerCase()) ||
    c.email.toLowerCase().includes(searchCandidate.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchCandidate.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ats")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{reqId} — {clientName}</h1>
            <Badge variant="outline" className="text-[10px] font-mono">{flowLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pipeline: {pipeline.length} candidates · {pipeline.filter(pc => pc.current_stage === "Hired").length} hired · {pipeline.filter(pc => pc.current_stage === "Rejected").length} rejected
            <span className="ml-2 text-[10px] text-primary">Drag cards to move between stages</span>
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditStages([...stages]); setStagesDialogOpen(true); }}>
          <Settings2 className="h-3.5 w-3.5" /> Stages
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Candidate
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {activeStages.map(stage => {
          const inStage = candidatesInStage(stage);
          return (
            <div key={stage} className="min-w-[220px] max-w-[260px] flex-shrink-0"
              onDragOver={handleDragOver} onDrop={(e) => handleDropToStage(e, stage)}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{stage}</h3>
                <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center font-mono">{inStage.length}</Badge>
              </div>
              <div className={`space-y-2 min-h-[80px] rounded-lg p-1 transition-colors ${draggedPC ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}>
                {inStage.map(pc => {
                  const candidate = getCandidate(pc.candidate_id);
                  if (!candidate) return null;
                  return (
                    <Card key={pc.id} draggable onDragStart={(e) => handleDragStart(e, pc.id)}
                      className={`cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors ${draggedPC === pc.id ? "opacity-50" : ""}`}
                      onClick={() => openDetail(pc)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-[13px] font-medium text-foreground leading-tight">{candidate.name}</p>
                              <p className="text-[10px] text-muted-foreground">{candidate.role_title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-mono text-foreground">{candidate.overall_score}</span>
                          </div>
                        </div>
                        {pc.availability && (
                          <p className="text-[9px] text-muted-foreground">Avail: {pc.availability}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{candidate.city}</span>
                          <span className="font-mono">{Math.round((Date.now() - new Date(pc.added_at).getTime()) / (1000 * 60 * 60 * 24))}d</span>
                        </div>
                        {pc.offer_amount && stage === "Hired" && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <DollarSign className="h-3 w-3" />
                            <span>Pay: {pc.offer_amount}</span>
                          </div>
                        )}
                        <div className="flex gap-1 pt-1">
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 flex-1" onClick={(e) => { e.stopPropagation(); openMove(pc); }}>
                            <ArrowRightLeft className="h-3 w-3 mr-1" /> Move
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); handleEditCandidate(pc.candidate_id); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {stage === "Hired" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); handleHandover(pc); }}>
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {inStage.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-[11px] text-muted-foreground">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Rejected column */}
        {candidatesInStage("Rejected").length > 0 && (
          <div className="min-w-[220px] max-w-[260px] flex-shrink-0"
            onDragOver={handleDragOver} onDrop={(e) => handleDropToStage(e, "Rejected")}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-destructive">Rejected</h3>
              <Badge variant="destructive" className="text-[10px] h-5">{candidatesInStage("Rejected").length}</Badge>
            </div>
            <div className="space-y-2">
              {candidatesInStage("Rejected").map(pc => {
                const candidate = getCandidate(pc.candidate_id);
                if (!candidate) return null;
                return (
                  <Card key={pc.id} className="opacity-60">
                    <CardContent className="p-3">
                      <p className="text-[13px] font-medium text-foreground">{candidate.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pc.rejection_reason || "No reason"}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}

      {/* Custom Stages Dialog */}
      <Dialog open={stagesDialogOpen} onOpenChange={setStagesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Customize Pipeline Stages</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Drag to reorder. "Rejected" is always available.</p>
            <div className="space-y-2">
              {editStages.map((stage, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 text-sm">{stage}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={i === 0}
                      onClick={() => { const ns = [...editStages]; [ns[i - 1], ns[i]] = [ns[i], ns[i - 1]]; setEditStages(ns); }}>↑</Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={i === editStages.length - 1}
                      onClick={() => { const ns = [...editStages]; [ns[i], ns[i + 1]] = [ns[i + 1], ns[i]]; setEditStages(ns); }}>↓</Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => setEditStages(editStages.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="New stage name" className="flex-1" />
              <Button size="sm" onClick={() => { if (newStageName.trim()) { setEditStages([...editStages, newStageName.trim()]); setNewStageName(""); } }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setEditStages([...defaultStages]); }}>Reset to Default</Button>
              <Button className="flex-1" onClick={handleSaveCustomStages}>Save Stages</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Candidate to Pipeline</DialogTitle></DialogHeader>
          <Tabs value={addMode} onValueChange={v => setAddMode(v as "db" | "new")}>
            <TabsList className="w-full">
              <TabsTrigger value="db" className="flex-1 text-xs">From Database</TabsTrigger>
              <TabsTrigger value="new" className="flex-1 text-xs">Create New</TabsTrigger>
            </TabsList>
            <TabsContent value="db" className="space-y-3">
              <Input placeholder="Search by name, email, or skill..." value={searchCandidate} onChange={e => setSearchCandidate(e.target.value)} />
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredCandidates.map(c => {
                  const alreadyInPipeline = pipeline.some(pc => pc.candidate_id === c.id);
                  return (
                    <div key={c.id} className={`flex items-center justify-between p-3 border border-border rounded-lg ${alreadyInPipeline ? "opacity-50" : "hover:bg-muted/50 cursor-pointer"}`}
                      onClick={() => !alreadyInPipeline && handleAddCandidate(c.id)}>
                      <div>
                        <p className="text-[13px] font-medium">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.role_title} · {c.city} · ★{c.overall_score}</p>
                        <div className="flex gap-1 mt-1">
                          {c.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                      {alreadyInPipeline ? <Badge variant="secondary" className="text-[10px]">Added</Badge> : <Plus className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
                {filteredCandidates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No matching candidates.</p>}
              </div>
            </TabsContent>
            <TabsContent value="new" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[10px] uppercase">Name *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] uppercase">Email *</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] uppercase">Phone</Label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase">Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {reqRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      {RESOURCE_SPECIFIC_TYPES.filter(t => !reqRoles.includes(t)).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newRole === "Other" && (
                  <div className="space-y-1.5"><Label className="text-[10px] uppercase">Specify Role</Label><Input value={newOtherRole} onChange={e => setNewOtherRole(e.target.value)} /></div>
                )}
                <div className="space-y-1.5"><Label className="text-[10px] uppercase">City</Label><Input value={newCity} onChange={e => setNewCity(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase">Availability *</Label>
                  <Select value={newAvailability} onValueChange={setNewAvailability}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AVAILABILITY_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase">Rate Model</Label>
                  <Select value={newRateModel} onValueChange={setNewRateModel}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{RATE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] uppercase">Expected Rate</Label><Input value={newRate} onChange={e => setNewRate(e.target.value)} placeholder="e.g. ₹3.5/word" /></div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase">Source</Label>
                  <Select value={newSource} onValueChange={setNewSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] uppercase">LinkedIn</Label><Input value={newLinkedIn} onChange={e => setNewLinkedIn(e.target.value)} /></div>
                <div className="col-span-2 space-y-1.5"><Label className="text-[10px] uppercase">Skills (comma-separated)</Label><Input value={newSkills} onChange={e => setNewSkills(e.target.value)} /></div>
              </div>
              <Button className="w-full" onClick={handleAddNewCandidate}>Create & Add to Pipeline</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Move Stage Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Move Candidate</DialogTitle></DialogHeader>
          {selectedPC && (
            <div className="space-y-3">
              <p className="text-sm">Current: <Badge variant="outline">{selectedPC.current_stage}</Badge></p>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase">Move to</Label>
                <Select value={moveTarget} onValueChange={setMoveTarget}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.filter(s => s !== selectedPC.current_stage).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs uppercase">Notes</Label><Textarea value={moveNotes} onChange={e => setMoveNotes(e.target.value)} rows={2} /></div>
              <Button className="w-full" onClick={handleMove} disabled={!moveTarget}>Confirm Move</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Finalized Pay Dialog */}
      <Dialog open={hiredPayDialogOpen} onOpenChange={setHiredPayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Finalize Hiring</DialogTitle></DialogHeader>
          {hiredPC && (() => {
            const candidate = getCandidate(hiredPC.candidate_id);
            return (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Hiring <strong className="text-foreground">{candidate?.name}</strong></p>
                <div className="space-y-1.5"><Label className="text-xs uppercase">Finalized Pay *</Label><Input value={finalizedPay} onChange={e => setFinalizedPay(e.target.value)} placeholder="e.g. ₹3.5/word" /></div>
                <Button className="w-full" onClick={handleConfirmHire}>Confirm & Move to Hired</Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPC && (() => {
            const candidate = getCandidate(selectedPC.candidate_id);
            if (!candidate) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" /> {candidate.name}
                    <Badge variant="outline" className="ml-2 text-[10px]">{selectedPC.current_stage}</Badge>
                    <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={() => { handleEditCandidate(candidate.id); setDetailDialogOpen(false); }}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1 text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="screening" className="flex-1 text-xs">Screening</TabsTrigger>
                    <TabsTrigger value="interviews" className="flex-1 text-xs">Interviews</TabsTrigger>
                    <TabsTrigger value="portfolio" className="flex-1 text-xs">Samples</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 text-xs">Notes</TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 text-xs">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Email</span>{candidate.email}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Phone</span>{candidate.phone}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">City</span>{candidate.city}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Experience</span>{candidate.experience}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Rate</span>{candidate.expected_rate} ({candidate.rate_model})</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Availability</span>{candidate.availability}</div>
                      {candidate.linkedin && (
                        <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">LinkedIn</span>
                          <a href={ensureUrl(candidate.linkedin)} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline flex items-center gap-1"><Link2 className="h-3 w-3" /> View Profile</a>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Scores</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[["Overall", candidate.overall_score], ["Technical", candidate.technical_score], ["Communication", candidate.communication_score], ["Culture Fit", candidate.culture_fit_score]].map(([label, score]) => (
                          <div key={label as string} className="text-center bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">{label as string}</p>
                            <p className="text-sm font-mono font-semibold text-foreground">{score as number}/5</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedPC.offer_amount && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-600 mb-1">Finalized Pay</p>
                        <p className="text-sm font-mono font-semibold text-emerald-600">{selectedPC.offer_amount}</p>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" className="gap-1" onClick={() => { openMove(selectedPC); setDetailDialogOpen(false); }}><ArrowRightLeft className="h-3 w-3" /> Move</Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => { setInterviewDialogOpen(true); setDetailDialogOpen(false); }}><Calendar className="h-3 w-3" /> Interview</Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                        setEmailTo(candidate.email); setEmailSubject(`Re: ${clientName} — ${req.id}`); setEmailBody(`Hi ${candidate.name},\n\n`);
                        setEmailDialogOpen(true); setDetailDialogOpen(false);
                      }}><Mail className="h-3 w-3" /> Email</Button>
                      {selectedPC.current_stage === "Hired" && (
                        <Button size="sm" variant="outline" className="gap-1 text-emerald-600" onClick={() => { handleHandover(selectedPC); setDetailDialogOpen(false); }}><Send className="h-3 w-3" /> Handover</Button>
                      )}
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => { handleReject(selectedPC, "Not a good fit"); setDetailDialogOpen(false); }}><XCircle className="h-3 w-3" /> Reject</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="screening" className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider">Screening Notes</Label>
                      <Textarea value={screeningNotes} onChange={e => setScreeningNotes(e.target.value)} rows={4} placeholder="Add screening observations..." />
                      <Button size="sm" onClick={handleSaveScreeningNotes}>Save Screening Notes</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="interviews" className="space-y-3">
                    {detailInterviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No interviews scheduled yet.</p>
                    ) : (
                      detailInterviews.map(ir => (
                        <InterviewCard key={ir.id} ir={ir} onSaveFeedback={handleUpdateInterviewFeedback} ensureUrl={ensureUrl} />
                      ))
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setInterviewDialogOpen(true); setDetailDialogOpen(false); }}>
                      <Plus className="h-3 w-3" /> Schedule Interview
                    </Button>
                  </TabsContent>

                  <TabsContent value="portfolio" className="space-y-3">
                    <p className="text-xs text-muted-foreground">Work samples, portfolios, and assignments</p>
                    {detailWorkSamples.map(ws => (
                      <div key={ws.id} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium">{ws.title}</p>
                          <a href={ensureUrl(ws.url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            <Link2 className="h-3 w-3" /> {ws.url}
                          </a>
                        </div>
                        <Badge variant="secondary" className="text-[9px]">{ws.sample_type}</Badge>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={newPortfolioTitle} onChange={e => setNewPortfolioTitle(e.target.value)} placeholder="Title" className="flex-1" />
                      <Input value={newPortfolioUrl} onChange={e => setNewPortfolioUrl(e.target.value)} placeholder="URL" className="flex-1" />
                      <Button size="sm" onClick={handleAddPortfolioLink}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-3">
                    <div className="flex gap-2">
                      <Textarea value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Add a note (visible to all users)..." rows={2} className="flex-1" />
                      <Button size="sm" onClick={handleAddNote} disabled={!newNoteText.trim()}><MessageSquare className="h-3.5 w-3.5" /></Button>
                    </div>
                    {detailNotes.map(n => (
                      <div key={n.id} className="border-l-2 border-primary/20 pl-3 py-1">
                        <p className="text-[13px]">{n.note_text}</p>
                        <p className="text-[10px] text-muted-foreground">{n.author} · {new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {detailNotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-2">
                    {(selectedPC.stage_history as any[]).map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 border-l-2 border-primary/20 pl-3 py-1">
                        <div className="flex-1">
                          <p className="text-[13px] font-medium">{t.from ? `${t.from} → ${t.to}` : `Added to ${t.to}`}</p>
                          {t.notes && <p className="text-[11px] text-muted-foreground">{t.notes}</p>}
                          <p className="text-[10px] text-muted-foreground">{t.movedBy} · {new Date(t.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase">Type</Label>
              <Select value={intType} onValueChange={setIntType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In-house">In-house</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Interviewer</Label><Input value={intInterviewer} onChange={e => setIntInterviewer(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Date & Time</Label><Input type="datetime-local" value={intDate} onChange={e => setIntDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Meeting Link</Label><Input value={intMeetingLink} onChange={e => setIntMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Feedback (optional)</Label><Textarea value={intFeedback} onChange={e => setIntFeedback(e.target.value)} rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Rating (1-5)</Label><Input type="number" min={0} max={5} value={intRating || ""} onChange={e => setIntRating(Number(e.target.value))} /></div>
            <Button className="w-full" onClick={handleScheduleInterview}>Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={editCandidateOpen} onOpenChange={setEditCandidateOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Candidate</DialogTitle></DialogHeader>
          {editCandidate && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Name</Label><Input value={editCandidate.name} onChange={e => setEditCandidate({ ...editCandidate, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Email</Label><Input value={editCandidate.email} onChange={e => setEditCandidate({ ...editCandidate, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Phone</Label><Input value={editCandidate.phone} onChange={e => setEditCandidate({ ...editCandidate, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Role</Label><Input value={editCandidate.role_title} onChange={e => setEditCandidate({ ...editCandidate, role_title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">City</Label><Input value={editCandidate.city} onChange={e => setEditCandidate({ ...editCandidate, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Experience</Label><Input value={editCandidate.experience} onChange={e => setEditCandidate({ ...editCandidate, experience: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Expected Rate</Label><Input value={editCandidate.expected_rate} onChange={e => setEditCandidate({ ...editCandidate, expected_rate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">LinkedIn</Label><Input value={editCandidate.linkedin} onChange={e => setEditCandidate({ ...editCandidate, linkedin: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase">Availability</Label>
                <Select value={editCandidate.availability} onValueChange={v => setEditCandidate({ ...editCandidate, availability: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AVAILABILITY_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Overall Score (0-5)</Label><Input type="number" min={0} max={5} step={0.1} value={editCandidate.overall_score} onChange={e => setEditCandidate({ ...editCandidate, overall_score: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Technical Score</Label><Input type="number" min={0} max={5} step={0.1} value={editCandidate.technical_score} onChange={e => setEditCandidate({ ...editCandidate, technical_score: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase">Communication Score</Label><Input type="number" min={0} max={5} step={0.1} value={editCandidate.communication_score} onChange={e => setEditCandidate({ ...editCandidate, communication_score: Number(e.target.value) })} /></div>
              <div className="col-span-2"><Button className="w-full" onClick={handleSaveEditCandidate}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Send Email</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs uppercase">To</Label><Input value={emailTo} onChange={e => setEmailTo(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Subject</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase">Body</Label><Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={5} /></div>
            <Button className="w-full gap-1" onClick={() => { toast.success("Email draft prepared"); setEmailDialogOpen(false); }}><Send className="h-3.5 w-3.5" /> Send</Button>
            <p className="text-[10px] text-muted-foreground text-center">Email integration coming soon.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Interview card component with editable feedback/scoring
const InterviewCard = ({ ir, onSaveFeedback, ensureUrl }: {
  ir: DbInterviewRound;
  onSaveFeedback: (id: string, feedback: string, rating: number) => void;
  ensureUrl: (url: string) => string;
}) => {
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(ir.feedback);
  const [rating, setRating] = useState(ir.rating || 0);

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Round {ir.round_number}: {ir.interview_type}</p>
            <p className="text-[10px] text-muted-foreground">{ir.interviewer} · {ir.scheduled_at}</p>
            {ir.meeting_link && (
              <a href={ensureUrl(ir.meeting_link)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                <Link2 className="h-3 w-3" /> Join Meeting
              </a>
            )}
          </div>
          <div className="text-right">
            <Badge variant={ir.status === "completed" ? "default" : ir.status === "cancelled" ? "destructive" : "secondary"} className="text-[10px]">{ir.status}</Badge>
            {ir.rating && <p className="text-[10px] font-mono mt-1">★ {ir.rating}/5</p>}
          </div>
        </div>
        {ir.feedback && !editing && <p className="text-[11px] text-muted-foreground">{ir.feedback}</p>}
        {editing ? (
          <div className="space-y-2">
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="Interview feedback..." />
            <div className="flex gap-2 items-center">
              <Label className="text-[10px]">Rating:</Label>
              <Input type="number" min={1} max={5} value={rating || ""} onChange={e => setRating(Number(e.target.value))} className="w-20" />
              <Button size="sm" onClick={() => { onSaveFeedback(ir.id, feedback, rating); setEditing(false); }}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => setEditing(true)}>
            {ir.feedback ? "Edit Feedback" : "Add Feedback & Score"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ATSPipeline;
