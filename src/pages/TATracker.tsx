import { taMetrics, requisitions } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Clock, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TATracker = () => {
  const openReqs = requisitions.filter(r => !r.status.startsWith("Closed"));

  const funnelData = taMetrics.recruiterPerformance.map(r => ({
    name: r.name,
    Identified: r.profiles.identified,
    Contacted: r.profiles.contacted,
    Screened: r.profiles.screened,
    Shared: r.profiles.shared,
    Interviewed: r.profiles.interviewed,
    Selected: r.profiles.selected,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">TA Workflow Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Recruiter performance & requisition pipeline</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Requisitions" value={String(taMetrics.openRequisitions)} icon={Clock} />
        <StatCard label="Overdue" value={String(taMetrics.overdueRequisitions)} change="Needs attention" changeType="negative" icon={AlertTriangle} />
        <StatCard label="Avg. Time to Close" value={`${taMetrics.avgTimeToClose} days`} change="-2 days vs last month" changeType="positive" icon={CheckCircle} />
        <StatCard label="Active Recruiters" value={String(taMetrics.recruiterPerformance.length)} icon={Users} />
      </div>

      {/* Recruiter Funnel */}
      <div className="stat-card">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Recruiter Pipeline Funnel</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={funnelData} layout="vertical">
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

      {/* Recruiter Performance Table */}
      <div className="stat-card">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Recruiter Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Recruiter", "Open Reqs", "Closed", "Avg Days", "Identified", "Contacted", "Screened", "Shared", "Interviewed", "Selected"].map(h => (
                  <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taMetrics.recruiterPerformance.map((r) => (
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

      {/* Open Requisitions */}
      <div className="stat-card">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Open Requisitions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["ID", "Deal", "Client", "Recruiter", "Target Close", "Status"].map(h => (
                  <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openReqs.map((req) => (
                <tr key={req.id} className="data-table-row">
                  <td className="py-3 font-mono text-muted-foreground pr-4">{req.id}</td>
                  <td className="py-3 font-medium text-foreground pr-4">{req.dealName}</td>
                  <td className="py-3 text-muted-foreground pr-4">{req.clientName}</td>
                  <td className="py-3 text-muted-foreground pr-4">{req.assignedRecruiter || "—"}</td>
                  <td className="py-3 font-mono text-muted-foreground pr-4">{req.targetCloseDate || "—"}</td>
                  <td className="py-3 pr-4"><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TATracker;
