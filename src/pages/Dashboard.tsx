import { DollarSign, TrendingUp, Briefcase, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { dashboardStats, requisitions, deals } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

const formatCurrency = (n: number) => "₹" + (n / 100000).toFixed(1) + "L";

const Dashboard = () => {
  const { totalRevenue, totalCreatorCost, grossMarginPercent, activeDeals, studioBreakdown, monthlyRevenue } = dashboardStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Founder Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial overview & operations intelligence</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} change="+8.2% vs last quarter" changeType="positive" icon={DollarSign} />
        <StatCard label="Creator Cost" value={formatCurrency(totalCreatorCost)} change="59.5% of revenue" changeType="neutral" icon={Users} />
        <StatCard label="Gross Margin" value={`${grossMarginPercent}%`} change="+1.2pp vs target" changeType="positive" icon={TrendingUp} />
        <StatCard label="Active Deals" value={String(activeDeals)} change="2 closing this month" changeType="neutral" icon={Briefcase} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Cost */}
        <div className="stat-card">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Revenue vs Cost (Monthly)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 9%)", border: "1px solid hsl(220 14% 14%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(160 60% 45%)" fill="hsl(160 60% 45% / 0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="cost" stroke="hsl(210 80% 55%)" fill="hsl(210 80% 55% / 0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Studio Profitability */}
        <div className="stat-card">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Studio Profitability</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={studioBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
              <XAxis dataKey="studio" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 9%)", border: "1px solid hsl(220 14% 14%)", borderRadius: 8, color: "hsl(210 20% 92%)" }} />
              <Bar dataKey="revenue" fill="hsl(160 60% 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="hsl(210 80% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Deals Table */}
      <div className="stat-card">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Active Deals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Deal</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Client</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Contract Value</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Creator Cost</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Margin</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="data-table-row">
                  <td className="py-3 font-medium text-foreground">{deal.dealName}</td>
                  <td className="py-3 text-muted-foreground">{deal.clientName}</td>
                  <td className="py-3 font-mono text-foreground">{formatCurrency(deal.totalContractValue)}</td>
                  <td className="py-3 font-mono text-muted-foreground">{formatCurrency(deal.totalCreatorCost)}</td>
                  <td className="py-3">
                    <span className="font-mono text-success">{deal.grossMarginPercent}%</span>
                  </td>
                  <td className="py-3"><StatusBadge status={deal.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Requisitions */}
      <div className="stat-card">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Recent Requisitions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Client / Deal</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Roles</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Budget</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.slice(0, 4).map((req) => (
                <tr key={req.id} className="data-table-row">
                  <td className="py-3 font-mono text-muted-foreground">{req.id}</td>
                  <td className="py-3">
                    <p className="font-medium text-foreground">{req.dealName}</p>
                    <p className="text-xs text-muted-foreground">{req.clientName}</p>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {req.roles.map(r => `${r.count}× ${r.roleType}`).join(", ")}
                  </td>
                  <td className="py-3 font-mono text-foreground">{formatCurrency(req.talentBudget)}</td>
                  <td className="py-3"><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
