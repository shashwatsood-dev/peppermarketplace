import { useState, useMemo, useEffect } from "react";
import type { DealV2, ClientV2, DeployedCreatorV2 } from "@/lib/talent-client-types";
import { POD_NAMES } from "@/lib/talent-client-types";
import { dbAddHRBPConnect, dbUpdateCreator, dbUploadAgreement, dbListAgreements, dbGetAgreementUrl } from "@/lib/db-store";
import { usePods, useRefreshPods } from "@/lib/use-pods";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DollarSign, TrendingUp, Users, Upload, FileText, ChevronDown, ChevronRight, Plus, MessageSquare, Circle, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth-context";

const formatCurrency = (n: number) => "₹" + (n / 100000).toFixed(1) + "L";

const healthDot = (color: string) => {
  if (!color) return null;
  const cls = color === "green" ? "text-success" : color === "yellow" ? "text-warning" : "text-destructive";
  return <Circle className={`h-3 w-3 fill-current ${cls}`} />;
};

const VSD_POD_MAP: Record<string, string> = {
  "Aamir Khan": "Aamir",
  "Aditya Shaw": "Aditya",
  "Neema Jayadas": "Neema",
  "Sneha Iyer": "Sneha",
  "Sumit Shekhawat": "Sumit",
};

function getAllStudioData(pods: import("@/lib/talent-client-types").PodV2[]) {
  const results: { podName: string; clientName: string; client: ClientV2; deal: DealV2 }[] = [];
  for (const pod of pods) {
    for (const client of pod.clients) {
      for (const deal of client.deals) {
        if (deal.isContentStudio) {
          const podName = VSD_POD_MAP[deal.vsdName] || pod.name;
          results.push({ podName, clientName: client.clientName, client, deal });
        }
      }
    }
  }
  return results;
}

// ─── HRBP Connect Dialog ────────────────────────────────
function HRBPConnectDialog({ dealId, creatorId, creatorName, connects, open, onClose, onRefresh }: {
  dealId: string; creatorId: string; creatorName: string; connects: DeployedCreatorV2["hrbpConnects"]; open: boolean; onClose: () => void; onRefresh: () => void;
}) {
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [hrbpName, setHrbpName] = useState("");
  const add = async () => {
    if (!summary.trim()) { toast.error("Summary required"); return; }
    await dbAddHRBPConnect(creatorId, { date: new Date().toISOString().split("T")[0], summary: summary.trim(), outcome: outcome.trim(), hrbpName: hrbpName.trim() });
    toast.success("Connect logged");
    setSummary(""); setOutcome(""); setHrbpName("");
    onRefresh();
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>HRBP Connects — {creatorName}</DialogTitle></DialogHeader>
        {connects.length > 0 && (
          <div className="space-y-2 mb-4">
            {connects.map(c => (
              <div key={c.id} className="p-2 rounded bg-muted/30 border border-border text-xs space-y-1">
                <div className="flex justify-between"><span className="font-mono text-muted-foreground">{c.date}</span><span className="text-muted-foreground">{c.hrbpName}</span></div>
                <p className="text-foreground">{c.summary}</p>
                {c.outcome && <p className="text-success">→ {c.outcome}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          <div><Label className="text-xs">HRBP Name</Label><Input value={hrbpName} onChange={e => setHrbpName(e.target.value)} placeholder="e.g. Priya Sharma" /></div>
          <div><Label className="text-xs">Connect Summary *</Label><Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Key discussion points..." rows={2} /></div>
          <div><Label className="text-xs">Outcome / Action Items</Label><Input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="What resulted from this connect?" /></div>
        </div>
        <DialogFooter><Button onClick={add}>Log Connect</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upload Agreement Dialog (Real Storage) ──────────────
function UploadAgreementDialog({ creatorId, dealId, open, onClose, onRefresh }: { creatorId: string; dealId: string; open: boolean; onClose: () => void; onRefresh: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [agreements, setAgreements] = useState<{ name: string; path: string; createdAt: string }[]>([]);

  useEffect(() => {
    if (open) dbListAgreements(dealId, creatorId).then(setAgreements);
  }, [open, dealId, creatorId]);

  const upload = async () => {
    if (!file) { toast.error("Select a file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setUploading(true);
    try {
      await dbUploadAgreement(creatorId, dealId, file);
      toast.success("Agreement uploaded");
      setFile(null);
      const updated = await dbListAgreements(dealId, creatorId);
      setAgreements(updated);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const downloadAgreement = async (path: string) => {
    const url = await dbGetAgreementUrl(path);
    if (url) window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Agreements</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {agreements.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Existing Agreements</Label>
              {agreements.map(a => (
                <div key={a.path} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border text-xs">
                  <span className="text-foreground truncate">{a.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => downloadAgreement(a.path)} className="h-6 text-xs gap-1"><Download className="h-3 w-3" />View</Button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs">Upload New (PDF, max 10MB)</Label>
            <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="text-xs" />
          </div>
        </div>
        <DialogFooter><Button onClick={upload} disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deal Card ──────────────────────────────────────────
function StudioDealCard({ podName, clientName, deal, onRefresh }: { podName: string; clientName: string; deal: DealV2; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [uploadFor, setUploadFor] = useState<{ creatorId: string; dealId: string } | null>(null);
  const [hrbpFor, setHrbpFor] = useState<{ dealId: string; creatorId: string; creatorName: string; connects: DeployedCreatorV2["hrbpConnects"] } | null>(null);

  const activeCreators = deal.creators.filter(c => c.dealStatus === "Active");
  const healthBg = deal.healthStatus === "red" ? "border-l-4 border-l-destructive" : deal.healthStatus === "yellow" ? "border-l-4 border-l-warning" : deal.healthStatus === "green" ? "border-l-4 border-l-success" : "";

  const getMonthsSinceStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const months: string[] = [];
    const d = new Date(start);
    while (d <= now) {
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  };

  return (
    <div className={`stat-card ${healthBg}`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{deal.dealName}</p>
              {deal.healthStatus && healthDot(deal.healthStatus)}
            </div>
            <p className="text-xs text-muted-foreground">{clientName} · {podName} · {deal.dealType}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Revenue</p><p className="font-mono text-foreground">{formatCurrency(deal.totalContractValue)}</p></div>
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Cost</p><p className="font-mono text-muted-foreground">{formatCurrency(deal.totalCreatorCost)}</p></div>
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Margin</p><p className="font-mono text-success">{deal.grossMarginPercent}%</p></div>
          <StatusBadge status={deal.status} />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground">{activeCreators.length} active / {deal.creators.length} total creators</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left">
                {["Creator", "Role", "Pay Model", "Cost", "Billing", "Margin%", "Status", "HRBP", "Monthly Pay", "Agreement"].map(h => (
                  <th key={h} className="pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {deal.creators.map(c => {
                  const months = getMonthsSinceStart(c.startDate);
                  return (
                    <tr key={c.id} className="data-table-row">
                      <td className="py-2 font-medium text-foreground pr-3">{c.creatorName}</td>
                      <td className="py-2 text-muted-foreground pr-3">{c.role}</td>
                      <td className="py-2 text-muted-foreground pr-3">{c.payModel}</td>
                      <td className="py-2 font-mono text-muted-foreground pr-3">{formatCurrency(c.totalCost)}</td>
                      <td className="py-2 font-mono text-foreground pr-3">{formatCurrency(c.clientBilling)}</td>
                      <td className="py-2 font-mono text-success pr-3">{c.grossMarginPercent}%</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          c.dealStatus === "Active" ? "bg-success/15 text-success" :
                          c.dealStatus === "Flagged" ? "bg-warning/15 text-warning" :
                          c.dealStatus === "Removed" ? "bg-destructive/15 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.dealStatus}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <button onClick={() => setHrbpFor({ dealId: deal.id, creatorId: c.id, creatorName: c.creatorName, connects: c.hrbpConnects })} className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <MessageSquare className="h-3 w-3" /> {c.hrbpConnects.length || "Log"}
                        </button>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-xs font-mono text-muted-foreground">{months.length} months logged</span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setUploadFor({ creatorId: c.id, dealId: deal.id })} className="p-1 rounded hover:bg-muted flex items-center gap-1 text-xs text-muted-foreground" title="Upload agreement">
                            <Upload className="h-3.5 w-3.5" /> Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uploadFor && <UploadAgreementDialog creatorId={uploadFor.creatorId} dealId={uploadFor.dealId} open onClose={() => setUploadFor(null)} onRefresh={onRefresh} />}
      {hrbpFor && <HRBPConnectDialog dealId={hrbpFor.dealId} creatorId={hrbpFor.creatorId} creatorName={hrbpFor.creatorName} connects={hrbpFor.connects} open onClose={() => setHrbpFor(null)} onRefresh={onRefresh} />}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
const StudioDashboard = () => {
  const { data: pods = [], isLoading } = usePods();
  const refreshPods = useRefreshPods();
  const [showActive, setShowActive] = useState(true);
  const [selectedPod, setSelectedPod] = useState("All");
  const [viewMode, setViewMode] = useState<"deals" | "geography">("deals");
  const { currentRole } = useAuth();
  const hideFinancials = false;

  const studioData = useMemo(() => getAllStudioData(pods), [pods]);

  const podFiltered = selectedPod === "All" ? studioData : studioData.filter(d => d.podName === selectedPod);
  const displayData = showActive ? podFiltered.filter(d => d.deal.status === "Active") : podFiltered;

  const totalRev = displayData.reduce((s, d) => s + d.deal.totalContractValue, 0);
  const totalCost = displayData.reduce((s, d) => s + d.deal.totalCreatorCost, 0);
  const allCreators = displayData.flatMap(d => d.deal.creators);
  const activeCreators = allCreators.filter(c => c.dealStatus === "Active");
  const activeClients = [...new Set(displayData.filter(d => d.deal.status === "Active").map(d => d.clientName))].length;
  const avgMargin = totalRev ? ((totalRev - totalCost) / totalRev * 100).toFixed(1) : "0";

  // Health counts
  const greenDeals = displayData.filter(d => d.deal.healthStatus === "green").length;
  const yellowDeals = displayData.filter(d => d.deal.healthStatus === "yellow").length;
  const redDeals = displayData.filter(d => d.deal.healthStatus === "red").length;

  const geoData = useMemo(() => {
    const cityMap: Record<string, { city: string; creators: Record<string, number>; rev: number; cost: number }> = {};
    for (const d of displayData) {
      for (const c of d.deal.creators) {
        const city = c.city || "Unspecified";
        if (!cityMap[city]) cityMap[city] = { city, creators: {}, rev: 0, cost: 0 };
        cityMap[city].rev += c.clientBilling;
        cityMap[city].cost += c.totalCost;
        cityMap[city].creators[c.role] = (cityMap[city].creators[c.role] || 0) + 1;
      }
    }
    return Object.values(cityMap).sort((a, b) => Object.values(b.creators).reduce((s, n) => s + n, 0) - Object.values(a.creators).reduce((s, n) => s + n, 0));
  }, [displayData]);

  const momData = [
    { month: "Sep", revenue: totalRev * 0.85, cost: totalCost * 0.82, clients: activeClients - 1, creators: activeCreators.length - 3 },
    { month: "Oct", revenue: totalRev * 0.88, cost: totalCost * 0.86, clients: activeClients - 1, creators: activeCreators.length - 2 },
    { month: "Nov", revenue: totalRev * 0.92, cost: totalCost * 0.90, clients: activeClients, creators: activeCreators.length - 1 },
    { month: "Dec", revenue: totalRev * 0.95, cost: totalCost * 0.93, clients: activeClients, creators: activeCreators.length },
    { month: "Jan", revenue: totalRev * 0.98, cost: totalCost * 0.96, clients: activeClients, creators: activeCreators.length },
    { month: "Feb", revenue: totalRev, cost: totalCost, clients: activeClients, creators: activeCreators.length },
  ];

  const [showMoM, setShowMoM] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in" onClick={() => refreshPods()}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Studio Dashboard</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
          <p className="text-sm text-muted-foreground mt-1">Content Studio P&L and resource overview</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showActive} onChange={e => setShowActive(e.target.checked)} className="rounded border-border" />
            Active only
          </label>
          <Button variant={showMoM ? "default" : "outline"} size="sm" onClick={() => setShowMoM(!showMoM)} className="text-xs">MoM Trends</Button>
        </div>
      </div>

      {/* Summary */}
      <div className={`grid grid-cols-2 ${hideFinancials ? "sm:grid-cols-2" : "sm:grid-cols-5"} gap-4`}>
        <StatCard label="Active Clients" value={String(activeClients)} icon={Users} />
        <StatCard label="Active Creators" value={String(activeCreators.length)} icon={Users} />
        {!hideFinancials && <StatCard label="Total Revenue" value={formatCurrency(totalRev)} icon={DollarSign} />}
        {!hideFinancials && <StatCard label="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} />}
        {!hideFinancials && <StatCard label="Gross Margin" value={`${avgMargin}%`} change={formatCurrency(totalRev - totalCost)} changeType="positive" icon={TrendingUp} />}
      </div>

      {/* Health Status Summary */}
      {(greenDeals > 0 || yellowDeals > 0 || redDeals > 0) && (
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground font-mono uppercase tracking-wider">Deal Health:</span>
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-current text-success" /> {greenDeals} Green</span>
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-current text-warning" /> {yellowDeals} Yellow</span>
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-current text-destructive" /> {redDeals} Red</span>
        </div>
      )}

      {/* MoM Chart */}
      {showMoM && (
        <div className="stat-card">
          <h3 className="text-sm font-mono uppercase tracking-wider text-primary/70 mb-4">Month-on-Month Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={momData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(240 5% 46%)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(240 5% 46%)", fontSize: 12 }} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(240 6% 90%)", borderRadius: 8, color: "hsl(240 10% 16%)" }} />
              <Bar dataKey="revenue" fill="hsl(238 40% 57%)" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="cost" fill="hsl(238 40% 57% / 0.4)" radius={[4, 4, 0, 0]} name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* POD tabs */}
      <Tabs value={selectedPod} onValueChange={setSelectedPod}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="All" className="text-xs font-mono">All</TabsTrigger>
            {POD_NAMES.map(name => <TabsTrigger key={name} value={name} className="text-xs font-mono">{name}</TabsTrigger>)}
          </TabsList>
          <div className="flex gap-2">
            <Button variant={viewMode === "deals" ? "default" : "outline"} size="sm" onClick={() => setViewMode("deals")} className="text-xs">Deals</Button>
            <Button variant={viewMode === "geography" ? "default" : "outline"} size="sm" onClick={() => setViewMode("geography")} className="text-xs">Geography</Button>
          </div>
        </div>
      </Tabs>

      {/* Geography View */}
      {viewMode === "geography" && (
        <div className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">City × Creator Type</h2>
          {geoData.map(g => (
            <div key={g.city} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{g.city}</h3>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-foreground">Rev: {formatCurrency(g.rev)}</span>
                  <span className="text-muted-foreground">Cost: {formatCurrency(g.cost)}</span>
                  <span className="text-success">Margin: {g.rev ? ((g.rev - g.cost) / g.rev * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(g.creators).map(([role, count]) => (
                  <span key={role} className="status-badge bg-muted text-muted-foreground">{role}: {count}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deals View */}
      {viewMode === "deals" && (
        <div className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">All Deals ({displayData.length})</h2>
          {displayData.map(({ podName, clientName, deal }) => (
            <StudioDealCard key={deal.id} podName={podName} clientName={clientName} deal={deal} onRefresh={refreshPods} />
          ))}
          {displayData.length === 0 && <p className="text-sm text-muted-foreground">No deals found</p>}
        </div>
      )}
    </div>
  );
};

export default StudioDashboard;
