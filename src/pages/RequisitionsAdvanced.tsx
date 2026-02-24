import { useState } from "react";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { URGENCY_LEVELS, getMarginRiskColor, getMarginRiskLabel } from "@/lib/requisition-types";
import type { AdvancedRequisition } from "@/lib/requisition-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formatCurrency = (n: number) => "₹" + n.toLocaleString("en-IN");

const RequisitionsAdvanced = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [reqs, setReqs] = useState(advancedRequisitions);
  const [selectedReq, setSelectedReq] = useState<AdvancedRequisition | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [dailyUpdateDialogOpen, setDailyUpdateDialogOpen] = useState(false);

  // Review state
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Assignment state
  const [assignTAManager, setAssignTAManager] = useState("");
  const [assignRecruiter, setAssignRecruiter] = useState("");
  const [assignLinkedIn, setAssignLinkedIn] = useState("");
  const [assignTargetDate, setAssignTargetDate] = useState("");

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
    r.flow === "sales" ? r.salesData?.clientName || "" : r.vsdData?.clientName || "";

  const getDealId = (r: AdvancedRequisition) =>
    r.flow === "vsd" ? r.vsdData?.dealId || "—" : "Pre-Deal";

  const getUrgency = (r: AdvancedRequisition) =>
    r.flow === "sales" ? r.salesData?.urgency || "" : r.vsdData?.urgency || "";

  const getCreatorTypes = (r: AdvancedRequisition) => {
    if (r.flow === "sales") return r.salesData?.specificResourceTypes?.join(", ") || "—";
    return r.vsdData?.lineItems.flatMap(li => li.creatorTypes).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "—";
  };

  const getStudioType = (r: AdvancedRequisition) =>
    r.flow === "vsd" ? r.vsdData?.studioType || "—" : "—";

  const getStage = (r: AdvancedRequisition) =>
    r.flow === "sales" ? r.salesData?.opportunityStage || "" : r.vsdData?.opportunityStage || "";

  const filtered = reqs.filter((r) => {
    const client = getClientName(r).toLowerCase();
    const matchSearch = client.includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchUrgency = urgencyFilter === "all" || getUrgency(r) === urgencyFilter;
    return matchSearch && matchStatus && matchUrgency;
  });

  // Alerts
  const alerts: { msg: string; type: "warning" | "error" }[] = [];
  reqs.forEach(r => {
    if (r.grossMarginPercent < r.targetMarginPercent) {
      alerts.push({ msg: `${r.id}: Margin ${r.grossMarginPercent.toFixed(1)}% below target ${r.targetMarginPercent}%`, type: "error" });
    }
    if (r.flow === "vsd" && r.vsdData?.deadlineToClose) {
      const deadline = new Date(r.vsdData.deadlineToClose);
      if (deadline < new Date() && !r.status.startsWith("Closed")) {
        alerts.push({ msg: `${r.id}: Past SLA deadline (${r.vsdData.deadlineToClose})`, type: "error" });
      }
    }
    if (r.status === "In Progress" && r.dailyUpdates.length > 0) {
      const lastUpdate = new Date(r.dailyUpdates[r.dailyUpdates.length - 1].date);
      const hoursSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 48) {
        alerts.push({ msg: `${r.id}: No daily update for ${Math.round(hoursSince)}h`, type: "warning" });
      }
    }
  });

  const daysOpen = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const handleApprove = () => {
    if (!selectedReq) return;
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "Approved – Assigning" as const, headOfSupplyNotes: reviewNotes,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "Approved – Assigning", editedBy: "Head of Supply", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Requisition approved");
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    if (!selectedReq || !rejectionReason) { toast.error("Rejection reason required"); return; }
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "Rejected" as const, rejectionReason, headOfSupplyNotes: reviewNotes,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "Rejected", editedBy: "Head of Supply", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Requisition rejected");
    setReviewDialogOpen(false);
  };

  const handleAssign = () => {
    if (!selectedReq || !assignTAManager) { toast.error("TA Manager required"); return; }
    setReqs(prev => prev.map(r => r.id === selectedReq.id ? {
      ...r, status: "In Progress" as const, taManagerAssigned: assignTAManager, recruiterAssigned: assignRecruiter,
      linkedInRecruiterLink: assignLinkedIn, targetClosureDate: assignTargetDate,
      auditLog: [...r.auditLog, { id: crypto.randomUUID(), fieldChanged: "status", oldValue: r.status, newValue: "In Progress", editedBy: "Head of Supply", timestamp: new Date().toISOString() }]
    } : r));
    toast.success("Assigned to TA Manager");
    setAssignDialogOpen(false);
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
    setDailyUpdateDialogOpen(false);
    // Reset
    setDuProfilesIdentified(0); setDuProfilesContacted(0); setDuProfilesScreened(0); setDuProfilesShared(0);
    setDuInterviews(0); setDuOffers(0); setDuSelected(0); setDuDropOffs(0); setDuBlockers(""); setDuNotes("");
  };

  const openReview = (r: AdvancedRequisition) => { setSelectedReq(r); setReviewNotes(r.headOfSupplyNotes); setRejectionReason(""); setReviewDialogOpen(true); };
  const openAssign = (r: AdvancedRequisition) => { setSelectedReq(r); setAssignTAManager(r.taManagerAssigned); setAssignRecruiter(r.recruiterAssigned); setAssignLinkedIn(r.linkedInRecruiterLink); setAssignTargetDate(r.targetClosureDate); setAssignDialogOpen(true); };
  const openDailyUpdate = (r: AdvancedRequisition) => { setSelectedReq(r); setDailyUpdateDialogOpen(true); };

  const statuses = ["all", "Draft", "Submitted", "Pending Head of Supply Review", "Rejected", "Approved – Assigning", "In Progress", "Shortlisting", "Client Interview", "Closed – Filled", "Closed – Dropped"];

  // Cumulative metrics for selected req
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

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs p-2.5 rounded-md border ${
              a.type === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-warning/30 bg-warning/5 text-warning"
            }`}>
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {a.msg}
            </div>
          ))}
        </div>
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
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgencies</SelectItem>
            {URGENCY_LEVELS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: reqs.length },
          { label: "Pending Review", value: reqs.filter(r => r.status === "Pending Head of Supply Review").length },
          { label: "In Progress", value: reqs.filter(r => r.status === "In Progress" || r.status === "Shortlisting").length },
          { label: "Closed", value: reqs.filter(r => r.status.startsWith("Closed")).length },
          { label: "At Risk", value: reqs.filter(r => r.grossMarginPercent < r.targetMarginPercent).length },
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
              {["ID", "Client", "Deal ID", "Flow", "Stage", "Studio", "Creator Types", "Revenue", "Cost", "GM%", "TA Manager", "Status", "Days", "Urgency", "Actions"].map(h => (
                <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => {
              const urgency = getUrgency(req);
              const urgencyObj = URGENCY_LEVELS.find(u => u.value === urgency);
              return (
                <tr key={req.id} className="data-table-row">
                  <td className="py-3 font-mono text-muted-foreground pr-3">{req.id}</td>
                  <td className="py-3 font-medium text-foreground pr-3 whitespace-nowrap">{getClientName(req)}</td>
                  <td className="py-3 font-mono text-muted-foreground pr-3">{getDealId(req)}</td>
                  <td className="py-3 pr-3">
                    <span className={`status-badge ${req.flow === "sales" ? "bg-info/15 text-info" : "bg-success/15 text-success"}`}>
                      {req.flow === "sales" ? "Sales" : "VSD"}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground pr-3 max-w-[140px] truncate">{getStage(req)}</td>
                  <td className="py-3 pr-3"><span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{getStudioType(req)}</span></td>
                  <td className="py-3 text-xs text-muted-foreground pr-3 max-w-[140px] truncate">{getCreatorTypes(req)}</td>
                  <td className="py-3 font-mono text-foreground pr-3 whitespace-nowrap">{formatCurrency(req.totalClientRevenue)}</td>
                  <td className="py-3 font-mono text-muted-foreground pr-3 whitespace-nowrap">{formatCurrency(req.totalCreatorCost)}</td>
                  <td className="py-3 pr-3">
                    <span className={`font-mono font-medium text-${getMarginRiskColor(req.grossMarginPercent, req.targetMarginPercent)}`}>
                      {req.grossMarginPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground pr-3 whitespace-nowrap">{req.taManagerAssigned || "—"}</td>
                  <td className="py-3 pr-3"><StatusBadge status={req.status} /></td>
                  <td className="py-3 font-mono text-muted-foreground pr-3">{daysOpen(req.createdAt)}</td>
                  <td className="py-3 pr-3">
                    {urgencyObj && (
                      <span className={`status-badge bg-${urgencyObj.color}/15 text-${urgencyObj.color}`}>{urgencyObj.label.split(" ")[0]}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {req.status === "Pending Head of Supply Review" && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openReview(req)}>Review</Button>
                      )}
                      {req.status === "Approved – Assigning" && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openAssign(req)}>Assign</Button>
                      )}
                      {(req.status === "In Progress" || req.status === "Shortlisting") && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openDailyUpdate(req)}>Update</Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedReq(req)}>View</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No requisitions found</p>}
      </div>

      {/* Detail View */}
      {selectedReq && !reviewDialogOpen && !assignDialogOpen && !dailyUpdateDialogOpen && (
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
                  <div><span className="text-muted-foreground">Department:</span><p className="font-medium">{selectedReq.department}</p></div>
                  <div><span className="text-muted-foreground">Flow:</span><p className="font-medium">{selectedReq.flow === "sales" ? "Sales-led" : "VSD/Account-led"}</p></div>
                  <div><span className="text-muted-foreground">Status:</span><p><StatusBadge status={selectedReq.status} /></p></div>
                  <div><span className="text-muted-foreground">TA Manager:</span><p className="font-medium">{selectedReq.taManagerAssigned || "—"}</p></div>
                  <div><span className="text-muted-foreground">Recruiter:</span><p className="font-medium">{selectedReq.recruiterAssigned || "—"}</p></div>
                  {selectedReq.linkedInRecruiterLink && (
                    <div><span className="text-muted-foreground">LinkedIn Project:</span>
                      <a href={selectedReq.linkedInRecruiterLink} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm">
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    </div>
                  )}
                  <div><span className="text-muted-foreground">Target Close:</span><p className="font-medium">{selectedReq.targetClosureDate || "—"}</p></div>
                </div>
                {selectedReq.headOfSupplyNotes && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border text-sm">
                    <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">Head of Supply Notes</p>
                    <p className="text-foreground">{selectedReq.headOfSupplyNotes}</p>
                  </div>
                )}
                {selectedReq.flow === "vsd" && selectedReq.vsdData?.clientDetails && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border text-sm">
                    <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">Client Details</p>
                    <p className="text-foreground">{selectedReq.vsdData.clientDetails}</p>
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
                {selectedReq.flow === "vsd" && selectedReq.vsdData && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Creator Types", "#", "Experience", "Pay Model", "Client Pay", "Creator Pay", "GM", "GM%", "Target", "Risk"].map(h => (
                            <th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-3 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReq.vsdData.lineItems.map(li => (
                          <tr key={li.id} className="data-table-row">
                            <td className="py-2 pr-3 text-xs">{li.creatorTypes.join(", ")}</td>
                            <td className="py-2 pr-3 font-mono">{li.numberOfCreators}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{li.experienceLevel}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{li.paymentModel}</td>
                            <td className="py-2 pr-3 font-mono">{formatCurrency(li.clientPay)}</td>
                            <td className="py-2 pr-3 font-mono text-muted-foreground">{formatCurrency(li.creatorPay)}</td>
                            <td className="py-2 pr-3 font-mono">{formatCurrency(li.grossMargin)}</td>
                            <td className={`py-2 pr-3 font-mono font-medium text-${getMarginRiskColor(li.grossMarginPercent, li.targetMarginPercent)}`}>
                              {li.grossMarginPercent.toFixed(1)}%
                            </td>
                            <td className="py-2 pr-3 font-mono text-muted-foreground">{li.targetMarginPercent}%</td>
                            <td className="py-2 pr-3">
                              <span className={`status-badge bg-${getMarginRiskColor(li.grossMarginPercent, li.targetMarginPercent)}/15 text-${getMarginRiskColor(li.grossMarginPercent, li.targetMarginPercent)}`}>
                                {getMarginRiskLabel(li.grossMarginPercent, li.targetMarginPercent)}
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
                {selectedReq.dailyUpdates.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
                    {Object.entries(getCumulativeMetrics(selectedReq)).map(([k, v]) => (
                      <div key={k} className="stat-card text-center p-3">
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">{k}</p>
                        <p className="font-mono font-semibold mt-1">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  {selectedReq.dailyUpdates.length === 0 && <p className="text-sm text-muted-foreground">No daily updates yet</p>}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Review Requisition — {selectedReq?.id}</DialogTitle></DialogHeader>
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
              <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-background border-border" placeholder="Why is this being rejected?" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="destructive" onClick={handleReject}>Reject</Button>
              <Button onClick={handleApprove}>Approve</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Assign TA — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>TA Manager *</Label>
              <Select value={assignTAManager} onValueChange={setAssignTAManager}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Neha Gupta">Neha Gupta</SelectItem>
                  <SelectItem value="Ravi Kumar">Ravi Kumar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recruiter</Label>
              <Select value={assignRecruiter} onValueChange={setAssignRecruiter}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Neha Gupta">Neha Gupta</SelectItem>
                  <SelectItem value="Ravi Kumar">Ravi Kumar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>LinkedIn Recruiter Project Link</Label>
              <Input value={assignLinkedIn} onChange={e => setAssignLinkedIn(e.target.value)} placeholder="https://linkedin.com/recruiter/..." className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Target Closure Date</Label>
              <Input type="date" value={assignTargetDate} onChange={e => setAssignTargetDate(e.target.value)} className="bg-background border-border" />
            </div>
            <Button onClick={handleAssign} className="w-full">Assign & Start</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Update Dialog */}
      <Dialog open={dailyUpdateDialogOpen} onOpenChange={setDailyUpdateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Daily Update — {selectedReq?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisitionsAdvanced;
