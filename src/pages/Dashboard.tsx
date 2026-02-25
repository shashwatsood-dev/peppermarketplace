import { useState, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { getPods, type DeployedCreatorV2 } from "@/lib/talent-client-store";
import { taMetrics } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Users, BarChart2, UserCheck, TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const RECRUITERS = taMetrics.recruiterPerformance.map(r => r.name);

const Dashboard = () => {
  const [activeView, setActiveView] = useState("recruiter");
  const [timeRange, setTimeRange] = useState<"365" | "all">("365");
  const [selectedRecruiter, setSelectedRecruiter] = useState("all");

  const reqs = advancedRequisitions;
  const pods = getPods();
  const allCreators = pods.flatMap(p => p.clients.flatMap(c => c.deals.flatMap(d => d.creators)));

  // Time filter
  const cutoff = timeRange === "365" ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) : new Date(0);
  const filteredReqs = reqs.filter(r => new Date(r.createdAt) >= cutoff);

  // Overall metrics
  const totalReqs = filteredReqs.length;
  const closedReqs = filteredReqs.filter(r => r.status.startsWith("Closed")).length;
  const inProgressReqs = filteredReqs.filter(r => r.status === "In progress").length;
  const pendingReqs = filteredReqs.filter(r => r.status === "RMG approval Pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">TA operations, performance & creator intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={v => setTimeRange(v as any)}>
            <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="365">Last 365 days</SelectItem>
              <SelectItem value="all">Since the start</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="recruiter" className="text-xs font-mono gap-1"><UserCheck className="h-3.5 w-3.5" /> Recruiter</TabsTrigger>
          <TabsTrigger value="hrbp" className="text-xs font-mono gap-1"><Users className="h-3.5 w-3.5" /> HRBP</TabsTrigger>
          <TabsTrigger value="team" className="text-xs font-mono gap-1"><BarChart2 className="h-3.5 w-3.5" /> Team Metrics</TabsTrigger>
          <TabsTrigger value="creators" className="text-xs font-mono gap-1"><Target className="h-3.5 w-3.5" /> Creator Summary</TabsTrigger>
        </TabsList>

        {/* ─── Recruiter View ───────────────────────────── */}
        <TabsContent value="recruiter" className="space-y-6 mt-4">
          <div className="flex items-center gap-3">
            <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
              <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Select recruiter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recruiters</SelectItem>
                {RECRUITERS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {(() => {
            const recruiterReqs = selectedRecruiter === "all" ? filteredReqs : filteredReqs.filter(r => r.recruiterAssigned === selectedRecruiter);
            const recruiterData = selectedRecruiter === "all"
              ? taMetrics.recruiterPerformance
              : taMetrics.recruiterPerformance.filter(r => r.name === selectedRecruiter);

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Total Requisitions" value={String(recruiterReqs.length)} icon={Clock} />
                  <StatCard label="Closed" value={String(recruiterReqs.filter(r => r.status.startsWith("Closed")).length)} icon={CheckCircle} changeType="positive" />
                  <StatCard label="In Progress" value={String(recruiterReqs.filter(r => r.status === "In progress").length)} icon={TrendingUp} />
                  <StatCard label="Avg Days to Close" value={recruiterData.length ? `${Math.round(recruiterData.reduce((s, r) => s + r.avgDays, 0) / recruiterData.length)}d` : "—"} icon={Clock} />
                </div>

                {/* Pipeline funnel */}
                <div className="stat-card">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Pipeline Funnel</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={recruiterData.map(r => ({ name: r.name, Identified: r.profiles.identified, Contacted: r.profiles.contacted, Screened: r.profiles.screened, Shared: r.profiles.shared, Interviewed: r.profiles.interviewed, Selected: r.profiles.selected }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                      <XAxis type="number" tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} width={100} />
                      <Tooltip contentStyle={{ background: "hsl(220 18% 9%)", border: "1px solid hsl(220 14% 14%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
                      <Bar dataKey="Identified" fill="hsl(220 14% 25%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Contacted" fill="hsl(210 80% 55%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Screened" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Selected" fill="hsl(160 60% 45%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Month-on-Month mock */}
                <div className="stat-card">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Month-on-Month Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        {["Month", "Reqs Assigned", "Closed", "Avg Days", "Profiles Shared"].map(h => (
                          <th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-4">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((m, i) => (
                          <tr key={m} className="data-table-row">
                            <td className="py-2 font-mono text-foreground pr-4">{m}</td>
                            <td className="py-2 font-mono text-foreground pr-4">{Math.max(1, Math.round(recruiterReqs.length / 6 + (i - 3) * 0.3))}</td>
                            <td className="py-2 font-mono text-success pr-4">{Math.max(0, Math.round(recruiterReqs.filter(r => r.status.startsWith("Closed")).length / 6 + (i - 3) * 0.2))}</td>
                            <td className="py-2 font-mono text-muted-foreground pr-4">{Math.round(18 + (5 - i) * 0.5)}d</td>
                            <td className="py-2 font-mono text-muted-foreground pr-4">{Math.round(12 + i * 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* ─── HRBP View ────────────────────────────────── */}
        <TabsContent value="hrbp" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Creators with HRBP" value={String(allCreators.filter(c => c.hrbpName).length)} icon={Users} />
            <StatCard label="Total Connects" value={String(allCreators.reduce((s, c) => s + c.hrbpConnects.length, 0))} icon={UserCheck} />
            <StatCard label="Without HRBP" value={String(allCreators.filter(c => !c.hrbpName).length)} icon={AlertTriangle} changeType="negative" />
          </div>

          <div className="stat-card">
            <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Recent HRBP Connects</h3>
            <div className="space-y-2">
              {allCreators
                .flatMap(c => c.hrbpConnects.map(conn => ({ ...conn, creatorName: c.creatorName })))
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 10)
                .map(conn => (
                  <div key={conn.id} className="p-3 rounded bg-muted/30 border border-border text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{conn.creatorName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{conn.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{conn.summary}</p>
                    {conn.outcome && <p className="text-xs text-success mt-1">→ {conn.outcome}</p>}
                  </div>
                ))}
              {allCreators.every(c => c.hrbpConnects.length === 0) && (
                <p className="text-sm text-muted-foreground">No HRBP connects logged yet. Add connects from the Studio Dashboard.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── Team Metrics ─────────────────────────────── */}
        <TabsContent value="team" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Requisitions" value={String(totalReqs)} icon={Clock} />
            <StatCard label="Closed" value={String(closedReqs)} icon={CheckCircle} changeType="positive" />
            <StatCard label="In Progress" value={String(inProgressReqs)} icon={TrendingUp} />
            <StatCard label="Pending RMG" value={String(pendingReqs)} icon={AlertTriangle} changeType={pendingReqs > 0 ? "negative" : "neutral"} />
          </div>

          {/* Comparative */}
          <div className="stat-card">
            <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Recruiter Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left">
                  {["Recruiter", "Open Reqs", "Closed", "Avg Days", "Identified", "Contacted", "Screened", "Shared", "Interviewed", "Selected"].map(h => (
                    <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {taMetrics.recruiterPerformance.map(r => (
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

          {/* Funnel chart comparison */}
          <div className="stat-card">
            <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Pipeline Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taMetrics.recruiterPerformance.map(r => ({ name: r.name, Identified: r.profiles.identified, Contacted: r.profiles.contacted, Selected: r.profiles.selected }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                <XAxis type="number" tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} width={100} />
                <Tooltip contentStyle={{ background: "hsl(220 18% 9%)", border: "1px solid hsl(220 14% 14%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
                <Bar dataKey="Identified" fill="hsl(220 14% 25%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Contacted" fill="hsl(210 80% 55%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Selected" fill="hsl(160 60% 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

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
                  <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Creator Distribution</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={Object.entries(groups).map(([role, count]) => ({ role, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                      <XAxis dataKey="role" tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} />
                      <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} />
                      <Tooltip contentStyle={{ background: "hsl(220 18% 9%)", border: "1px solid hsl(220 14% 14%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
                      <Bar dataKey="count" fill="hsl(160 60% 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="stat-card">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">All Creators by Status</h3>
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
    </div>
  );
};

export default Dashboard;
