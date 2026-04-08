import { useState, useEffect } from "react";
import { getPipelineAnalytics, getAllPipelineCandidates, getCandidates } from "@/lib/ats-store";
import { fetchRequisitions } from "@/lib/requisition-db-store";
import type { AdvancedRequisition } from "@/lib/requisition-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, TrendingUp, Clock, Target, BarChart3, ArrowDownRight,
  CheckCircle, XCircle, UserPlus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie,
} from "recharts";

const FUNNEL_COLORS = [
  "hsl(238 40% 57%)",       // Primary
  "hsl(238 40% 57% / 0.85)",
  "hsl(238 40% 57% / 0.7)",
  "hsl(238 40% 57% / 0.55)",
  "hsl(238 40% 57% / 0.4)",
  "hsl(142 60% 45%)",       // Hired = green
  "hsl(0 65% 55%)",         // Rejected = red
];

const ATSReporting = () => {
  const analytics = getPipelineAnalytics();
  const allPipeline = getAllPipelineCandidates();
  const allCandidates = getCandidates();

  // Funnel data
  const funnelData = [
    { name: "Sourced", value: analytics.sourced },
    { name: "Screened", value: analytics.screened },
    { name: "Offers", value: analytics.offers },
    { name: "Hired", value: analytics.hired },
    { name: "Rejected", value: analytics.rejected },
  ];

  // Per-requisition breakdown
  const reqBreakdown = advancedRequisitions.map(req => {
    const pcs = allPipeline.filter(pc => pc.requisitionId === req.id);
    const clientName = req.flow === "sales" ? req.salesData?.clientName : req.hiringData?.clientName;
    return {
      reqId: req.id,
      client: clientName || "Unknown",
      flow: req.flow,
      total: pcs.length,
      sourced: pcs.filter(pc => pc.currentStage === "Sourced").length,
      inProcess: pcs.filter(pc => !["Sourced", "Hired", "Rejected"].includes(pc.currentStage)).length,
      hired: pcs.filter(pc => pc.currentStage === "Hired").length,
      rejected: pcs.filter(pc => pc.currentStage === "Rejected").length,
      avgDays: pcs.length ? Math.round(pcs.reduce((sum, pc) => sum + Math.round((Date.now() - new Date(pc.addedAt).getTime()) / (1000 * 60 * 60 * 24)), 0) / pcs.length) : 0,
    };
  }).filter(r => r.total > 0);

  // Source distribution
  const sourceDistribution = allCandidates.reduce((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(sourceDistribution).map(([name, value]) => ({ name, value }));

  // Aging by stage
  const agingByStage: Record<string, number[]> = {};
  allPipeline.forEach(pc => {
    if (!agingByStage[pc.currentStage]) agingByStage[pc.currentStage] = [];
    agingByStage[pc.currentStage].push(Math.round((Date.now() - new Date(pc.addedAt).getTime()) / (1000 * 60 * 60 * 24)));
  });
  const agingData = Object.entries(agingByStage).map(([stage, days]) => ({
    stage,
    avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
    count: days.length,
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-foreground">ATS Reporting</h1>
        <div className="h-0.5 w-8 bg-primary rounded-full mt-1" />
        <p className="text-xs text-muted-foreground mt-0.5">Pipeline analytics, funnel metrics & conversion rates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total Candidates" value={String(analytics.totalCandidates)} icon={Users} />
        <StatCard label="Active Pipelines" value={String(analytics.activePipelines)} icon={BarChart3} />
        <StatCard label="Screening Rate" value={`${analytics.screeningRate}%`} icon={TrendingUp} />
        <StatCard label="Hire Rate" value={`${analytics.hireRate}%`} icon={Target} />
        <StatCard label="Avg Pipeline Age" value={`${analytics.avgAging}d`} icon={Clock} />
        <StatCard label="Offer Accept" value={`${analytics.offerAcceptRate}%`} icon={CheckCircle} />
      </div>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel" className="text-xs">Funnel</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs">Pipeline Breakdown</TabsTrigger>
          <TabsTrigger value="aging" className="text-xs">Aging Analysis</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">Source Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel">
          <Card>
            <CardHeader><CardTitle className="text-[11px] uppercase tracking-widest text-primary/70">Recruitment Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Source → Screen</p>
                  <p className="text-lg font-mono font-semibold text-foreground">{analytics.screeningRate}%</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Screen → Hire</p>
                  <p className="text-lg font-mono font-semibold text-foreground">{analytics.screened ? Math.round(analytics.hired / analytics.screened * 100) : 0}%</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Conversion</p>
                  <p className="text-lg font-mono font-semibold text-foreground">{analytics.hireRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader><CardTitle className="text-[11px] uppercase tracking-widest text-primary/70">Per-Requisition Pipeline</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Req ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Sourced</TableHead>
                    <TableHead>In Process</TableHead>
                    <TableHead>Hired</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>Avg Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reqBreakdown.map(r => (
                    <TableRow key={r.reqId}>
                      <TableCell className="font-mono text-[13px] font-medium">{r.reqId}</TableCell>
                      <TableCell className="text-[13px]">{r.client}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{r.flow}</Badge></TableCell>
                      <TableCell className="font-mono">{r.total}</TableCell>
                      <TableCell className="font-mono">{r.sourced}</TableCell>
                      <TableCell className="font-mono text-primary">{r.inProcess}</TableCell>
                      <TableCell className="font-mono text-emerald-600">{r.hired}</TableCell>
                      <TableCell className="font-mono text-destructive">{r.rejected}</TableCell>
                      <TableCell className="font-mono">{r.avgDays}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader><CardTitle className="text-[11px] uppercase tracking-widest text-primary/70">Pipeline Aging by Stage</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" />
                    <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} label={{ value: "Avg Days", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                    <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="avgDays" fill="hsl(238 40% 57%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-1">
                {agingData.map(a => (
                  <div key={a.stage} className="flex items-center justify-between text-[13px] py-1 border-b border-border/50 last:border-0">
                    <span className="text-foreground">{a.stage}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{a.count} candidates</span>
                      <span className="font-mono font-medium text-foreground">{a.avgDays} days avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader><CardTitle className="text-[11px] uppercase tracking-widest text-primary/70">Candidate Sources</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {sourceData.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm" style={{ background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }} />
                        <span className="text-[13px] text-foreground">{s.name}</span>
                      </div>
                      <span className="font-mono text-[13px] font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ATSReporting;
