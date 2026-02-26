import { useState } from "react";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, AlertTriangle, Flag, ExternalLink, Pencil, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { URGENCY_LEVELS, getMarginRiskColor, getMarginRiskLabel, getReqFlag, getAllStatuses, OPPORTUNITY_STAGES } from "@/lib/requisition-types";
import type { AdvancedRequisition } from "@/lib/requisition-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { POD_NAMES } from "@/lib/talent-client-store";
import { useAuth } from "@/lib/auth-context";

const formatCurrency = (n: number) => "₹" + n.toLocaleString("en-IN");

const INITIAL_POD_LEADS = ["Neha Gupta", "Ravi Kumar", "Anita Desai"];
const INITIAL_RECRUITERS = ["Neha Gupta", "Ravi Kumar", "Pooja Shah", "Sanjay Verma"];

const RequisitionsAdvanced = () => {
  const navigate = useNavigate();
  const { currentRole } = useAuth();
  const isAdmin = currentRole === "admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [podFilter, setPodFilter] = useState("All");
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [reqs, setReqs] = useState(advancedRequisitions);
  const [selectedReq, setSelectedReq] = useState<AdvancedRequisition | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [flagsDialogOpen, setFlagsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Edit state
  const [editStatus, setEditStatus] = useState<string>("");
  const [editStage, setEditStage] = useState<string>("");
  const [editPodLead, setEditPodLead] = useState("");
  const [editRecruiter, setEditRecruiter] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editRmgNotes, setEditRmgNotes] = useState("");
  // Financial edit state
  const [editRevenue, setEditRevenue] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editDealId, setEditDealId] = useState("");
  const [editByTA, setEditByTA] = useState(false);

  // Pod leads / recruiters with ability to add new
  const [podLeads, setPodLeads] = useState(INITIAL_POD_LEADS);
  const [recruiters, setRecruiters] = useState(INITIAL_RECRUITERS);
  const [newPodLead, setNewPodLead] = useState("");
  const [newRecruiter, setNewRecruiter] = useState("");

  // Review state
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Assignment state
  const [assignPodLead, setAssignPodLead] = useState("");
  const [assignRecruiter, setAssignRecruiter] = useState("");
  const [assignTargetDate, setAssignTargetDate] = useState("");

  // Update view state
  const [updateLinkedIn, setUpdateLinkedIn] = useState("");
  const [updateAtsLink, setUpdateAtsLink] = useState("");
  const [dailyUpdateTab, setDailyUpdateTab] = useState("today");

  // Daily update state
  const [duProfilesIdentified, setDuProfilesIdentified] = useState(0);
  const [duProfilesContacted, setDuProfilesContacted] = useState(0);
  const [duProfilesScreened, setDuProfilesScreened] = useState(0);
  const [duProfilesShared, setDuProfilesShared] = useState(0);
  const [duInterviews, setDuInterviews] = useState(0);
  const [duOffers, setDuOffers] = useState(0);
  const [duSelected, setDuSelected] = useState(0);
  const [duDropOffs, setDuDropOffs] = useState(0);
  const [duBlockers, setDuBlockers] = useState("");
  const [duNotes, setDuNotes] = useState("");

  const getClientName = (r: AdvancedRequisition) =>
    r.flow === "sales" ? r.salesData?.clientName || "" : r.hiringData?.clientName || "";

  const getDealId = (r: AdvancedRequisition) =>
    r.flow !== "sales" ? r.hiringData?.dealId || "—" : "Pre-Deal";

  const getPod = (r: AdvancedRequisition) =>
    r.flow !== "sales" ? r.hiringData?.pod || "—" : "—";

  const getStage = (r: AdvancedRequisition) =>
    r.flow === "sales" ? r.salesData?.opportunityStage || "" : r.hiringData?.opportunityStage || "";

  const getUrgencyDisplay = (r: AdvancedRequisition) => {
    if (r.flow === "sales") {
      const u = r.salesData?.urgency;
      return URGENCY_LEVELS.find(l => l.value === u)?.label || "—";
    }
    return r.hiringData?.urgencyScale ? `${r.hiringData.urgencyScale}/10` : "—";
  };

  const getCreatorTypes = (r: AdvancedRequisition) => {
    if (r.flow === "sales") return r.salesData?.specificResourceTypes?.join(", ") || "—";
    return r.hiringData?.lineItems.map(li => li.creatorType === "Other" ? li.otherCreatorTypeSpec : li.creatorType).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "—";
  };

  const getFlowLabel = (flow: string) => {
    switch (flow) {
      case "sales": return "Sales";
      case "studio": return "Studio";
      case "freelancer": return "Freelancer";
      default: return flow;
    }
  };

  const filtered = reqs.filter((r) => {
    const client = getClientName(r).toLowerCase();
    const matchSearch = client.includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchFlow = flowFilter === "all" || r.flow === flowFilter;
    const matchPod = podFilter === "All" || getPod(r) === podFilter;
    return matchSearch && matchStatus && matchFlow && matchPod;
  });

  // Flags
  const flaggedReqs = reqs.filter(r => getReqFlag(r) !== null);
  const redFlags = flaggedReqs.filter(r => getReqFlag(r) === "red");
  const yellowFlags = flaggedReqs.filter(r => getReqFlag(r) === "yellow");

  const daysOpen = (createdAt: string) => Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  // Inline status change
  const handleInlineStatusChange = (reqId: string, newStatus: string) => {
    setReqs(prev => prev.map(r => r.id === reqId ? {
      ...r, status: newStatus,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: newStatus, editedBy: "User", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Status updated");
  };

  // Inline stage change
  const handleInlineStageChange = (reqId: string, newStage: string) => {
    setReqs(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      const updated = { ...r };
      const oldStage = getStage(r);
      if (r.flow === "sales" && r.salesData) {
        updated.salesData = { ...r.salesData, opportunityStage: newStage as any };
      } else if (r.hiringData) {
        updated.hiringData = { ...r.hiringData, opportunityStage: newStage as any };
      }
      updated.auditLog = [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "opportunityStage", oldValue: oldStage, newValue: newStage, editedBy: "User", timestamp: new Date().toISOString() }];
      return updated;
    }));
    toast.success("Stage updated");
  };

  const handleApprove = () => {
    if (!selectedReq) return;
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "Approved but not assigned" as const, rmgNotes: reviewNotes, taEditedPendingApproval: false,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "Approved but not assigned", editedBy: "RMG", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Requisition approved");
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    if (!selectedReq || !rejectionReason) { toast.error("Rejection reason required"); return; }
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "Scrapped" as const, rejectionReason, rmgNotes: reviewNotes, taEditedPendingApproval: false,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "Scrapped", editedBy: "RMG", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Requisition scrapped");
    setReviewDialogOpen(false);
  };

  const handleAssign = () => {
    if (!selectedReq || !assignPodLead) { toast.error("POD Lead required"); return; }
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "In progress" as const, podLeadAssigned: assignPodLead, recruiterAssigned: assignRecruiter,
      targetClosureDate: assignTargetDate,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "In progress", editedBy: "RMG", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Assigned to POD Lead");
    setAssignDialogOpen(false);
  };

  const handleSaveLinks = () => {
    if (!selectedReq) return;
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, linkedInRecruiterLink: updateLinkedIn, atsSheetLink: updateAtsLink,
    } : r));
    toast.success("Links updated");
  };

  const handleFunnelUpdate = () => {
    if (!selectedReq) return;
    const prev = getCumulativeMetrics(selectedReq);
    const delta = {
      profilesIdentified: Math.max(0, duProfilesIdentified - prev.identified),
      profilesContacted: Math.max(0, duProfilesContacted - prev.contacted),
      profilesScreened: Math.max(0, duProfilesScreened - prev.screened),
      profilesShared: Math.max(0, duProfilesShared - prev.shared),
      interviewsScheduled: Math.max(0, duInterviews - prev.interviews),
      offersRolledOut: Math.max(0, duOffers - prev.offers),
      selected: Math.max(0, duSelected - prev.selected),
      dropOffs: Math.max(0, duDropOffs - prev.dropOffs),
    };
    const update = {
      id: crypto.randomUUID(), date: new Date().toISOString().split("T")[0],
      recruiterName: selectedReq.recruiterAssigned || "Unknown",
      ...delta, blockers: duBlockers, notes: duNotes,
    };
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? { ...r, dailyUpdates: [...r.dailyUpdates, update] } : r));
    toast.success("Funnel updated — daily log auto-generated");
    setDuBlockers(""); setDuNotes("");
  };

  const openEdit = (r: AdvancedRequisition) => {
    setSelectedReq(r);
    setEditStatus(r.status);
    setEditStage(getStage(r));
    setEditPodLead(r.podLeadAssigned);
    setEditRecruiter(r.recruiterAssigned);
    setEditTargetDate(r.targetClosureDate);
    setEditRmgNotes(r.rmgNotes);
    setEditRevenue(r.totalClientRevenue);
    setEditCost(r.totalCreatorCost);
    setEditDealId(getDealId(r));
    setEditByTA(false);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!selectedReq) return;
    const changes: { field: string; old: string; new: string }[] = [];
    if (editStatus !== selectedReq.status) changes.push({ field: "status", old: selectedReq.status, new: editStatus });
    if (editStage !== getStage(selectedReq)) changes.push({ field: "opportunityStage", old: getStage(selectedReq), new: editStage });
    if (editPodLead !== selectedReq.podLeadAssigned) changes.push({ field: "podLeadAssigned", old: selectedReq.podLeadAssigned, new: editPodLead });
    if (editRecruiter !== selectedReq.recruiterAssigned) changes.push({ field: "recruiterAssigned", old: selectedReq.recruiterAssigned, new: editRecruiter });
    if (editTargetDate !== selectedReq.targetClosureDate) changes.push({ field: "targetClosureDate", old: selectedReq.targetClosureDate, new: editTargetDate });
    if (editRevenue !== selectedReq.totalClientRevenue) changes.push({ field: "totalClientRevenue", old: String(selectedReq.totalClientRevenue), new: String(editRevenue) });
    if (editCost !== selectedReq.totalCreatorCost) changes.push({ field: "totalCreatorCost", old: String(selectedReq.totalCreatorCost), new: String(editCost) });

    const editedBy = editByTA ? "TA" : "User";
    const newAuditEntries = changes.map(c => ({
      id: crypto.randomUUID(), fieldChanged: c.field, oldValue: c.old, newValue: c.new, editedBy, timestamp: new Date().toISOString(),
    }));

    // If TA edits deal/financial/creator details, flag for approval
    const taFlag = editByTA && changes.some(c => ["totalClientRevenue", "totalCreatorCost", "opportunityStage"].includes(c.field));

    const grossMargin = editRevenue - editCost;
    const grossMarginPercent = editRevenue ? Math.round(grossMargin / editRevenue * 1000) / 10 : 0;

    setReqs(prev => prev.map(r => {
      if (r.id !== selectedReq.id) return r;
      const updated: AdvancedRequisition = {
        ...r,
        status: taFlag ? "RMG approval Pending" : editStatus as any,
        podLeadAssigned: editPodLead,
        recruiterAssigned: editRecruiter,
        targetClosureDate: editTargetDate,
        rmgNotes: editRmgNotes,
        totalClientRevenue: editRevenue,
        totalCreatorCost: editCost,
        grossMargin,
        grossMarginPercent,
        updatedAt: new Date().toISOString(),
        auditLog: [...r.auditLog, ...newAuditEntries],
        taEditedPendingApproval: taFlag || r.taEditedPendingApproval,
      };
      // Update stage
      if (editStage !== getStage(r)) {
        if (r.flow === "sales" && r.salesData) {
          updated.salesData = { ...r.salesData, opportunityStage: editStage as any };
        } else if (r.hiringData) {
          updated.hiringData = { ...r.hiringData, opportunityStage: editStage as any };
        }
      }
      // Update dealId
      if (r.hiringData && editDealId !== (r.hiringData.dealId || "")) {
        updated.hiringData = { ...(updated.hiringData || r.hiringData), dealId: editDealId };
      }
      return updated;
    }));
    toast.success(taFlag ? "Changes sent for RMG approval" : "Requisition updated");
    setEditDialogOpen(false);
  };

  const openReview = (r: AdvancedRequisition) => { setSelectedReq(r); setReviewNotes(r.rmgNotes); setRejectionReason(""); setReviewDialogOpen(true); };
  const openAssign = (r: AdvancedRequisition) => { setSelectedReq(r); setAssignPodLead(r.podLeadAssigned); setAssignRecruiter(r.recruiterAssigned); setAssignTargetDate(r.targetClosureDate); setAssignDialogOpen(true); };
  const openUpdate = (r: AdvancedRequisition) => {
    setSelectedReq(r);
    setUpdateLinkedIn(r.linkedInRecruiterLink);
    setUpdateAtsLink(r.atsSheetLink);
    const cum = getCumulativeMetrics(r);
    setDuProfilesIdentified(cum.identified);
    setDuProfilesContacted(cum.contacted);
    setDuProfilesScreened(cum.screened);
    setDuProfilesShared(cum.shared);
    setDuInterviews(cum.interviews);
    setDuOffers(cum.offers);
    setDuSelected(cum.selected);
    setDuDropOffs(cum.dropOffs);
    setDuBlockers("");
    setDuNotes("");
    setUpdateDialogOpen(true);
  };

  const allStatuses = getAllStatuses();

  const getCumulativeMetrics = (r: AdvancedRequisition) => {
    return r.dailyUpdates.reduce((acc, du) => ({
      identified: acc.identified + du.profilesIdentified,
      contacted: acc.contacted + du.profilesContacted,
      screened: acc.screened + du.profilesScreened,
      shared: acc.shared + du.profilesShared,
      interviews: acc.interviews + du.interviewsScheduled,
      offers: acc.offers + du.offersRolledOut,
      selected: acc.selected + du.selected,
      dropOffs: acc.dropOffs + du.dropOffs,
    }), { identified: 0, contacted: 0, screened: 0, shared: 0, interviews: 0, offers: 0, selected: 0, dropOffs: 0 });
  };

  const getTodayUpdates = (r: AdvancedRequisition) => {
    const today = new Date().toISOString().split("T")[0];
    return r.dailyUpdates.filter(du => du.date === today);
  };

  const addPodLeadOption = () => {
    if (newPodLead && !podLeads.includes(newPodLead)) {
      setPodLeads(prev => [...prev, newPodLead]);
      setAssignPodLead(newPodLead);
      setNewPodLead("");
    }
  };

  const addRecruiterOption = () => {
    if (newRecruiter && !recruiters.includes(newRecruiter)) {
      setRecruiters(prev => [...prev, newRecruiter]);
      setAssignRecruiter(newRecruiter);
      setNewRecruiter("");
    }
  };

  // Summary card click filtering
  const handleSummaryClick = (status: string) => {
    if (status === "Total") { setStatusFilter("all"); return; }
    if (status === "Flagged") { setFlagsDialogOpen(true); return; }
    if (status === "Pending RMG") { setStatusFilter("RMG approval Pending"); return; }
    if (status === "In Progress") { setStatusFilter("In progress"); return; }
    if (status === "Closed") { setStatusFilter("Closed – allotted"); return; }
  };

  // Group by POD
  const podGroups = POD_NAMES.map(pod => ({
    name: pod,
    reqs: filtered.filter(r => getPod(r) === pod),
  })).filter(g => g.reqs.length > 0);

  const ungroupedReqs = filtered.filter(r => getPod(r) === "—");

  // Pending approvals (for admin)
  const pendingApprovals = reqs.filter(r => r.status === "RMG approval Pending" || r.taEditedPendingApproval);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Requisitions</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
          <p className="text-sm text-muted-foreground mt-1">Advanced requisition management with margin intelligence</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && pendingApprovals.length > 0 && (
            <Button variant={showApprovalQueue ? "default" : "outline"} onClick={() => setShowApprovalQueue(!showApprovalQueue)} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Approvals ({pendingApprovals.length})
            </Button>
          )}
          <Button className="gap-2" onClick={() => navigate("/requisitions/new")}>
            <Plus className="h-4 w-4" /> New Requisition
          </Button>
        </div>
      </div>

      {/* Approval Queue */}
      {showApprovalQueue && isAdmin && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader><CardTitle className="text-base text-warning">Pending Approvals</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-foreground">{r.id}</span>
                    <span className="text-muted-foreground">{getClientName(r)}</span>
                    {r.taEditedPendingApproval && <span className="status-badge bg-warning/15 text-warning text-[10px]">TA Edited</span>}
                    <span className="text-xs text-muted-foreground font-mono">₹{r.totalClientRevenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => {
                      setReqs(prev => prev.map(req => req.id === r.id ? {
                        ...req, status: "Approved but not assigned", taEditedPendingApproval: false,
                        auditLog: [...req.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: req.status, newValue: "Approved but not assigned", editedBy: "Admin", timestamp: new Date().toISOString() }]
                      } : req));
                      toast.success(`${r.id} approved`);
                    }}>
                      <CheckCircle className="h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => {
                      setReqs(prev => prev.map(req => req.id === r.id ? {
                        ...req, status: "Scrapped", taEditedPendingApproval: false,
                        auditLog: [...req.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: req.status, newValue: "Scrapped", editedBy: "Admin", timestamp: new Date().toISOString() }]
                      } : req));
                      toast.success(`${r.id} rejected`);
                    }}>
                      <XCircle className="h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flag Summary */}
      {flaggedReqs.length > 0 && (
        <button onClick={() => setFlagsDialogOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-md border border-warning/30 bg-warning/5 hover:bg-warning/10 transition-colors text-left">
          <Flag className="h-4 w-4 text-warning flex-shrink-0" />
          <span className="text-sm text-foreground">
            <strong>{flaggedReqs.length} flagged</strong> requisition{flaggedReqs.length > 1 ? "s" : ""} —{" "}
            {redFlags.length > 0 && <span className="text-destructive">{redFlags.length} deadline breached</span>}
            {redFlags.length > 0 && yellowFlags.length > 0 && ", "}
            {yellowFlags.length > 0 && <span className="text-warning">{yellowFlags.length} deadline approaching</span>}
          </span>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56 bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={flowFilter} onValueChange={setFlowFilter}>
          <SelectTrigger className="w-44 bg-card border-border"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sales">Sales (S-)</SelectItem>
            <SelectItem value="studio">Studio (CS-)</SelectItem>
            <SelectItem value="freelancer">Freelancer (F-)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={podFilter} onValueChange={setPodFilter}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue placeholder="POD" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All PODs</SelectItem>
            {POD_NAMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Status chips for quick multi-filter */}
      <div className="flex flex-wrap gap-1.5">
        {allStatuses.map(s => {
          const count = reqs.filter(r => r.status === s).length;
          if (count === 0) return null;
          const isActive = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(isActive ? "all" : s)}
              className={`status-badge cursor-pointer transition-colors ${isActive ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Summary Cards — clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: reqs.length },
          { label: "Pending RMG", value: reqs.filter(r => r.status === "RMG approval Pending").length },
          { label: "In Progress", value: reqs.filter(r => r.status === "In progress").length },
          { label: "Closed", value: reqs.filter(r => r.status.startsWith("Closed")).length },
          { label: "Flagged", value: flaggedReqs.length },
        ].map(s => (
          <button key={s.label} onClick={() => handleSummaryClick(s.label)} className="stat-card text-center cursor-pointer hover:border-primary/40 transition-colors">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-xl font-semibold text-foreground mt-1">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Requisition Table — grouped by POD */}
      {podGroups.map(group => (
        <div key={group.name} className="space-y-2">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{group.name} ({group.reqs.length})</h3>
          <ReqTable reqs={group.reqs} getClientName={getClientName} getDealId={getDealId} getFlowLabel={getFlowLabel} getCreatorTypes={getCreatorTypes} getUrgencyDisplay={getUrgencyDisplay} getStage={getStage} daysOpen={daysOpen} openEdit={openEdit} openReview={openReview} openAssign={openAssign} openUpdate={openUpdate} handleInlineStatusChange={handleInlineStatusChange} handleInlineStageChange={handleInlineStageChange} allStatuses={allStatuses} setSelectedReq={setSelectedReq} setUpdateDialogOpen={setUpdateDialogOpen} setReviewDialogOpen={setReviewDialogOpen} setAssignDialogOpen={setAssignDialogOpen} />
        </div>
      ))}

      {ungroupedReqs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Unassigned / Sales ({ungroupedReqs.length})</h3>
          <ReqTable reqs={ungroupedReqs} getClientName={getClientName} getDealId={getDealId} getFlowLabel={getFlowLabel} getCreatorTypes={getCreatorTypes} getUrgencyDisplay={getUrgencyDisplay} getStage={getStage} daysOpen={daysOpen} openEdit={openEdit} openReview={openReview} openAssign={openAssign} openUpdate={openUpdate} handleInlineStatusChange={handleInlineStatusChange} handleInlineStageChange={handleInlineStageChange} allStatuses={allStatuses} setSelectedReq={setSelectedReq} setUpdateDialogOpen={setUpdateDialogOpen} setReviewDialogOpen={setReviewDialogOpen} setAssignDialogOpen={setAssignDialogOpen} />
        </div>
      )}

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No requisitions found</p>}

      {/* Detail View */}
      {selectedReq && !reviewDialogOpen && !assignDialogOpen && !updateDialogOpen && !flagsDialogOpen && !editDialogOpen && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{selectedReq.id} — {getClientName(selectedReq)}</CardTitle>
              {selectedReq.taEditedPendingApproval && (
                <span className="status-badge bg-warning/15 text-warning">TA Edit — Pending Approval</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedReq(null)}>Close</Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList className="bg-muted">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="updates">Daily Updates ({selectedReq.dailyUpdates.length})</TabsTrigger>
                <TabsTrigger value="audit">Audit Log ({selectedReq.auditLog.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Raised By:</span><p className="font-medium">{selectedReq.raisedByName}</p></div>
                  <div><span className="text-muted-foreground">Type:</span><p className="font-medium">{getFlowLabel(selectedReq.flow)}</p></div>
                  <div><span className="text-muted-foreground">Status:</span><p><StatusBadge status={selectedReq.status} /></p></div>
                  <div><span className="text-muted-foreground">Recruiter:</span><p className="font-medium">{selectedReq.recruiterAssigned || "—"}</p></div>
                  <div><span className="text-muted-foreground">POD:</span><p className="font-medium">{getPod(selectedReq)}</p></div>
                  <div><span className="text-muted-foreground">Stage:</span><p className="text-xs">{getStage(selectedReq) || "—"}</p></div>
                  {selectedReq.flow !== "sales" && selectedReq.hiringData?.signingEntity && (
                    <div><span className="text-muted-foreground">Signing Entity:</span><p className="text-xs font-medium">{selectedReq.hiringData.signingEntity}</p></div>
                  )}
                  {selectedReq.linkedInRecruiterLink && (
                    <div><span className="text-muted-foreground">LinkedIn Project:</span>
                      <a href={selectedReq.linkedInRecruiterLink} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm">
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    </div>
                  )}
                  <div><span className="text-muted-foreground">Target Close:</span><p className="font-medium">{selectedReq.targetClosureDate || "—"}</p></div>
                </div>
                {selectedReq.rmgNotes && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border text-sm">
                    <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">RMG Notes</p>
                    <p className="text-foreground">{selectedReq.rmgNotes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="financials" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  <div className="stat-card text-center"><p className="text-xs text-muted-foreground font-mono">Revenue</p><p className="font-mono font-semibold mt-1">{formatCurrency(selectedReq.totalClientRevenue)}</p></div>
                  <div className="stat-card text-center"><p className="text-xs text-muted-foreground font-mono">Cost</p><p className="font-mono font-semibold mt-1">{formatCurrency(selectedReq.totalCreatorCost)}</p></div>
                  <div className="stat-card text-center"><p className="text-xs text-muted-foreground font-mono">Margin</p><p className="font-mono font-semibold mt-1">{formatCurrency(selectedReq.grossMargin)}</p></div>
                  <div className="stat-card text-center"><p className="text-xs text-muted-foreground font-mono">GM%</p><p className={`font-mono font-semibold mt-1 text-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}`}>{selectedReq.grossMarginPercent.toFixed(1)}%</p></div>
                  <div className="stat-card text-center"><p className="text-xs text-muted-foreground font-mono">Risk</p><div className={`mt-1 status-badge bg-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}/15 text-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)} mx-auto`}>{getMarginRiskLabel(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}</div></div>
                </div>
                {selectedReq.flow !== "sales" && selectedReq.hiringData && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">{["Creator Type", "#", "Experience", "Pay Model", "Client Unit Price", "Target Margin %", "Supply Unit Pay", "Risk"].map(h => (<th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-3 text-left">{h}</th>))}</tr></thead>
                      <tbody>{selectedReq.hiringData.lineItems.map(li => (
                        <tr key={li.id} className="data-table-row">
                          <td className="py-2 pr-3 text-xs">{li.creatorType === "Other" ? li.otherCreatorTypeSpec : li.creatorType}</td>
                          <td className="py-2 pr-3 font-mono">{li.numberOfCreators}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{li.experienceLevel}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{li.paymentModel}</td>
                          <td className="py-2 pr-3 font-mono">{formatCurrency(li.clientUnitPrice)}</td>
                          <td className="py-2 pr-3 font-mono">{li.targetUnitMargin}%</td>
                          <td className="py-2 pr-3 font-mono">{formatCurrency(li.supplyUnitPay)}</td>
                          <td className="py-2 pr-3"><span className={`status-badge bg-${getMarginRiskColor(li.grossMarginPercent, li.targetUnitMargin)}/15 text-${getMarginRiskColor(li.grossMarginPercent, li.targetUnitMargin)}`}>{getMarginRiskLabel(li.grossMarginPercent, li.targetUnitMargin)}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="updates" className="mt-4">
                <Tabs value={dailyUpdateTab} onValueChange={setDailyUpdateTab}>
                  <TabsList className="bg-muted mb-4">
                    <TabsTrigger value="today">Today's Work</TabsTrigger>
                    <TabsTrigger value="funnel">Overall Funnel</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today">
                    {(() => {
                      const todayUpdates = getTodayUpdates(selectedReq);
                      if (todayUpdates.length === 0) return <p className="text-sm text-muted-foreground">No updates logged today</p>;
                      return (<div className="space-y-3">{todayUpdates.map(du => (
                        <div key={du.id} className="p-3 rounded-md bg-muted/30 border border-border text-sm space-y-1">
                          <span className="text-xs text-muted-foreground">{du.recruiterName}</span>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span>Identified: <strong>{du.profilesIdentified}</strong></span><span>Contacted: <strong>{du.profilesContacted}</strong></span>
                            <span>Screened: <strong>{du.profilesScreened}</strong></span><span>Shared: <strong>{du.profilesShared}</strong></span>
                            <span>Interviews: <strong>{du.interviewsScheduled}</strong></span><span>Offers: <strong>{du.offersRolledOut}</strong></span>
                            <span>Selected: <strong>{du.selected}</strong></span><span>Drop-offs: <strong>{du.dropOffs}</strong></span>
                          </div>
                          {du.blockers && <p className="text-xs text-destructive">Blockers: {du.blockers}</p>}
                          {du.notes && <p className="text-xs text-muted-foreground">{du.notes}</p>}
                        </div>
                      ))}</div>);
                    })()}
                  </TabsContent>
                  <TabsContent value="funnel">
                    {selectedReq.dailyUpdates.length > 0 ? (
                      <>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
                          {Object.entries(getCumulativeMetrics(selectedReq)).map(([k, v]) => (
                            <div key={k} className="stat-card text-center p-3"><p className="text-[10px] text-muted-foreground font-mono uppercase">{k}</p><p className="font-mono font-semibold mt-1">{v}</p></div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          {[...selectedReq.dailyUpdates].reverse().map(du => (
                            <div key={du.id} className="p-3 rounded-md bg-muted/30 border border-border text-sm space-y-1">
                              <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{du.date}</span><span className="text-xs text-muted-foreground">{du.recruiterName}</span></div>
                              <div className="flex flex-wrap gap-3 text-xs">
                                <span>Identified: <strong>{du.profilesIdentified}</strong></span><span>Contacted: <strong>{du.profilesContacted}</strong></span>
                                <span>Screened: <strong>{du.profilesScreened}</strong></span><span>Shared: <strong>{du.profilesShared}</strong></span>
                              </div>
                              {du.blockers && <p className="text-xs text-destructive">Blockers: {du.blockers}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="text-sm text-muted-foreground">No daily updates yet</p>}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <div className="space-y-2">
                  {selectedReq.auditLog.length === 0 && <p className="text-sm text-muted-foreground">No audit entries</p>}
                  {[...selectedReq.auditLog].reverse().map(a => (
                    <div key={a.id} className="flex items-center gap-4 text-xs p-2 rounded bg-muted/30 border border-border">
                      <span className="font-mono text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</span>
                      <span className="text-foreground"><strong>{a.fieldChanged}</strong>: <span className="text-destructive line-through">{a.oldValue}</span> → <span className="text-success">{a.newValue}</span></span>
                      <span className="text-muted-foreground ml-auto">by {a.editedBy}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Flags Dialog */}
      <Dialog open={flagsDialogOpen} onOpenChange={setFlagsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Flagged Requisitions</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {flaggedReqs.map(r => {
              const flag = getReqFlag(r);
              return (
                <div key={r.id} className={`p-3 rounded-md border text-sm ${flag === "red" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${flag === "red" ? "bg-destructive" : "bg-warning"}`} />
                      <span className="font-mono font-medium">{r.id}</span>
                      <span className="text-muted-foreground">— {getClientName(r)}</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{daysOpen(r.createdAt)}d open</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {flag === "red" ? "Deadline breached" : "Deadline approaching"} · {getFlowLabel(r.flow)} · <StatusBadge status={r.status} />
                  </p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>RMG Review — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedReq && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Client:</span> <strong>{getClientName(selectedReq)}</strong></div>
                <div><span className="text-muted-foreground">Revenue:</span> <strong className="font-mono">{formatCurrency(selectedReq.totalClientRevenue)}</strong></div>
                <div><span className="text-muted-foreground">Cost:</span> <strong className="font-mono">{formatCurrency(selectedReq.totalCreatorCost)}</strong></div>
                <div><span className="text-muted-foreground">GM%:</span> <strong className={`font-mono text-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}`}>{selectedReq.grossMarginPercent.toFixed(1)}%</strong></div>
              </div>
            )}
            {selectedReq?.taEditedPendingApproval && (
              <div className="p-2 rounded bg-warning/10 border border-warning/30 text-xs text-warning">⚠ This requisition was modified by the TA team and requires re-approval.</div>
            )}
            <div className="space-y-2"><Label>Internal Notes</Label><Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-2"><Label>Rejection Reason</Label><Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-background border-border" /></div>
            <div className="flex gap-3 justify-end">
              <Button variant="destructive" onClick={handleReject}>Scrap</Button>
              <Button onClick={handleApprove}>Approve</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Assign — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>POD Lead *</Label>
              <Select value={assignPodLead} onValueChange={setAssignPodLead}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{podLeads.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input value={newPodLead} onChange={e => setNewPodLead(e.target.value)} placeholder="Add new POD lead..." className="bg-background border-border h-8 text-xs" />
                <Button variant="outline" size="sm" onClick={addPodLeadOption} className="h-8 text-xs">Add</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recruiter</Label>
              <Select value={assignRecruiter} onValueChange={setAssignRecruiter}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{recruiters.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input value={newRecruiter} onChange={e => setNewRecruiter(e.target.value)} placeholder="Add new recruiter..." className="bg-background border-border h-8 text-xs" />
                <Button variant="outline" size="sm" onClick={addRecruiterOption} className="h-8 text-xs">Add</Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Target Closure Date</Label><Input type="date" value={assignTargetDate} onChange={e => setAssignTargetDate(e.target.value)} className="bg-background border-border" /></div>
            <Button onClick={handleAssign} className="w-full">Assign & Start</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Update — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project Links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">LinkedIn Recruiter Link</Label><Input value={updateLinkedIn} onChange={e => setUpdateLinkedIn(e.target.value)} className="bg-background border-border" /></div>
                <div className="space-y-1.5"><Label className="text-xs">ATS / Sheet Link</Label><Input value={updateAtsLink} onChange={e => setUpdateAtsLink(e.target.value)} className="bg-background border-border" /></div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSaveLinks}>Save Links</Button>
            </div>
            <div className="border-t border-border" />
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Set Current Funnel</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Identified", value: duProfilesIdentified, setter: setDuProfilesIdentified },
                  { label: "Contacted", value: duProfilesContacted, setter: setDuProfilesContacted },
                  { label: "Screened", value: duProfilesScreened, setter: setDuProfilesScreened },
                  { label: "Shared", value: duProfilesShared, setter: setDuProfilesShared },
                  { label: "Interviews", value: duInterviews, setter: setDuInterviews },
                  { label: "Offers", value: duOffers, setter: setDuOffers },
                  { label: "Selected", value: duSelected, setter: setDuSelected },
                  { label: "Drop-offs", value: duDropOffs, setter: setDuDropOffs },
                ].map(f => (
                  <div key={f.label} className="space-y-1"><Label className="text-xs">{f.label}</Label><Input type="number" min={0} value={f.value} onChange={e => f.setter(Number(e.target.value))} className="bg-background border-border h-9" /></div>
                ))}
              </div>
              <div className="space-y-2"><Label className="text-xs">Blockers</Label><Input value={duBlockers} onChange={e => setDuBlockers(e.target.value)} className="bg-background border-border" /></div>
              <div className="space-y-2"><Label className="text-xs">Notes</Label><Textarea value={duNotes} onChange={e => setDuNotes(e.target.value)} className="bg-background border-border" /></div>
              <Button onClick={handleFunnelUpdate} className="w-full">Update Funnel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog — now includes deal ID, stage, financials, TA flag */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2 rounded bg-muted/30 border border-border">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={editByTA} onChange={e => setEditByTA(e.target.checked)} className="rounded border-border" />
                I am editing as TA team (changes will go for approval)
              </label>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Deal Stage</Label>
              <Select value={editStage} onValueChange={setEditStage}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>{OPPORTUNITY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedReq?.flow !== "sales" && (
              <div className="space-y-2"><Label>Deal ID</Label><Input value={editDealId} onChange={e => setEditDealId(e.target.value)} className="bg-background border-border" /></div>
            )}
            <div className="space-y-2"><Label>Recruiter</Label>
              <Select value={editRecruiter} onValueChange={setEditRecruiter}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{recruiters.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>POD Lead</Label>
              <Select value={editPodLead} onValueChange={setEditPodLead}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{podLeads.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Target Closure Date</Label><Input type="date" value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)} className="bg-background border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Client Revenue</Label><Input type="number" value={editRevenue} onChange={e => setEditRevenue(Number(e.target.value))} className="bg-background border-border" /></div>
              <div className="space-y-2"><Label>Creator Cost</Label><Input type="number" value={editCost} onChange={e => setEditCost(Number(e.target.value))} className="bg-background border-border" /></div>
            </div>
            <div className="space-y-2"><Label>RMG Notes</Label><Textarea value={editRmgNotes} onChange={e => setEditRmgNotes(e.target.value)} className="bg-background border-border" /></div>
            <Button onClick={handleEditSave} className="w-full">{editByTA ? "Submit for Approval" : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Req Table Component ────────────────────────────────
function ReqTable({ reqs, getClientName, getDealId, getFlowLabel, getCreatorTypes, getUrgencyDisplay, getStage, daysOpen, openEdit, openReview, openAssign, openUpdate, handleInlineStatusChange, handleInlineStageChange, allStatuses, setSelectedReq, setUpdateDialogOpen, setReviewDialogOpen, setAssignDialogOpen }: any) {
  const formatCurrency = (n: number) => "₹" + n.toLocaleString("en-IN");
  return (
    <div className="stat-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {["ID", "Client", "Deal ID", "Type", "Stage", "Creator Types", "Revenue", "Cost", "GM%", "Recruiter", "Status", "Days", "Urgency", "Actions"].map(h => (
              <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reqs.map((req: AdvancedRequisition) => {
            const flag = getReqFlag(req);
            return (
              <tr key={req.id} className={`data-table-row ${flag === "red" ? "bg-destructive/5" : flag === "yellow" ? "bg-warning/5" : ""} ${req.taEditedPendingApproval ? "border-l-2 border-l-warning" : ""}`}>
                <td className="py-3 font-mono text-muted-foreground pr-3">
                  {flag && <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${flag === "red" ? "bg-destructive" : "bg-warning"}`} />}
                  {req.id}
                </td>
                <td className="py-3 pr-3 whitespace-nowrap">
                  <button onClick={() => { setSelectedReq(req); setUpdateDialogOpen(false); setReviewDialogOpen(false); setAssignDialogOpen(false); }}
                    className="font-medium text-primary hover:underline">{getClientName(req)}</button>
                </td>
                <td className="py-3 font-mono text-muted-foreground pr-3">{getDealId(req)}</td>
                <td className="py-3 pr-3">
                  <span className={`status-badge ${req.flow === "sales" ? "bg-info/15 text-info" : req.flow === "studio" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"}`}>{getFlowLabel(req.flow)}</span>
                </td>
                <td className="py-3 pr-3">
                  <Select value={getStage(req) || "none"} onValueChange={v => v !== "none" && handleInlineStageChange(req.id, v)}>
                    <SelectTrigger className="h-7 w-32 text-[10px] bg-transparent border-border"><SelectValue>{getStage(req) ? getStage(req).substring(0, 20) + (getStage(req).length > 20 ? "…" : "") : "—"}</SelectValue></SelectTrigger>
                    <SelectContent>{OPPORTUNITY_STAGES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="py-3 text-xs text-muted-foreground pr-3 max-w-[140px] truncate">{getCreatorTypes(req)}</td>
                <td className="py-3 font-mono text-foreground pr-3 whitespace-nowrap">{formatCurrency(req.totalClientRevenue)}</td>
                <td className="py-3 font-mono text-muted-foreground pr-3 whitespace-nowrap">{formatCurrency(req.totalCreatorCost)}</td>
                <td className="py-3 pr-3">
                  <span className={`font-mono font-medium text-${getMarginRiskColor(req.grossMarginPercent, req.targetMarginPercent)}`}>{req.grossMarginPercent.toFixed(1)}%</span>
                </td>
                <td className="py-3 text-muted-foreground pr-3 whitespace-nowrap">{req.recruiterAssigned || "—"}</td>
                <td className="py-3 pr-3">
                  <Select value={req.status} onValueChange={v => handleInlineStatusChange(req.id, v)}>
                    <SelectTrigger className="h-7 w-36 text-[10px] bg-transparent border-border"><SelectValue><StatusBadge status={req.status} /></SelectValue></SelectTrigger>
                    <SelectContent>{allStatuses.map((s: string) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="py-3 font-mono text-muted-foreground pr-3">{daysOpen(req.createdAt)}</td>
                <td className="py-3 pr-3 text-xs text-muted-foreground">{getUrgencyDisplay(req)}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEdit(req)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                    {req.status === "RMG approval Pending" && <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openReview(req)}>Review</Button>}
                    {req.status === "Approved but not assigned" && <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openAssign(req)}>Assign</Button>}
                    {req.status === "In progress" && <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openUpdate(req)}>Update</Button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RequisitionsAdvanced;
