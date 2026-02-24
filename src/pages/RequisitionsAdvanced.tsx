import { useState } from "react";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, AlertTriangle, Flag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { URGENCY_LEVELS, getMarginRiskColor, getMarginRiskLabel, getReqFlag } from "@/lib/requisition-types";
import type { AdvancedRequisition } from "@/lib/requisition-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formatCurrency = (n: number) => "₹" + n.toLocaleString("en-IN");

const INITIAL_POD_LEADS = ["Neha Gupta", "Ravi Kumar", "Anita Desai"];
const INITIAL_RECRUITERS = ["Neha Gupta", "Ravi Kumar", "Pooja Shah", "Sanjay Verma"];

const RequisitionsAdvanced = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [reqs, setReqs] = useState(advancedRequisitions);
  const [selectedReq, setSelectedReq] = useState<AdvancedRequisition | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [flagsDialogOpen, setFlagsDialogOpen] = useState(false);

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
    return matchSearch && matchStatus && matchFlow;
  });

  // Flags
  const flaggedReqs = reqs.filter(r => getReqFlag(r) !== null);
  const redFlags = flaggedReqs.filter(r => getReqFlag(r) === "red");
  const yellowFlags = flaggedReqs.filter(r => getReqFlag(r) === "yellow");

  const daysOpen = (createdAt: string) => Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const handleApprove = () => {
    if (!selectedReq) return;
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "Approved but not assigned" as const, rmgNotes: reviewNotes,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "Approved but not assigned", editedBy: "RMG", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Requisition approved");
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    if (!selectedReq || !rejectionReason) { toast.error("Rejection reason required"); return; }
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "Scrapped" as const, rejectionReason, rmgNotes: reviewNotes,
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

  const handleDailyUpdate = () => {
    if (!selectedReq) return;
    const update = {
      id: crypto.randomUUID(), date: new Date().toISOString().split("T")[0],
      recruiterName: selectedReq.recruiterAssigned || "Unknown",
      profilesIdentified: duProfilesIdentified, profilesContacted: duProfilesContacted,
      profilesScreened: duProfilesScreened, profilesShared: duProfilesShared,
      interviewsScheduled: duInterviews, offersRolledOut: duOffers,
      selected: duSelected, dropOffs: duDropOffs, blockers: duBlockers, notes: duNotes,
    };
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? { ...r, dailyUpdates: [...r.dailyUpdates, update] } : r));
    toast.success("Daily update logged");
    setDuProfilesIdentified(0); setDuProfilesContacted(0); setDuProfilesScreened(0); setDuProfilesShared(0);
    setDuInterviews(0); setDuOffers(0); setDuSelected(0); setDuDropOffs(0); setDuBlockers(""); setDuNotes("");
  };

  const openReview = (r: AdvancedRequisition) => { setSelectedReq(r); setReviewNotes(r.rmgNotes); setRejectionReason(""); setReviewDialogOpen(true); };
  const openAssign = (r: AdvancedRequisition) => { setSelectedReq(r); setAssignPodLead(r.podLeadAssigned); setAssignRecruiter(r.recruiterAssigned); setAssignTargetDate(r.targetClosureDate); setAssignDialogOpen(true); };
  const openUpdate = (r: AdvancedRequisition) => { setSelectedReq(r); setUpdateLinkedIn(r.linkedInRecruiterLink); setUpdateAtsLink(r.atsSheetLink); setUpdateDialogOpen(true); };

  const statuses = ["all", "Yet to start", "In progress", "RMG approval Pending", "Approved but not assigned", "On hold", "Scrapped", "Closed – allotment pending", "Closed – allotted"];

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Requisitions</h1>
          <p className="text-sm text-muted-foreground mt-1">Advanced requisition management with margin intelligence</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/requisitions/new")}>
          <Plus className="h-4 w-4" /> New Requisition
        </Button>
      </div>

      {/* Flag Summary — clickable */}
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56 bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={flowFilter} onValueChange={setFlowFilter}>
          <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sales">Sales (S-)</SelectItem>
            <SelectItem value="studio">Studio (CS-)</SelectItem>
            <SelectItem value="freelancer">Freelancer (F-)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: reqs.length },
          { label: "Pending RMG", value: reqs.filter(r => r.status === "RMG approval Pending").length },
          { label: "In Progress", value: reqs.filter(r => r.status === "In progress").length },
          { label: "Closed", value: reqs.filter(r => r.status.startsWith("Closed")).length },
          { label: "Flagged", value: flaggedReqs.length },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-xl font-semibold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["ID", "Client", "Deal ID", "Type", "Stage", "Creator Types", "Revenue", "Cost", "GM%", "POD Lead", "Status", "Days", "Urgency", "Actions"].map(h => (
                <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => {
              const flag = getReqFlag(req);
              const stage = req.flow === "sales" ? req.salesData?.opportunityStage || "" : req.hiringData?.opportunityStage || "";
              return (
                <tr key={req.id} className={`data-table-row ${flag === "red" ? "bg-destructive/5" : flag === "yellow" ? "bg-warning/5" : ""}`}>
                  <td className="py-3 font-mono text-muted-foreground pr-3">
                    {flag && <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${flag === "red" ? "bg-destructive" : "bg-warning"}`} />}
                    {req.id}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    <button onClick={() => { setSelectedReq(req); setUpdateDialogOpen(false); setReviewDialogOpen(false); setAssignDialogOpen(false); }}
                      className="font-medium text-primary hover:underline">
                      {getClientName(req)}
                    </button>
                  </td>
                  <td className="py-3 font-mono text-muted-foreground pr-3">{getDealId(req)}</td>
                  <td className="py-3 pr-3">
                    <span className={`status-badge ${
                      req.flow === "sales" ? "bg-info/15 text-info" :
                      req.flow === "studio" ? "bg-success/15 text-success" :
                      "bg-accent/15 text-accent"
                    }`}>
                      {getFlowLabel(req.flow)}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground pr-3 max-w-[140px] truncate">{stage}</td>
                  <td className="py-3 text-xs text-muted-foreground pr-3 max-w-[140px] truncate">{getCreatorTypes(req)}</td>
                  <td className="py-3 font-mono text-foreground pr-3 whitespace-nowrap">{formatCurrency(req.totalClientRevenue)}</td>
                  <td className="py-3 font-mono text-muted-foreground pr-3 whitespace-nowrap">{formatCurrency(req.totalCreatorCost)}</td>
                  <td className="py-3 pr-3">
                    <span className={`font-mono font-medium text-${getMarginRiskColor(req.grossMarginPercent, req.targetMarginPercent)}`}>
                      {req.grossMarginPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground pr-3 whitespace-nowrap">{req.podLeadAssigned || "—"}</td>
                  <td className="py-3 pr-3"><StatusBadge status={req.status} /></td>
                  <td className="py-3 font-mono text-muted-foreground pr-3">{daysOpen(req.createdAt)}</td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{getUrgencyDisplay(req)}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {req.status === "RMG approval Pending" && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openReview(req)}>Review</Button>
                      )}
                      {req.status === "Approved but not assigned" && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openAssign(req)}>Assign</Button>
                      )}
                      {(req.status === "In progress") && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openUpdate(req)}>Update</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No requisitions found</p>}
      </div>

      {/* Detail View — shown when client name is clicked */}
      {selectedReq && !reviewDialogOpen && !assignDialogOpen && !updateDialogOpen && !flagsDialogOpen && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{selectedReq.id} — {getClientName(selectedReq)}</CardTitle>
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
                  <div><span className="text-muted-foreground">POD Lead:</span><p className="font-medium">{selectedReq.podLeadAssigned || "—"}</p></div>
                  <div><span className="text-muted-foreground">Recruiter:</span><p className="font-medium">{selectedReq.recruiterAssigned || "—"}</p></div>
                  {selectedReq.linkedInRecruiterLink && (
                    <div><span className="text-muted-foreground">LinkedIn Project:</span>
                      <a href={selectedReq.linkedInRecruiterLink} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm">
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    </div>
                  )}
                  {selectedReq.atsSheetLink && (
                    <div><span className="text-muted-foreground">ATS/Sheet:</span>
                      <a href={selectedReq.atsSheetLink} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm">
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
                {selectedReq.flow !== "sales" && selectedReq.hiringData?.clientDetails && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border text-sm">
                    <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">Client Details</p>
                    <p className="text-foreground">{selectedReq.hiringData.clientDetails}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="financials" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono">Revenue</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedReq.totalClientRevenue)}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono">Cost</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedReq.totalCreatorCost)}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono">Margin</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedReq.grossMargin)}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono">GM%</p>
                    <p className={`font-mono font-semibold mt-1 text-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}`}>
                      {selectedReq.grossMarginPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono">Risk</p>
                    <div className={`mt-1 status-badge bg-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}/15 text-${getMarginRiskColor(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)} mx-auto`}>
                      {getMarginRiskLabel(selectedReq.grossMarginPercent, selectedReq.targetMarginPercent)}
                    </div>
                  </div>
                </div>
                {selectedReq.flow !== "sales" && selectedReq.hiringData && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Creator Type", "#", "Experience", "Pay Model", "Unit Price", "Unit Margin %", "Risk"].map(h => (
                            <th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-3 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReq.hiringData.lineItems.map(li => (
                          <tr key={li.id} className="data-table-row">
                            <td className="py-2 pr-3 text-xs">{li.creatorType === "Other" ? li.otherCreatorTypeSpec : li.creatorType}</td>
                            <td className="py-2 pr-3 font-mono">{li.numberOfCreators}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{li.experienceLevel}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{li.paymentModel}</td>
                            <td className="py-2 pr-3 font-mono">{formatCurrency(li.unitPrice)}</td>
                            <td className="py-2 pr-3 font-mono">{li.targetUnitMargin}%</td>
                            <td className="py-2 pr-3">
                              <span className={`status-badge bg-${getMarginRiskColor(li.grossMarginPercent, li.targetUnitMargin)}/15 text-${getMarginRiskColor(li.grossMarginPercent, li.targetUnitMargin)}`}>
                                {getMarginRiskLabel(li.grossMarginPercent, li.targetUnitMargin)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
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
                      return (
                        <div className="space-y-3">
                          {todayUpdates.map(du => (
                            <div key={du.id} className="p-3 rounded-md bg-muted/30 border border-border text-sm space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{du.recruiterName}</span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs">
                                <span>Identified: <strong>{du.profilesIdentified}</strong></span>
                                <span>Contacted: <strong>{du.profilesContacted}</strong></span>
                                <span>Screened: <strong>{du.profilesScreened}</strong></span>
                                <span>Shared: <strong>{du.profilesShared}</strong></span>
                                <span>Interviews: <strong>{du.interviewsScheduled}</strong></span>
                                <span>Offers: <strong>{du.offersRolledOut}</strong></span>
                                <span>Selected: <strong>{du.selected}</strong></span>
                                <span>Drop-offs: <strong>{du.dropOffs}</strong></span>
                              </div>
                              {du.blockers && <p className="text-xs text-destructive">Blockers: {du.blockers}</p>}
                              {du.notes && <p className="text-xs text-muted-foreground">{du.notes}</p>}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="funnel">
                    {selectedReq.dailyUpdates.length > 0 ? (
                      <>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
                          {Object.entries(getCumulativeMetrics(selectedReq)).map(([k, v]) => (
                            <div key={k} className="stat-card text-center p-3">
                              <p className="text-[10px] text-muted-foreground font-mono uppercase">{k}</p>
                              <p className="font-mono font-semibold mt-1">{v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          {[...selectedReq.dailyUpdates].reverse().map(du => (
                            <div key={du.id} className="p-3 rounded-md bg-muted/30 border border-border text-sm space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-muted-foreground">{du.date}</span>
                                <span className="text-xs text-muted-foreground">{du.recruiterName}</span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs">
                                <span>Identified: <strong>{du.profilesIdentified}</strong></span>
                                <span>Contacted: <strong>{du.profilesContacted}</strong></span>
                                <span>Screened: <strong>{du.profilesScreened}</strong></span>
                                <span>Shared: <strong>{du.profilesShared}</strong></span>
                                <span>Interviews: <strong>{du.interviewsScheduled}</strong></span>
                                <span>Offers: <strong>{du.offersRolledOut}</strong></span>
                                <span>Selected: <strong>{du.selected}</strong></span>
                                <span>Drop-offs: <strong>{du.dropOffs}</strong></span>
                              </div>
                              {du.blockers && <p className="text-xs text-destructive">Blockers: {du.blockers}</p>}
                              {du.notes && <p className="text-xs text-muted-foreground">{du.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No daily updates yet</p>
                    )}
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
            {flaggedReqs.length === 0 && <p className="text-muted-foreground text-sm">No flagged requisitions</p>}
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
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="bg-background border-border" placeholder="Add notes..." />
            </div>
            <div className="space-y-2">
              <Label>Rejection Reason (required if rejecting)</Label>
              <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-background border-border" placeholder="Why is this being scrapped?" />
            </div>
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
              <Label>Hiring POC / Recruiter</Label>
              <Select value={assignRecruiter} onValueChange={setAssignRecruiter}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{recruiters.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input value={newRecruiter} onChange={e => setNewRecruiter(e.target.value)} placeholder="Add new recruiter..." className="bg-background border-border h-8 text-xs" />
                <Button variant="outline" size="sm" onClick={addRecruiterOption} className="h-8 text-xs">Add</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Closure Date</Label>
              <Input type="date" value={assignTargetDate} onChange={e => setAssignTargetDate(e.target.value)} className="bg-background border-border" />
            </div>
            <Button onClick={handleAssign} className="w-full">Assign & Start</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Dialog — LinkedIn, ATS, Daily Updates */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Update — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            {/* Links section */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project Links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">LinkedIn Recruiter Link</Label>
                  <Input value={updateLinkedIn} onChange={e => setUpdateLinkedIn(e.target.value)} placeholder="https://linkedin.com/recruiter/..." className="bg-background border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ATS / Sheet Link</Label>
                  <Input value={updateAtsLink} onChange={e => setUpdateAtsLink(e.target.value)} placeholder="https://..." className="bg-background border-border" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSaveLinks}>Save Links</Button>
            </div>

            <div className="border-t border-border" />

            {/* Daily Update Entry */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Log Daily Update</p>
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
                  <div key={f.label} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input type="number" min={0} value={f.value} onChange={e => f.setter(Number(e.target.value))} className="bg-background border-border h-9" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Blockers</Label>
                <Input value={duBlockers} onChange={e => setDuBlockers(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Notes</Label>
                <Textarea value={duNotes} onChange={e => setDuNotes(e.target.value)} className="bg-background border-border" />
              </div>
              <Button onClick={handleDailyUpdate} className="w-full">Submit Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisitionsAdvanced;
