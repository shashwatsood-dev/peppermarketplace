import { useState, useMemo } from "react";
import {
  getPods, updateClient, updateDeal, updateCreatorInDeal, addCreatorToDeal, addClientToPod, addDealToClient, exportAllDataAsCSV,
  POD_NAMES, type PodV2, type ClientV2, type DealV2, type DeployedCreatorV2,
  type CreatorDealStatus, type HealthColor, type ResourceSource, type DealStatus, type PodName,
} from "@/lib/talent-client-store";
import { type RoleType, type PayModel } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendingUp, Users, ChevronDown, ChevronRight, Pencil, Plus, Circle, UserCheck, ExternalLink, User, Mail, Download, Upload, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getHandoversByDeal } from "@/lib/handover-store";
import { parseClientCSV, getClientCSVTemplate } from "@/lib/talent-client-store";
import type { CurrencyCode } from "@/lib/requisition-types";

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

// ─── Rating Reason Dialog ───────────────────────────────
function RatingReasonDialog({ open, onClose, onSave, rating }: { open: boolean; onClose: () => void; onSave: (reason: string) => void; rating: string }) {
  const [reason, setReason] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const save = () => {
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    onSave(reason);
    if (sendEmail && emailTo.trim()) {
      toast.success(`Feedback email prepared to ${emailTo}`);
    }
    setReason(""); setSendEmail(false); setEmailTo(""); setEmailBody("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Reason for {rating} rating</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Reason *</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this rating being given?" rows={2} /></div>
          <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground">
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="rounded border-border" />
            Send feedback email to creator
          </label>
          {sendEmail && (
            <>
              <div><Label className="text-xs">Email To</Label><Input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="creator@email.com" /></div>
              <div><Label className="text-xs">Feedback Message</Label><Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Performance feedback..." rows={3} /></div>
            </>
          )}
        </div>
        <DialogFooter><Button onClick={save}>Save Rating</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

// ─── Add Client Dialog ──────────────────────────────────
function AddClientDialog({ podName, open, onClose }: { podName: PodName; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ clientName: "", vsdName: "", principalBOPM: "", seniorBOPM: "", juniorBOPM: "" });
  const save = () => {
    if (!form.clientName.trim()) { toast.error("Client name required"); return; }
    addClientToPod(podName, form);
    toast.success(`Client "${form.clientName}" added to ${podName}`);
    setForm({ clientName: "", vsdName: "", principalBOPM: "", seniorBOPM: "", juniorBOPM: "" });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Client to {podName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Client Name *</Label><Input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="e.g. Razorpay" /></div>
          <div><Label className="text-xs">VSD Name</Label><Input value={form.vsdName} onChange={e => setForm(p => ({ ...p, vsdName: e.target.value }))} /></div>
          <div><Label className="text-xs">Principal BOPM</Label><Input value={form.principalBOPM} onChange={e => setForm(p => ({ ...p, principalBOPM: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Senior BOPM</Label><Input value={form.seniorBOPM} onChange={e => setForm(p => ({ ...p, seniorBOPM: e.target.value }))} /></div>
            <div><Label className="text-xs">Junior BOPM</Label><Input value={form.juniorBOPM} onChange={e => setForm(p => ({ ...p, juniorBOPM: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Add Client</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Deal Dialog ────────────────────────────────────
function AddDealDialog({ clientId, clientName, open, onClose }: { clientId: string; clientName: string; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ dealName: "", dealType: "Retainer", status: "Active" as DealStatus, currency: "INR" as CurrencyCode, signingEntity: "", geography: "" });
  const save = () => {
    if (!form.dealName.trim()) { toast.error("Deal name required"); return; }
    addDealToClient(clientId, form);
    toast.success(`Deal "${form.dealName}" added`);
    setForm({ dealName: "", dealType: "Retainer", status: "Active", currency: "INR", signingEntity: "", geography: "" });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Deal to {clientName}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Deal Name *</Label><Input value={form.dealName} onChange={e => setForm(p => ({ ...p, dealName: e.target.value }))} placeholder="e.g. Content Retainer" /></div>
          <div><Label className="text-xs">Deal Type</Label>
            <Select value={form.dealType} onValueChange={v => setForm(p => ({ ...p, dealType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Retainer">Retainer</SelectItem><SelectItem value="Project">Project</SelectItem></SelectContent>
            </Select></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as DealStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Active", "Completed", "On Hold", "Disputed", "New Deal in SLA/PO"] as DealStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs">Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v as CurrencyCode }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="INR">INR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
            </Select></div>
          <div><Label className="text-xs">Geography</Label><Input value={form.geography} onChange={e => setForm(p => ({ ...p, geography: e.target.value }))} placeholder="e.g. India" /></div>
          <div className="col-span-2"><Label className="text-xs">Signing Entity</Label><Input value={form.signingEntity} onChange={e => setForm(p => ({ ...p, signingEntity: e.target.value }))} placeholder="e.g. Pepper Content Pvt Ltd" /></div>
        </div>
        <DialogFooter><Button onClick={save}>Add Deal</Button></DialogFooter>
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
              <SelectContent>{(["Active", "Completed", "On Hold"] as DealStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Add Creator (Line-Item Form) ──────────────────
interface CreatorLineItem {
  id: string;
  creatorName: string;
  role: RoleType;
  source: ResourceSource;
  payModel: PayModel;
  payRate: number;
  totalCost: number;
  clientBilling: number;
  city: string;
  translationLanguage: string;
}

function emptyLineItem(): CreatorLineItem {
  return { id: crypto.randomUUID(), creatorName: "", role: "Writer", source: "Freelancer", payModel: "Per Word", payRate: 0, totalCost: 0, clientBilling: 0, city: "", translationLanguage: "" };
}

function BulkAddCreatorDialog({ dealId, open, onClose }: { dealId: string; open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<CreatorLineItem[]>([emptyLineItem()]);

  const updateRow = (id: string, updates: Partial<CreatorLineItem>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyLineItem()]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const save = () => {
    const valid = rows.filter(r => r.creatorName.trim());
    if (valid.length === 0) { toast.error("At least one creator name required"); return; }
    for (const r of valid) {
      addCreatorToDeal(dealId, {
        creatorName: r.creatorName, role: r.role, source: r.source, payModel: r.payModel,
        payRate: r.payRate, expectedVolume: 0, totalCost: r.totalCost, clientBilling: r.clientBilling,
        dealStatus: "Active", capabilityLeadRating: "", bopmRating: "", city: r.city,
      });
    }
    toast.success(`${valid.length} creator(s) added`);
    setRows([emptyLineItem()]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Creators to Deal</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_90px_90px_80px_80px_80px_70px_32px] gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            <span>Name</span><span>Role</span><span>Source</span><span>Pay Model</span><span>Rate</span><span>Cost</span><span>Billing</span><span>City</span><span></span>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_90px_90px_90px_80px_80px_80px_70px_32px] gap-1.5 items-center">
              <Input className="h-8 text-xs" placeholder="Name" value={r.creatorName} onChange={e => updateRow(r.id, { creatorName: e.target.value })} />
              <Select value={r.role} onValueChange={v => updateRow(r.id, { role: v as RoleType })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{(["Writer", "Editor", "Designer", "Video", "Translator", "Other"] as RoleType[]).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={r.source} onValueChange={v => updateRow(r.id, { source: v as ResourceSource })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Freelancer">Freelancer</SelectItem><SelectItem value="In-house">In-house</SelectItem></SelectContent>
              </Select>
              <Select value={r.payModel} onValueChange={v => updateRow(r.id, { payModel: v as PayModel })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{(["Per Word", "Per Assignment", "Retainer", "Hourly"] as PayModel[]).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-8 text-xs font-mono" type="number" placeholder="₹" value={r.payRate || ""} onChange={e => updateRow(r.id, { payRate: +e.target.value })} />
              <Input className="h-8 text-xs font-mono" type="number" placeholder="₹" value={r.totalCost || ""} onChange={e => updateRow(r.id, { totalCost: +e.target.value })} />
              <Input className="h-8 text-xs font-mono" type="number" placeholder="₹" value={r.clientBilling || ""} onChange={e => updateRow(r.id, { clientBilling: +e.target.value })} />
              <Input className="h-8 text-xs" placeholder="City" value={r.city} onChange={e => updateRow(r.id, { city: e.target.value })} />
              <button onClick={() => removeRow(r.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Row</Button>
        </div>
        <DialogFooter><Button onClick={save}>Add {rows.filter(r => r.creatorName.trim()).length} Creator(s)</Button></DialogFooter>
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
  const [reasonDialog, setReasonDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<HealthColor | "">("");

  const handleChange = (v: string) => {
    const newVal = v === "none" ? "" : v as HealthColor;
    if (newVal === "yellow" || newVal === "red") {
      setPendingRating(newVal);
      setReasonDialog(true);
    } else {
      updateCreatorInDeal(dealId, creatorId, { [field]: newVal });
    }
  };

  const reasonField = field === "capabilityLeadRating" ? "capabilityRatingReason" : "bopmRatingReason";

  return (
    <>
      <Select value={value || "none"} onValueChange={handleChange}>
        <SelectTrigger className="h-7 w-20 text-xs"><SelectValue>{value ? healthDot(value) : "—"}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="green"><span className="flex items-center gap-1">{healthDot("green")} Green</span></SelectItem>
          <SelectItem value="yellow"><span className="flex items-center gap-1">{healthDot("yellow")} Yellow</span></SelectItem>
          <SelectItem value="red"><span className="flex items-center gap-1">{healthDot("red")} Red</span></SelectItem>
          <SelectItem value="none">None</SelectItem>
        </SelectContent>
      </Select>
      <RatingReasonDialog
        open={reasonDialog}
        onClose={() => setReasonDialog(false)}
        rating={pendingRating}
        onSave={(reason) => {
          updateCreatorInDeal(dealId, creatorId, { [field]: pendingRating, [reasonField]: reason });
          toast.success("Rating updated with reason");
        }}
      />
    </>
  );
}

// ─── Deal Row ───────────────────────────────────────────
function DealRow({ deal, showInactive }: { deal: DealV2; showInactive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editDeal, setEditDeal] = useState(false);
  const [addCreator, setAddCreator] = useState(false);

  const visibleCreators = showInactive ? deal.creators : deal.creators.filter(c => c.dealStatus === "Active");
  const handovers = getHandoversByDeal(deal.id);

  const toggleContentStudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateDeal(deal.id, { isContentStudio: !deal.isContentStudio });
    toast.success(deal.isContentStudio ? "Removed from Content Studio" : "Added to Content Studio");
  };

  return (
    <div className="border border-border rounded-md bg-card/50">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <span className="font-medium text-sm text-foreground">{deal.dealName}</span>
            <span className="ml-2 text-xs text-muted-foreground">{deal.dealType}</span>
            {deal.isContentStudio && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Studio</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground">Rev {formatCurrency(deal.totalContractValue)}</span>
          <span className="text-xs font-mono text-muted-foreground">Cost {formatCurrency(deal.totalCreatorCost)}</span>
          <span className="text-xs font-mono text-success">{deal.grossMarginPercent}%</span>
          <StatusBadge status={deal.status} />
          <button onClick={toggleContentStudio} className={`p-1 rounded text-xs border ${deal.isContentStudio ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted"}`} title={deal.isContentStudio ? "Remove from Studio" : "Mark as Content Studio"}>
            CS
          </button>
          <button onClick={e => { e.stopPropagation(); setEditDeal(true); }} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{visibleCreators.length} creator{visibleCreators.length !== 1 ? "s" : ""} shown</span>
            <Button variant="outline" size="sm" onClick={() => setAddCreator(true)} className="h-7 text-xs gap-1"><Plus className="h-3 w-3" />Add Creators</Button>
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
                  <tr key={c.id} className={`data-table-row ${c.dealStatus === "Inactive" ? "bg-warning/5" : c.dealStatus === "Removed" ? "bg-destructive/5" : ""}`}>
                    <td className="py-2 font-medium text-foreground pr-3">{c.creatorName}</td>
                    <td className="py-2 pr-3"><span className={`text-xs px-1.5 py-0.5 rounded ${c.source === "In-house" ? "bg-primary/10 text-primary" : "bg-primary/15 text-primary font-medium"}`}>{c.source}</span></td>
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
                      <span>Email: {ho.creatorEmail}</span>
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
      <BulkAddCreatorDialog dealId={deal.id} open={addCreator} onClose={() => setAddCreator(false)} />
    </div>
  );
}

// ─── Client Card ────────────────────────────────────────
function ClientCard({ client }: { client: ClientV2 }) {
  const [expanded, setExpanded] = useState(false);
  const [editClient, setEditClient] = useState(false);
  const [addDeal, setAddDeal] = useState(false);
  const [showInactiveDeals, setShowInactiveDeals] = useState(false);
  const [showInactiveCreators, setShowInactiveCreators] = useState(false);

  const visibleDeals = (showInactiveDeals ? client.deals : client.deals.filter(d => d.status === "Active")).sort((a, b) => a.dealName.localeCompare(b.dealName));
  const totalRev = client.deals.reduce((s, d) => s + d.totalContractValue, 0);
  const totalCost = client.deals.reduce((s, d) => s + d.totalCreatorCost, 0);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="font-semibold text-foreground">{client.clientName}</p>
            <p className="text-xs text-muted-foreground">VSD: {client.vsdName || "—"} · BOPM: {client.principalBOPM || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Revenue</p><p className="font-mono text-foreground">{formatCurrency(totalRev)}</p></div>
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Cost</p><p className="font-mono text-muted-foreground">{formatCurrency(totalCost)}</p></div>
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Margin</p><p className="font-mono text-success">{totalRev ? ((totalRev - totalCost) / totalRev * 100).toFixed(1) : 0}%</p></div>
          <span className="text-xs text-muted-foreground">{client.deals.length} deal{client.deals.length !== 1 ? "s" : ""}</span>
          <button onClick={e => { e.stopPropagation(); setEditClient(true); }} className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><strong>VSD:</strong> {client.vsdName || "—"}</span>
            <span><strong>Principal BOPM:</strong> {client.principalBOPM || "—"}</span>
            <span><strong>Senior BOPM:</strong> {client.seniorBOPM || "—"}</span>
            <span><strong>Junior BOPM:</strong> {client.juniorBOPM || "—"}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showInactiveDeals} onChange={e => setShowInactiveDeals(e.target.checked)} className="rounded border-border" />
              Show completed/on-hold deals
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showInactiveCreators} onChange={e => setShowInactiveCreators(e.target.checked)} className="rounded border-border" />
              Show all creators
            </label>
            <Button variant="outline" size="sm" onClick={() => setAddDeal(true)} className="h-7 text-xs gap-1 ml-auto"><Plus className="h-3 w-3" />Add Deal</Button>
          </div>
          <div className="space-y-3">
            {visibleDeals.map(deal => <DealRow key={deal.id} deal={deal} showInactive={showInactiveCreators} />)}
            {visibleDeals.length === 0 && <p className="text-xs text-muted-foreground py-2">No active deals</p>}
          </div>
        </div>
      )}
      <EditClientDialog client={client} open={editClient} onClose={() => setEditClient(false)} />
      <AddDealDialog clientId={client.id} clientName={client.clientName} open={addDeal} onClose={() => setAddDeal(false)} />
    </div>
  );
}

// ─── CSV Import Dialog ──────────────────────────────────
function CSVImportDialog({ selectedPod, open, onClose }: { selectedPod: string; open: boolean; onClose: () => void }) {
  const [csvText, setCsvText] = useState("");
  const [targetPod, setTargetPod] = useState<PodName>(selectedPod !== "All" ? selectedPod as PodName : "Integrated");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string || "");
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([getClientCSVTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "client-deal-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    if (!csvText.trim()) { toast.error("No CSV data"); return; }
    const result = parseClientCSV(csvText, targetPod);
    toast.success(`Imported ${result.added} creator(s) into ${targetPod}`);
    setCsvText("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Import Clients & Deals via CSV</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1 text-xs"><Download className="h-3 w-3" />Download Template</Button>
            <span className="text-xs text-muted-foreground">Use the template to format your data</span>
          </div>
          <div>
            <Label className="text-xs">Target Pod</Label>
            <Select value={targetPod} onValueChange={v => setTargetPod(v as PodName)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{POD_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Upload CSV File</Label>
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="text-xs" />
          </div>
          <div>
            <Label className="text-xs">Or paste CSV data</Label>
            <Textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={6} placeholder="Paste CSV content here..." className="text-xs font-mono" />
          </div>
        </div>
        <DialogFooter><Button onClick={importData} disabled={!csvText.trim()}>Import</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Summary Stats ──────────────────────────────────────
function SummaryCards({ clients }: { clients: ClientV2[] }) {
  const allDeals = clients.flatMap(c => c.deals);
  const allCreators = allDeals.flatMap(d => d.creators);
  const activeDeals = allDeals.filter(d => d.status === "Active");
  const activeCreators = allCreators.filter(c => c.dealStatus === "Active");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard label="Total Clients" value={String(clients.length)} icon={User} />
      <StatCard label="Total Deals" value={String(allDeals.length)} icon={TrendingUp} />
      <StatCard label="Total Creators" value={String(allCreators.length)} icon={User} />
      <StatCard label="Active Clients" value={String(clients.filter(c => c.deals.some(d => d.status === "Active")).length)} icon={User} changeType="positive" />
      <StatCard label="Active Deals" value={String(activeDeals.length)} icon={TrendingUp} changeType="positive" />
      <StatCard label="Active Creators" value={String(activeCreators.length)} icon={User} changeType="positive" />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
const DealMargins = () => {
  const [_, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  const [selectedPod, setSelectedPod] = useState<string>("All");
  const [addClient, setAddClient] = useState(false);
  const [csvImport, setCsvImport] = useState(false);

  const pods = getPods();
  const allClients = pods.flatMap(p => p.clients);
  const visibleClients = selectedPod === "All" ? allClients : pods.find(p => p.name === selectedPod)?.clients ?? [];

  const handleExportCSV = () => {
    const csv = exportAllDataAsCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "talent-client-data.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported as CSV");
  };

  return (
    <div className="space-y-6 animate-fade-in" onClick={() => refresh()}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Talent X Client View</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
          <p className="text-sm text-muted-foreground mt-1">Pod → Client → Deal hierarchy with creator insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvImport(true)} className="gap-1 text-xs"><Upload className="h-3 w-3" />Import CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1 text-xs"><Download className="h-3 w-3" />Export CSV</Button>
          {selectedPod !== "All" && (
            <Button size="sm" onClick={() => setAddClient(true)} className="gap-1 text-xs"><Plus className="h-3 w-3" />Add Client</Button>
          )}
        </div>
      </div>

      <SummaryCards clients={visibleClients} />

      <Tabs value={selectedPod} onValueChange={setSelectedPod}>
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="All" className="text-xs font-mono">All</TabsTrigger>
          {POD_NAMES.map(name => (
            <TabsTrigger key={name} value={name} className="text-xs font-mono">{name}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="All" className="space-y-4 mt-4">
          {allClients.map(client => <ClientCard key={client.id} client={client} />)}
        </TabsContent>
        {pods.map(pod => (
          <TabsContent key={pod.name} value={pod.name} className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddClient(true)} className="gap-1 text-xs"><Plus className="h-3 w-3" />Add Client to {pod.name}</Button>
            </div>
            {pod.clients.length === 0 && <p className="text-sm text-muted-foreground">No clients in this pod</p>}
            {pod.clients.map(client => <ClientCard key={client.id} client={client} />)}
          </TabsContent>
        ))}
      </Tabs>

      {selectedPod !== "All" && (
        <AddClientDialog podName={selectedPod as PodName} open={addClient} onClose={() => setAddClient(false)} />
      )}
      <CSVImportDialog selectedPod={selectedPod} open={csvImport} onClose={() => setCsvImport(false)} />
    </div>
  );
};

export default DealMargins;
