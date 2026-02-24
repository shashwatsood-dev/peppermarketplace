import { useState, useMemo } from "react";
import { getPods, type DealV2, type ClientV2, type DeployedCreatorV2 } from "@/lib/talent-client-store";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DollarSign, TrendingUp, Users, Upload, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const formatCurrency = (n: number) => "₹" + (n / 100000).toFixed(1) + "L";

// In-memory agreement store
interface Agreement {
  id: string;
  creatorId: string;
  dealId: string;
  fileName: string;
  uploadedAt: string;
}

let agreements: Agreement[] = [];

function addAgreement(creatorId: string, dealId: string, fileName: string) {
  agreements = [...agreements, { id: `AGR-${Date.now()}`, creatorId, dealId, fileName, uploadedAt: new Date().toISOString() }];
}

function getAgreements(dealId: string, creatorId: string) {
  return agreements.filter(a => a.dealId === dealId && a.creatorId === creatorId);
}

// Gather all studio deals (deals tagged as "Retainer" or "Dedicated" type, or all for now)
function getAllStudioData() {
  const pods = getPods();
  const results: { podName: string; clientName: string; client: ClientV2; deal: DealV2 }[] = [];
  for (const pod of pods) {
    for (const client of pod.clients) {
      for (const deal of client.deals) {
        results.push({ podName: pod.name, clientName: client.clientName, client, deal });
      }
    }
  }
  return results;
}

// ─── Upload Agreement Dialog ────────────────────────────
function UploadAgreementDialog({ creatorId, dealId, open, onClose }: { creatorId: string; dealId: string; open: boolean; onClose: () => void }) {
  const [fileName, setFileName] = useState("");
  const save = () => {
    if (!fileName.trim()) { toast.error("Please enter a file name"); return; }
    addAgreement(creatorId, dealId, fileName.trim());
    toast.success("Agreement uploaded (mock)");
    setFileName("");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Upload Agreement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Agreement File Name</Label>
            <Input placeholder="e.g. Ananya_Razorpay_Agreement.pdf" value={fileName} onChange={e => setFileName(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">File upload requires backend storage. Enter a file name to mock the upload.</p>
        </div>
        <DialogFooter><Button onClick={save}>Save Agreement</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deal Card ──────────────────────────────────────────
function StudioDealCard({ podName, clientName, deal }: { podName: string; clientName: string; deal: DealV2 }) {
  const [expanded, setExpanded] = useState(false);
  const [uploadFor, setUploadFor] = useState<{ creatorId: string; dealId: string } | null>(null);
  const [_, setTick] = useState(0);

  const activeCreators = deal.creators.filter(c => c.dealStatus === "Active");
  const totalCost = deal.totalCreatorCost;
  const totalRev = deal.totalContractValue;
  const margin = deal.grossMarginPercent;

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="font-semibold text-foreground">{deal.dealName}</p>
            <p className="text-xs text-muted-foreground">{clientName} · {podName} · {deal.dealType}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-xs font-mono uppercase text-muted-foreground">Revenue</p>
            <p className="font-mono text-foreground">{formatCurrency(totalRev)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono uppercase text-muted-foreground">Cost</p>
            <p className="font-mono text-muted-foreground">{formatCurrency(totalCost)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono uppercase text-muted-foreground">Margin</p>
            <p className="font-mono text-success">{margin}%</p>
          </div>
          <StatusBadge status={deal.status} />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground">{activeCreators.length} active / {deal.creators.length} total creators</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Creator", "Source", "Role", "Pay Model", "Cost", "Billing", "Margin%", "Status", "Agreement"].map(h => (
                    <th key={h} className="pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deal.creators.map(c => {
                  const creatorAgreements = getAgreements(deal.id, c.id);
                  return (
                    <tr key={c.id} className="data-table-row">
                      <td className="py-2 font-medium text-foreground pr-3">{c.creatorName}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${c.source === "In-house" ? "bg-info/15 text-info" : "bg-primary/15 text-primary"}`}>{c.source}</span>
                      </td>
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
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {creatorAgreements.length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {creatorAgreements.length}
                            </span>
                          )}
                          <button
                            onClick={() => { setUploadFor({ creatorId: c.id, dealId: deal.id }); }}
                            className="p-1 rounded hover:bg-muted"
                            title="Upload agreement"
                          >
                            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
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

      {uploadFor && (
        <UploadAgreementDialog
          creatorId={uploadFor.creatorId}
          dealId={uploadFor.dealId}
          open
          onClose={() => { setUploadFor(null); setTick(t => t + 1); }}
        />
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
const StudioDashboard = () => {
  const [_, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const studioData = useMemo(() => getAllStudioData(), [_]);

  const totalRev = studioData.reduce((s, d) => s + d.deal.totalContractValue, 0);
  const totalCost = studioData.reduce((s, d) => s + d.deal.totalCreatorCost, 0);
  const totalMargin = totalRev - totalCost;
  const avgMargin = totalRev ? (totalMargin / totalRev * 100).toFixed(1) : "0";
  const allCreators = studioData.flatMap(d => d.deal.creators);
  const activeCreators = allCreators.filter(c => c.dealStatus === "Active");
  const freelancers = allCreators.filter(c => c.source === "Freelancer");
  const inHouse = allCreators.filter(c => c.source === "In-house");

  return (
    <div className="space-y-6 animate-fade-in" onClick={() => refresh()}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Studio Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Content Studio P&L and resource overview</p>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRev)} icon={DollarSign} />
        <StatCard label="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} />
        <StatCard label="Gross Margin" value={formatCurrency(totalMargin)} change={`${avgMargin}%`} changeType="positive" icon={TrendingUp} />
        <StatCard label="Total Creators" value={String(allCreators.length)} change={`${activeCreators.length} active`} changeType="neutral" icon={Users} />
        <StatCard label="Freelancers" value={String(freelancers.length)} icon={Users} />
        <StatCard label="In-house" value={String(inHouse.length)} icon={Users} />
      </div>

      {/* All Studio Deals */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">All Deals ({studioData.length})</h2>
        {studioData.map(({ podName, clientName, deal }) => (
          <StudioDealCard key={deal.id} podName={podName} clientName={clientName} deal={deal} />
        ))}
      </div>
    </div>
  );
};

export default StudioDashboard;
