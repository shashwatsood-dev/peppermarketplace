import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { getStagesForFlow } from "@/lib/ats-types";
import type { PipelineCandidate } from "@/lib/ats-types";
import {
  getPipelineCandidates, getCandidateById, getCandidates, addToPipeline,
  movePipelineStage, updatePipelineCandidate, addInterviewRound,
} from "@/lib/ats-store";
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
  ArrowLeft, Plus, ChevronRight, User, Star, Calendar, MessageSquare,
  FileText, Clock, CheckCircle, XCircle, ArrowRightLeft,
} from "lucide-react";

const ATSPipeline = () => {
  const { reqId } = useParams<{ reqId: string }>();
  const navigate = useNavigate();
  const req = advancedRequisitions.find(r => r.id === reqId);

  const [pipeline, setPipeline] = useState(() => getPipelineCandidates(reqId || ""));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [selectedPC, setSelectedPC] = useState<PipelineCandidate | null>(null);
  const [searchCandidate, setSearchCandidate] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [moveTarget, setMoveTarget] = useState("");

  // Interview form
  const [intType, setIntType] = useState<"In-house" | "Client" | "Technical" | "HR">("In-house");
  const [intInterviewer, setIntInterviewer] = useState("");
  const [intDate, setIntDate] = useState("");
  const [intFeedback, setIntFeedback] = useState("");
  const [intRating, setIntRating] = useState<number>(0);

  if (!req) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/requisitions")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Requisitions
        </Button>
        <p className="text-muted-foreground">Requisition not found.</p>
      </div>
    );
  }

  const stages = getStagesForFlow(req.flow);
  const clientName = req.flow === "sales" ? req.salesData?.clientName : req.hiringData?.clientName;
  const flowLabel = req.flow === "sales" ? "Sample Profile" : req.flow === "studio" ? "Content Studio" : "Freelancer";

  const refreshPipeline = () => setPipeline(getPipelineCandidates(reqId || ""));

  const candidatesInStage = (stage: string) =>
    pipeline.filter(pc => pc.currentStage === stage);

  const handleAddCandidate = (candidateId: string) => {
    // Check if already in pipeline
    if (pipeline.some(pc => pc.candidateId === candidateId)) {
      toast.error("Candidate already in this pipeline");
      return;
    }
    addToPipeline(candidateId, reqId || "", "Current User");
    refreshPipeline();
    toast.success("Candidate added to pipeline");
    setAddDialogOpen(false);
  };

  const openMove = (pc: PipelineCandidate) => {
    setSelectedPC(pc);
    setMoveTarget("");
    setMoveNotes("");
    setMoveDialogOpen(true);
  };

  const handleMove = () => {
    if (!selectedPC || !moveTarget) return;
    movePipelineStage(selectedPC.id, moveTarget, "Current User", moveNotes);
    refreshPipeline();
    toast.success(`Moved to ${moveTarget}`);
    setMoveDialogOpen(false);
  };

  const openDetail = (pc: PipelineCandidate) => {
    setSelectedPC(pc);
    setDetailDialogOpen(true);
  };

  const handleScheduleInterview = () => {
    if (!selectedPC || !intInterviewer || !intDate) { toast.error("Fill all fields"); return; }
    addInterviewRound(selectedPC.id, {
      roundNumber: (selectedPC.interviewRounds?.length || 0) + 1,
      type: intType, interviewer: intInterviewer,
      scheduledAt: intDate, feedback: intFeedback,
      rating: intRating || null, status: intFeedback ? "completed" : "scheduled",
    });
    refreshPipeline();
    toast.success("Interview scheduled");
    setInterviewDialogOpen(false);
    setIntInterviewer(""); setIntDate(""); setIntFeedback(""); setIntRating(0);
  };

  const handleReject = (pc: PipelineCandidate, reason: string) => {
    movePipelineStage(pc.id, "Rejected", "Current User", reason);
    refreshPipeline();
    toast.success("Candidate rejected");
  };

  const allCandidates = getCandidates();
  const filteredCandidates = allCandidates.filter(c =>
    c.name.toLowerCase().includes(searchCandidate.toLowerCase()) ||
    c.email.toLowerCase().includes(searchCandidate.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchCandidate.toLowerCase()))
  );

  const activeStages = stages.filter(s => s !== "Rejected");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/requisitions")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{reqId} — {clientName}</h1>
            <Badge variant="outline" className="text-[10px] font-mono">{flowLabel}</Badge>
          </div>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1" />
          <p className="text-xs text-muted-foreground mt-0.5">
            Pipeline: {pipeline.length} candidates · {pipeline.filter(pc => pc.currentStage === "Hired").length} hired · {pipeline.filter(pc => pc.currentStage === "Rejected").length} rejected
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Candidate
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {activeStages.map(stage => {
          const inStage = candidatesInStage(stage);
          return (
            <div key={stage} className="min-w-[220px] max-w-[260px] flex-shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{stage}</h3>
                <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center font-mono">{inStage.length}</Badge>
              </div>
              <div className="space-y-2">
                {inStage.map(pc => {
                  const candidate = getCandidateById(pc.candidateId);
                  if (!candidate) return null;
                  return (
                    <Card key={pc.id} className="cursor-pointer hover:border-primary/30 transition-colors duration-150" onClick={() => openDetail(pc)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[13px] font-medium text-foreground leading-tight">{candidate.name}</p>
                            <p className="text-[10px] text-muted-foreground">{candidate.currentRole}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-mono text-foreground">{candidate.overallScore}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{candidate.city}</span>
                          <span className="font-mono">{Math.round((Date.now() - new Date(pc.addedAt).getTime()) / (1000 * 60 * 60 * 24))}d</span>
                        </div>
                        {pc.assignmentScore !== null && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="text-foreground font-medium">Assignment: {pc.assignmentScore}/5</span>
                          </div>
                        )}
                        {pc.capabilityRating && (
                          <div className={`flex items-center gap-1 text-[10px] ${pc.capabilityRating === "Green" ? "text-emerald-600" : pc.capabilityRating === "Yellow" ? "text-amber-600" : "text-red-600"}`}>
                            <CheckCircle className="h-3 w-3" />
                            <span>Capability: {pc.capabilityRating}</span>
                          </div>
                        )}
                        <div className="flex gap-1 pt-1">
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 flex-1" onClick={(e) => { e.stopPropagation(); openMove(pc); }}>
                            <ArrowRightLeft className="h-3 w-3 mr-1" /> Move
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {inStage.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-[11px] text-muted-foreground">No candidates</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Rejected column */}
        {candidatesInStage("Rejected").length > 0 && (
          <div className="min-w-[220px] max-w-[260px] flex-shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-destructive">Rejected</h3>
              <Badge variant="destructive" className="text-[10px] h-5">{candidatesInStage("Rejected").length}</Badge>
            </div>
            <div className="space-y-2">
              {candidatesInStage("Rejected").map(pc => {
                const candidate = getCandidateById(pc.candidateId);
                if (!candidate) return null;
                return (
                  <Card key={pc.id} className="opacity-60">
                    <CardContent className="p-3">
                      <p className="text-[13px] font-medium text-foreground">{candidate.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pc.rejectionReason || "No reason specified"}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Candidate Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Candidate to Pipeline</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search by name, email, or skill..." value={searchCandidate} onChange={e => setSearchCandidate(e.target.value)} />
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredCandidates.map(c => {
                const alreadyInPipeline = pipeline.some(pc => pc.candidateId === c.id);
                return (
                  <div key={c.id} className={`flex items-center justify-between p-3 border border-border rounded-lg ${alreadyInPipeline ? "opacity-50" : "hover:bg-muted/50 cursor-pointer"}`}
                    onClick={() => !alreadyInPipeline && handleAddCandidate(c.id)}>
                    <div>
                      <p className="text-[13px] font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.currentRole} · {c.city} · ★{c.overallScore}</p>
                      <div className="flex gap-1 mt-1">
                        {c.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    {alreadyInPipeline ? (
                      <Badge variant="secondary" className="text-[10px]">Already added</Badge>
                    ) : (
                      <Plus className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
              {filteredCandidates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No matching candidates. <Button variant="link" className="px-1" onClick={() => navigate("/candidates")}>Add new</Button></p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Stage Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Move Candidate</DialogTitle></DialogHeader>
          {selectedPC && (
            <div className="space-y-3">
              <p className="text-sm">Current: <Badge variant="outline">{selectedPC.currentStage}</Badge></p>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Move to</Label>
                <Select value={moveTarget} onValueChange={setMoveTarget}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.filter(s => s !== selectedPC.currentStage).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Notes</Label>
                <Textarea value={moveNotes} onChange={e => setMoveNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
              </div>
              <Button className="w-full" onClick={handleMove} disabled={!moveTarget}>Confirm Move</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPC && (() => {
            const candidate = getCandidateById(selectedPC.candidateId);
            if (!candidate) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" /> {candidate.name}
                    <Badge variant="outline" className="ml-2 text-[10px]">{selectedPC.currentStage}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1 text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 text-xs">Stage History</TabsTrigger>
                    <TabsTrigger value="interviews" className="flex-1 text-xs">Interviews</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 text-xs">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Email</span>{candidate.email}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Phone</span>{candidate.phone}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">City</span>{candidate.city}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Experience</span>{candidate.experience}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Rate</span>{candidate.expectedRate}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Availability</span>{candidate.availability}</div>
                      <div className="col-span-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Domain Expertise</span>{candidate.domainExpertise}</div>
                      <div className="col-span-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Tools</span>{candidate.toolsProficiency}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Scores</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[["Overall", candidate.overallScore], ["Technical", candidate.technicalScore], ["Communication", candidate.communicationScore], ["Culture Fit", candidate.cultureFitScore]].map(([label, score]) => (
                          <div key={label as string} className="text-center bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">{label as string}</p>
                            <p className="text-sm font-mono font-semibold text-foreground">{score as number}/5</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {candidate.workSamples.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Work Samples</span>
                        <div className="space-y-1">
                          {candidate.workSamples.map(ws => (
                            <a key={ws.id} href={ws.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-primary hover:underline">
                              <FileText className="h-3 w-3" /> {ws.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1" onClick={() => { openMove(selectedPC); setDetailDialogOpen(false); }}>
                        <ArrowRightLeft className="h-3 w-3" /> Move Stage
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => { setInterviewDialogOpen(true); setDetailDialogOpen(false); }}>
                        <Calendar className="h-3 w-3" /> Schedule Interview
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => { handleReject(selectedPC, "Not a good fit"); setDetailDialogOpen(false); }}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-2">
                    {selectedPC.stageHistory.map((t, i) => (
                      <div key={i} className="flex items-start gap-3 border-l-2 border-primary/20 pl-3 py-1">
                        <div className="flex-1">
                          <p className="text-[13px] font-medium">{t.from ? `${t.from} → ${t.to}` : `Added to ${t.to}`}</p>
                          {t.notes && <p className="text-[11px] text-muted-foreground">{t.notes}</p>}
                          <p className="text-[10px] text-muted-foreground">{t.movedBy} · {new Date(t.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="interviews" className="space-y-2">
                    {selectedPC.interviewRounds.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No interviews scheduled yet.</p>
                    ) : (
                      selectedPC.interviewRounds.map(ir => (
                        <Card key={ir.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-[13px] font-medium">Round {ir.roundNumber}: {ir.type}</p>
                              <p className="text-[10px] text-muted-foreground">{ir.interviewer} · {ir.scheduledAt}</p>
                              {ir.feedback && <p className="text-[11px] mt-1">{ir.feedback}</p>}
                            </div>
                            <div className="text-right">
                              <Badge variant={ir.status === "completed" ? "default" : ir.status === "cancelled" ? "destructive" : "secondary"} className="text-[10px]">{ir.status}</Badge>
                              {ir.rating && <p className="text-[10px] font-mono mt-1">★ {ir.rating}/5</p>}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setInterviewDialogOpen(true); setDetailDialogOpen(false); }}>
                      <Plus className="h-3 w-3" /> Schedule Interview
                    </Button>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-2">
                    {candidate.interactions.map(int => (
                      <div key={int.id} className="border-l-2 border-muted pl-3 py-1">
                        <p className="text-[13px]">{int.summary}</p>
                        <p className="text-[10px] text-muted-foreground">{int.type} · {int.author} · {new Date(int.timestamp).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {candidate.notes.map(n => (
                      <div key={n.id} className="border-l-2 border-primary/20 pl-3 py-1">
                        <p className="text-[13px]">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground">{n.author} · {new Date(n.timestamp).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {candidate.interactions.length === 0 && candidate.notes.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No notes or interactions yet.</p>
                    )}
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
              <Label className="text-xs uppercase tracking-wider">Type</Label>
              <Select value={intType} onValueChange={v => setIntType(v as typeof intType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In-house">In-house</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Interviewer</Label>
              <Input value={intInterviewer} onChange={e => setIntInterviewer(e.target.value)} placeholder="Interviewer name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Date & Time</Label>
              <Input type="datetime-local" value={intDate} onChange={e => setIntDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Feedback (optional)</Label>
              <Textarea value={intFeedback} onChange={e => setIntFeedback(e.target.value)} rows={2} placeholder="Post-interview feedback..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Rating (optional, 1-5)</Label>
              <Input type="number" min={0} max={5} value={intRating || ""} onChange={e => setIntRating(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={handleScheduleInterview}>Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ATSPipeline;
