import { useState, useMemo } from "react";
import {
  getPods, updateClient, updateDeal, updateCreatorInDeal, addCreatorToDeal,
  POD_NAMES, type PodV2, type ClientV2, type DealV2, type DeployedCreatorV2,
  type CreatorDealStatus, type HealthColor, type ResourceSource, type DealStatus,
} from "@/lib/talent-client-store";
import { type RoleType, type PayModel } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DollarSign, TrendingUp, Users, ChevronDown, ChevronRight, Pencil, Plus, Circle, UserCheck, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getHandoversByDeal } from "@/lib/handover-store";

const formatCurrency = (n: number) => "₹" + (n / 100000).toFixed(1) + "L";

const healthDot = (color: HealthColor | "") => {
  if (!color) return null;
  const cls = color === "green" ? "text-success" : color === "yellow" ? "text-warning" : "text-destructive";
  return <Circle className={`h-3 w-3 fill-current ${cls}`} />;
};

const creatorStatusStyles: Record<CreatorDealStatus, string> = {
  Active: "bg-success/15 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Removed: "bg-destructive/15 text-destructive",
  Flagged: "bg-warning/15 text-warning",
};

// ─── Edit Client Dialog ─────────────────────────────────
function EditClientDialog({ client, open, onClose }: { client: ClientV2; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ vsdName: client.vsdName, principalBOPM: client.principalBOPM, seniorBOPM: client.seniorBOPM, juniorBOPM: client.juniorBOPM });
  const save = () => { updateClient(client.id, form); toast.success("Client updated"); onClose(); };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit {client.clientName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {(["vsdName", "principalBOPM", "seniorBOPM", "juniorBOPM"] as const).map(f => (
            <div key={f}><Label className="text-xs capitalize">{f.replace(/([A-Z])/g, " $1")}</Label>
              <Input value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} /></div>
          ))}
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Deal Dialog ───────────────────────────────────
function EditDealDialog({ deal, open, onClose }: { deal: DealV2; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ dealName: deal.dealName, dealType: deal.dealType, status: deal.status as DealStatus });
  const save = () => { updateDeal(deal.id, form); toast.success("Deal updated"); onClose(); };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Deal Name</Label><Input value={form.dealName} onChange={e => setForm(p => ({ ...p, dealName: e.target.value }))} /></div>
          <div><Label className="text-xs">Deal Type</Label><Input value={form.dealType} onChange={e => setForm(p => ({ ...p, dealType: e.target.value }))} /></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as DealStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Active", "Completed", "On Hold"] as DealStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Creator Dialog ─────────────────────────────────
function AddCreatorDialog({ dealId, open, onClose }: { dealId: string; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    creatorName: "", role: "Writer" as RoleType, source: "Freelancer" as ResourceSource,
    payModel: "Per Word" as PayModel, payRate: 0, expectedVolume: 0, totalCost: 0, clientBilling: 0,
    dealStatus: "Active" as CreatorDealStatus, capabilityLeadRating: "" as HealthColor | "", bopmRating: "" as HealthColor | "",
  });
  const save = () => {
    if (!form.creatorName) { toast.error("Name required"); return; }
    addCreatorToDeal(dealId, form);
    toast.success("Creator added");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Creator</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={form.creatorName} onChange={e => setForm(p => ({ ...p, creatorName: e.target.value }))} /></div>
          <div><Label className="text-xs">Role</Label>
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v as RoleType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Writer", "Editor", "Designer", "Video", "Other"] as RoleType[]).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs">Source</Label>
            <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v as ResourceSource }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Freelancer">Freelancer</SelectItem><SelectItem value="In-house">In-house</SelectItem></SelectContent>
            </Select></div>
          <div><Label className="text-xs">Pay Model</Label>
            <Select value={form.payModel} onValueChange={v => setForm(p => ({ ...p, payModel: v as PayModel }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Per Word", "Per Assignment", "Retainer", "Hourly"] as PayModel[]).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs">Pay Rate</Label><Input type="number" value={form.payRate || ""} onChange={e => setForm(p => ({ ...p, payRate: +e.target.value }))} /></div>
          <div><Label className="text-xs">Volume</Label><Input type="number" value={form.expectedVolume || ""} onChange={e => setForm(p => ({ ...p, expectedVolume: +e.target.value }))} /></div>
          <div><Label className="text-xs">Total Cost</Label><Input type="number" value={form.totalCost || ""} onChange={e => setForm(p => ({ ...p, totalCost: +e.target.value }))} /></div>
          <div><Label className="text-xs">Client Billing</Label><Input type="number" value={form.clientBilling || ""} onChange={e => setForm(p => ({ ...p, clientBilling: +e.target.value }))} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Creator Status Edit ────────────────────────────────
function CreatorStatusSelect({ dealId, creator }: { dealId: string; creator: DeployedCreatorV2 }) {
  return (
    <Select value={creator.dealStatus} onValueChange={v => { updateCreatorInDeal(dealId, creator.id, { dealStatus: v as CreatorDealStatus }); toast.success("Status updated"); }}>
      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {(["Active", "Inactive", "Removed", "Flagged"] as CreatorDealStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RatingSelect({ dealId, creatorId, field, value }: { dealId: string; creatorId: string; field: "capabilityLeadRating" | "bopmRating"; value: HealthColor | "" }) {
  return (
    <Select value={value || "none"} onValueChange={v => { updateCreatorInDeal(dealId, creatorId, { [field]: v === "none" ? "" : v }); }}>
      <SelectTrigger className="h-7 w-20 text-xs"><SelectValue>{value ? healthDot(value) : "—"}</SelectValue></SelectTrigger>
      <SelectContent>
        <SelectItem value="green"><span className="flex items-center gap-1">{healthDot("green")} Green</span></SelectItem>
        <SelectItem value="yellow"><span className="flex items-center gap-1">{healthDot("yellow")} Yellow</span></SelectItem>
        <SelectItem value="red"><span className="flex items-center gap-1">{healthDot("red")} Red</span></SelectItem>
        <SelectItem value="none">None</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Deal Row ───────────────────────────────────────────
function DealRow({ deal, showInactive }: { deal: DealV2; showInactive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editDeal, setEditDeal] = useState(false);
  const [addCreator, setAddCreator] = useState(false);

  const visibleCreators = showInactive ? deal.creators : deal.creators.filter(c => c.dealStatus === "Active");
  const handovers = getHandoversByDeal(deal.id);

  return (
    <div className="border border-border rounded-md bg-card/50">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <span className="font-medium text-sm text-foreground">{deal.dealName}</span>
            <span className="ml-2 text-xs text-muted-foreground">{deal.dealType}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground">Rev {formatCurrency(deal.totalContractValue)}</span>
          <span className="text-xs font-mono text-muted-foreground">Cost {formatCurrency(deal.totalCreatorCost)}</span>
          <span className="text-xs font-mono text-success">{deal.grossMarginPercent}%</span>
          <StatusBadge status={deal.status} />
          <button onClick={e => { e.stopPropagation(); setEditDeal(true); }} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{visibleCreators.length} creator{visibleCreators.length !== 1 ? "s" : ""} shown</span>
            <Button variant="outline" size="sm" onClick={() => setAddCreator(true)} className="h-7 text-xs gap-1"><Plus className="h-3 w-3" />Add Creator</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Creator", "Source", "Role", "Pay Model", "Rate", "Cost", "Billing", "Margin%", "Cap Lead", "BOPM", "Status"].map(h => (
                    <th key={h} className="pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCreators.map(c => (
                  <tr key={c.id} className="data-table-row">
                    <td className="py-2 font-medium text-foreground pr-3">{c.creatorName}</td>
                    <td className="py-2 pr-3"><span className={`text-xs px-1.5 py-0.5 rounded ${c.source === "In-house" ? "bg-info/15 text-info" : "bg-primary/15 text-primary"}`}>{c.source}</span></td>
                    <td className="py-2 text-muted-foreground pr-3">{c.role}</td>
                    <td className="py-2 text-muted-foreground pr-3">{c.payModel}</td>
                    <td className="py-2 font-mono text-foreground pr-3">₹{c.payRate.toLocaleString()}</td>
                    <td className="py-2 font-mono text-muted-foreground pr-3">{formatCurrency(c.totalCost)}</td>
                    <td className="py-2 font-mono text-foreground pr-3">{formatCurrency(c.clientBilling)}</td>
                    <td className="py-2 font-mono text-success pr-3">{c.grossMarginPercent}%</td>
                    <td className="py-2 pr-3"><RatingSelect dealId={deal.id} creatorId={c.id} field="capabilityLeadRating" value={c.capabilityLeadRating} /></td>
                    <td className="py-2 pr-3"><RatingSelect dealId={deal.id} creatorId={c.id} field="bopmRating" value={c.bopmRating} /></td>
                    <td className="py-2"><CreatorStatusSelect dealId={deal.id} creator={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Handed-over Creators */}
          {handovers.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h4 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                <UserCheck className="h-3.5 w-3.5" /> Handed-over Creators
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {handovers.map(ho => (
                  <div key={ho.id} className="border border-border rounded-md p-2.5 bg-muted/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">{ho.creatorName}</span>
                      {ho.pepperPortalLink && <a href={ho.pepperPortalLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>ID: {ho.pepperIdNumber}</span>
                      <span>{ho.paymentModel}</span>
                      <span className="font-mono">₹{ho.finalizedPay.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <EditDealDialog deal={deal} open={editDeal} onClose={() => setEditDeal(false)} />
      <AddCreatorDialog dealId={deal.id} open={addCreator} onClose={() => setAddCreator(false)} />
    </div>
  );
}

// ─── Client Card ────────────────────────────────────────
function ClientCard({ client }: { client: ClientV2 }) {
  const [expanded, setExpanded] = useState(false);
  const [editClient, setEditClient] = useState(false);
  const [showInactiveDeals, setShowInactiveDeals] = useState(false);
  const [showInactiveCreators, setShowInactiveCreators] = useState(false);

  const visibleDeals = showInactiveDeals ? client.deals : client.deals.filter(d => d.status === "Active");
  const totalRev = client.deals.reduce((s, d) => s + d.totalContractValue, 0);
  const totalCost = client.deals.reduce((s, d) => s + d.totalCreatorCost, 0);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="font-semibold text-foreground">{client.clientName}</p>
            <p className="text-xs text-muted-foreground">
              VSD: {client.vsdName || "—"} · BOPM: {client.principalBOPM || "—"}
            </p>
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
            <p className="font-mono text-success">{totalRev ? ((totalRev - totalCost) / totalRev * 100).toFixed(1) : 0}%</p>
          </div>
          <span className="text-xs text-muted-foreground">{client.deals.length} deal{client.deals.length !== 1 ? "s" : ""}</span>
          <button onClick={e => { e.stopPropagation(); setEditClient(true); }} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
          {/* BOPM info bar */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><strong>VSD:</strong> {client.vsdName || "—"}</span>
            <span><strong>Principal BOPM:</strong> {client.principalBOPM || "—"}</span>
            <span><strong>Senior BOPM:</strong> {client.seniorBOPM || "—"}</span>
            <span><strong>Junior BOPM:</strong> {client.juniorBOPM || "—"}</span>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showInactiveDeals} onChange={e => setShowInactiveDeals(e.target.checked)} className="rounded border-border" />
              Show completed/on-hold deals
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showInactiveCreators} onChange={e => setShowInactiveCreators(e.target.checked)} className="rounded border-border" />
              Show all creators (incl. inactive/removed)
            </label>
          </div>

          {/* Deals */}
          <div className="space-y-3">
            {visibleDeals.map(deal => (
              <DealRow key={deal.id} deal={deal} showInactive={showInactiveCreators} />
            ))}
            {visibleDeals.length === 0 && <p className="text-xs text-muted-foreground py-2">No active deals</p>}
          </div>
        </div>
      )}

      <EditClientDialog client={client} open={editClient} onClose={() => setEditClient(false)} />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
const DealMargins = () => {
  const [_, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const pods = getPods();

  const allDeals = pods.flatMap(p => p.clients.flatMap(c => c.deals));
  const totalRev = allDeals.reduce((s, d) => s + d.totalContractValue, 0);
  const totalCost = allDeals.reduce((s, d) => s + d.totalCreatorCost, 0);
  const totalMargin = totalRev - totalCost;
  const avgMargin = totalRev ? (totalMargin / totalRev * 100).toFixed(1) : "0";

  // Wrap mutations to trigger re-render
  // We rely on the store being mutated and then refresh
  // Intercept via an effect-like approach by passing refresh through context
  // For simplicity, we use a click-based refresh after each dialog close

  return (
    <div className="space-y-6 animate-fade-in" onClick={() => refresh()}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Talent X Client View</h1>
        <p className="text-sm text-muted-foreground mt-1">Pod → Client → Deal hierarchy with creator insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRev)} icon={DollarSign} />
        <StatCard label="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} />
        <StatCard label="Gross Margin" value={formatCurrency(totalMargin)} change={`${avgMargin}% overall`} changeType="positive" icon={TrendingUp} />
        <StatCard label="Total Clients" value={String(pods.reduce((s, p) => s + p.clients.length, 0))} icon={Users} />
      </div>

      <Tabs defaultValue={POD_NAMES[0]}>
        <TabsList className="bg-muted border border-border">
          {POD_NAMES.map(name => (
            <TabsTrigger key={name} value={name} className="text-xs font-mono">{name}</TabsTrigger>
          ))}
        </TabsList>
        {pods.map(pod => (
          <TabsContent key={pod.name} value={pod.name} className="space-y-4 mt-4">
            {pod.clients.length === 0 && <p className="text-sm text-muted-foreground">No clients in this pod</p>}
            {pod.clients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DealMargins;
