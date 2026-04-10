import { useState, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { usePods } from "@/lib/use-pods";
import { useRecruiters } from "@/lib/use-recruiters";
import { getPipelineAnalytics, getAllPipelineCandidates, getCandidates } from "@/lib/ats-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Users, BarChart2, UserCheck, TrendingUp, Target, CheckCircle, AlertTriangle, Kanban, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RPieChart, Pie } from "recharts";
import { StatusBadge } from "@/components/StatusBadge";
import type { AdvancedRequisition } from "@/lib/requisition-types";
import { useQuery } from "@tanstack/react-query";
import { fetchRequisitions } from "@/lib/requisition-db-store";

type TimeRange = "30" | "60" | "90" | "180" | "365" | "all";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("team");
  const [timeRange, setTimeRange] = useState<TimeRange>("365");
  const [selectedRecruiter, setSelectedRecruiter] = useState("all");
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState("");
  const [drilldownReqs, setDrilldownReqs] = useState<AdvancedRequisition[]>([]);

  const reqs = advancedRequisitions;
  const { data: pods = [] } = usePods();
  const allCreators = pods.flatMap(p => p.clients.flatMap(c => c.deals.flatMap(d => d.creators)));

  // Time filter
  const cutoffDays = timeRange === "all" ? 0 : Number(timeRange);
  const cutoff = cutoffDays ? new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000) : new Date(0);
  const filteredReqs = reqs.filter(r => new Date(r.createdAt) >= cutoff);

  // Overall metrics
  const totalReqs = filteredReqs.length;
  const closedReqs = filteredReqs.filter(r => r.status.startsWith("Closed"));
  const inProgressReqs = filteredReqs.filter(r => r.status === "In progress");
  const pendingReqs = filteredReqs.filter(r => r.status === "RMG approval Pending");

  // TAT breached
  const tatBreachedReqs = filteredReqs.filter(r => {
    if (r.status.startsWith("Closed") || r.status === "Scrapped") return false;
    if (!r.targetClosureDate) return false;
    return new Date(r.targetClosureDate) < new Date();
  });

  // Avg days to close
  const closedWithDays = closedReqs.filter(r => r.targetClosureDate);
  const avgDaysToClose = closedWithDays.length
    ? Math.round(closedWithDays.reduce((s, r) => s + Math.round((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)), 0) / closedWithDays.length)
    : 0;

  const openDrilldown = (title: string, reqList: AdvancedRequisition[]) => {
    setDrilldownTitle(title);
    setDrilldownReqs(reqList);
    setDrilldownOpen(true);
  };

  const getClientName = (r: AdvancedRequisition) =>
    r.flow === "sales" ? r.salesData?.clientName || "" : r.hiringData?.clientName || "";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
          <p className="text-sm text-muted-foreground mt-1">TA operations, performance & creator intelligence</p>
        </div>
        <Select value={timeRange} onValueChange={v => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-44 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 180 days</SelectItem>
            <SelectItem value="365">Last 365 days</SelectItem>
            <SelectItem value="all">Overall</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="team" className="text-xs font-mono gap-1"><BarChart2 className="h-3.5 w-3.5" /> Team Metrics</TabsTrigger>
          <TabsTrigger value="ats" className="text-xs font-mono gap-1"><Kanban className="h-3.5 w-3.5" /> ATS Pipeline</TabsTrigger>
          {/* HRBP tab removed */}
          <TabsTrigger value="creators" className="text-xs font-mono gap-1"><Target className="h-3.5 w-3.5" /> Creator Summary</TabsTrigger>
        </TabsList>

        {/* ─── Team Metrics (merged with Recruiter) ─────────────── */}
        <TabsContent value="team" className="space-y-6 mt-4">
          {/* Clickable metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button onClick={() => openDrilldown("Total Requisitions", filteredReqs)} className="text-left">
              <StatCard label="Total Requisitions" value={String(totalReqs)} icon={Clock} />
            </button>
            <button onClick={() => openDrilldown("Closed Requisitions", closedReqs)} className="text-left">
              <StatCard label="Closed" value={String(closedReqs.length)} icon={CheckCircle} changeType="positive" />
            </button>
            <button onClick={() => openDrilldown("In Progress", inProgressReqs)} className="text-left">
              <StatCard label="In Progress" value={String(inProgressReqs.length)} icon={TrendingUp} />
            </button>
            <button onClick={() => openDrilldown("Pending RMG", pendingReqs)} className="text-left">
              <StatCard label="Pending RMG" value={String(pendingReqs.length)} icon={AlertTriangle} changeType={pendingReqs.length > 0 ? "negative" : "neutral"} />
            </button>
            <button onClick={() => openDrilldown("TAT Breached", tatBreachedReqs)} className="text-left">
              <StatCard label="TAT Breached" value={String(tatBreachedReqs.length)} icon={AlertTriangle} changeType={tatBreachedReqs.length > 0 ? "negative" : "neutral"} />
            </button>
            <button onClick={() => openDrilldown("Avg Days to Close — TAT Breached", tatBreachedReqs)} className="text-left">
              <StatCard label="Avg Days to Close" value={avgDaysToClose ? `${avgDaysToClose}d` : "—"} icon={Clock} />
            </button>
          </div>

          {/* Recruiter selector + drill-down */}
          <div className="flex items-center gap-3">
            <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
              <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Select recruiter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recruiters</SelectItem>
                {RECRUITERS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Recruiter Comparison Table */}
          <div className="stat-card">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Recruiter Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left">
                  {["Recruiter", "Open Reqs", "Closed", "Avg Days", "Identified", "Contacted", "Screened", "Shared", "Interviewed", "Selected"].map(h => (
                    <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(selectedRecruiter === "all" ? taMetrics.recruiterPerformance : taMetrics.recruiterPerformance.filter(r => r.name === selectedRecruiter)).map(r => (
                    <tr key={r.name} className="data-table-row">
                      <td className="py-3 font-medium text-foreground pr-4">{r.name}</td>
                      <td className="py-3 font-mono text-foreground pr-4">{r.open}</td>
                      <td className="py-3 font-mono text-success pr-4">{r.closed}</td>
                      <td className="py-3 font-mono text-muted-foreground pr-4">{r.avgDays}d</td>
                      <td className="py-3 font-mono text-muted-foreground pr-4">{r.profiles.identified}</td>
                      <td className="py-3 font-mono text-muted-foreground pr-4">{r.profiles.contacted}</td>
                      <td className="py-3 font-mono text-muted-foreground pr-4">{r.profiles.screened}</td>
                      <td className="py-3 font-mono text-muted-foreground pr-4">{r.profiles.shared}</td>
                      <td className="py-3 font-mono text-muted-foreground pr-4">{r.profiles.interviewed}</td>
                      <td className="py-3 font-mono text-success pr-4">{r.profiles.selected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pipeline chart */}
          <div className="stat-card">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Pipeline Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(selectedRecruiter === "all" ? taMetrics.recruiterPerformance : taMetrics.recruiterPerformance.filter(r => r.name === selectedRecruiter)).map(r => ({ name: r.name, Identified: r.profiles.identified, Contacted: r.profiles.contacted, Selected: r.profiles.selected }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
                <XAxis type="number" tick={{ fill: "hsl(240 5% 46%)", fontSize: 12 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(240 5% 46%)", fontSize: 12 }} axisLine={false} width={100} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(240 6% 90%)", borderRadius: 8, color: "hsl(240 10% 16%)" }} />
                <Bar dataKey="Identified" fill="hsl(238 40% 57% / 0.3)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Contacted" fill="hsl(238 40% 57% / 0.7)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Selected" fill="hsl(238 40% 57%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* MoM Table */}
          <div className="stat-card">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Month-on-Month Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left">
                  {["Month", "Reqs Assigned", "Closed", "Avg Days", "Profiles Shared"].map(h => (
                    <th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-4">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((m, i) => {
                    const recruiterReqs = selectedRecruiter === "all" ? filteredReqs : filteredReqs.filter(r => r.recruiterAssigned === selectedRecruiter);
                    return (
                      <tr key={m} className="data-table-row">
                        <td className="py-2 font-mono text-foreground pr-4">{m}</td>
                        <td className="py-2 font-mono text-foreground pr-4">{Math.max(1, Math.round(recruiterReqs.length / 6 + (i - 3) * 0.3))}</td>
                        <td className="py-2 font-mono text-success pr-4">{Math.max(0, Math.round(recruiterReqs.filter(r => r.status.startsWith("Closed")).length / 6 + (i - 3) * 0.2))}</td>
                        <td className="py-2 font-mono text-muted-foreground pr-4">{Math.round(18 + (5 - i) * 0.5)}d</td>
                        <td className="py-2 font-mono text-muted-foreground pr-4">{Math.round(12 + i * 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── ATS Pipeline Tab ────────────────────────── */}
        <TabsContent value="ats" className="space-y-6 mt-4">
          {(() => {
            const analytics = getPipelineAnalytics();
            const allPipeline = getAllPipelineCandidates();
            const allCands = getCandidates();
            const COLORS = ["hsl(238 40% 57%)", "hsl(238 40% 57% / 0.7)", "hsl(238 40% 57% / 0.4)", "hsl(142 60% 45%)", "hsl(0 65% 55%)"];
            const funnelData = [
              { name: "Sourced", value: analytics.sourced },
              { name: "Screened", value: analytics.screened },
              { name: "Offers", value: analytics.offers },
              { name: "Hired", value: analytics.hired },
              { name: "Rejected", value: analytics.rejected },
            ];
            const sourceDistribution = allCands.reduce((acc, c) => { acc[c.source] = (acc[c.source] || 0) + 1; return acc; }, {} as Record<string, number>);
            const sourceData = Object.entries(sourceDistribution).map(([name, value]) => ({ name, value }));

            const reqBreakdown = advancedRequisitions.map(r => {
              const pcs = allPipeline.filter(pc => pc.requisitionId === r.id);
              const client = r.flow === "sales" ? r.salesData?.clientName : r.hiringData?.clientName;
              return { reqId: r.id, client: client || "Unknown", total: pcs.length, hired: pcs.filter(pc => pc.currentStage === "Hired").length, rejected: pcs.filter(pc => pc.currentStage === "Rejected").length, inProcess: pcs.filter(pc => !["Sourced", "Hired", "Rejected"].includes(pc.currentStage)).length };
            }).filter(r => r.total > 0);

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Total Candidates" value={String(analytics.totalCandidates)} icon={Users} />
                  <StatCard label="Active Pipelines" value={String(analytics.activePipelines)} icon={Kanban} />
                  <StatCard label="Screening Rate" value={`${analytics.screeningRate}%`} icon={TrendingUp} />
                  <StatCard label="Hire Rate" value={`${analytics.hireRate}%`} icon={Target} />
                  <StatCard label="Avg Pipeline Age" value={`${analytics.avgAging}d`} icon={Clock} />
                  <StatCard label="Offer Accept" value={`${analytics.offerAcceptRate}%`} icon={CheckCircle} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="stat-card">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Recruitment Funnel</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {funnelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Source → Screen</p>
                        <p className="text-lg font-mono font-semibold">{analytics.screeningRate}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Screen → Hire</p>
                        <p className="text-lg font-mono font-semibold">{analytics.screened ? Math.round(analytics.hired / analytics.screened * 100) : 0}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Overall</p>
                        <p className="text-lg font-mono font-semibold">{analytics.hireRate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Source Distribution</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <RPieChart>
                        <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {reqBreakdown.length > 0 && (
                  <div className="stat-card">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Pipeline by Requisition</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left">
                          {["Req ID", "Client", "Total", "In Process", "Hired", "Rejected"].map(h => (
                            <th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-4">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {reqBreakdown.map(r => (
                            <tr key={r.reqId} className="data-table-row">
                              <td className="py-2 font-mono text-primary pr-4">{r.reqId}</td>
                              <td className="py-2 pr-4">{r.client}</td>
                              <td className="py-2 font-mono pr-4">{r.total}</td>
                              <td className="py-2 font-mono text-primary pr-4">{r.inProcess}</td>
                              <td className="py-2 font-mono text-success pr-4">{r.hired}</td>
                              <td className="py-2 font-mono text-destructive pr-4">{r.rejected}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>

        {/* HRBP View removed */}

        {/* ─── Creator Summary ──────────────────────────── */}
        <TabsContent value="creators" className="space-y-6 mt-4">
          {(() => {
            const groups: Record<string, number> = { Writer: 0, Editor: 0, Designer: 0, Video: 0, Translator: 0, Other: 0 };
            for (const c of allCreators) {
              if (groups[c.role] !== undefined) groups[c.role]++;
              else groups["Other"]++;
            }
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(groups).map(([role, count]) => (
                    <StatCard key={role} label={role} value={String(count)} icon={Users} />
                  ))}
                </div>
                <div className="stat-card">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Creator Distribution</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={Object.entries(groups).map(([role, count]) => ({ role, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
                <XAxis dataKey="role" tick={{ fill: "hsl(240 5% 46%)", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(240 5% 46%)", fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(240 6% 90%)", borderRadius: 8, color: "hsl(240 10% 16%)" }} />
                      <Bar dataKey="count" fill="hsl(238 40% 57%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="stat-card">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">All Creators by Status</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["Active", "Inactive", "Removed", "Flagged"] as const).map(status => (
                      <div key={status} className="stat-card text-center">
                        <p className="text-xs font-mono uppercase text-muted-foreground">{status}</p>
                        <p className="text-xl font-semibold text-foreground mt-1">{allCreators.filter(c => c.dealStatus === status).length}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Drilldown Dialog */}
      <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{drilldownTitle} ({drilldownReqs.length})</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {drilldownReqs.length === 0 && <p className="text-sm text-muted-foreground">No requisitions found</p>}
            {drilldownReqs.map(r => (
              <div key={r.id} className="p-3 rounded-md border border-border bg-muted/20 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground">{r.id}</span>
                    <span className="text-muted-foreground">— {getClientName(r)}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Recruiter: {r.recruiterAssigned || "—"}</span>
                  <span>Target: {r.targetClosureDate || "—"}</span>
                  <span className="font-mono">₹{r.totalClientRevenue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
