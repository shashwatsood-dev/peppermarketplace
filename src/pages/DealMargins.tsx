import { useState, useMemo } from "react";
import {
  dbUpdateClient, dbUpdateDeal, dbUpdateCreator, dbAddCreatorToDeal, dbAddClientToPod, dbAddDealToClient,
  dbMoveClientToPod, dbCopyCreatorsToDeal, dbRemoveCreator, dbParseClientCSV, dbGetClientCSVTemplate, exportPodsAsCSV,
  dbDeleteClient,
} from "@/lib/db-store";
import { usePods, useRefreshPods } from "@/lib/use-pods";
import type { PodV2, ClientV2, DealV2, DeployedCreatorV2, CreatorDealStatus, HealthColor, ResourceSource, DealStatus, PodName, DealCapability } from "@/lib/talent-client-types";
import { POD_NAMES, ALL_POD_NAMES, DEAL_CAPABILITIES } from "@/lib/talent-client-types";
import { type RoleType, type PayModel } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendingUp, Users, ChevronDown, ChevronRight, Pencil, Plus, Circle, UserCheck, ExternalLink, User, Mail, Download, Upload, Trash2, ArrowRightLeft, Copy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getHandoversByDeal } from "@/lib/handover-store";
import type { CurrencyCode } from "@/lib/requisition-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
function EditClientDialog({ client, open, onClose, onDone }: { client: ClientV2; open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ vsdName: client.vsdName, principalBOPM: client.principalBOPM, seniorBOPM: client.seniorBOPM, juniorBOPM: client.juniorBOPM });
  const save = async () => { await dbUpdateClient(client.id, form); toast.success("Client updated"); onDone(); onClose(); };
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
function AddClientDialog({ podName, open, onClose, onDone }: { podName: PodName; open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ clientName: "", vsdName: "", principalBOPM: "", seniorBOPM: "", juniorBOPM: "" });
  const save = async () => {
    if (!form.clientName.trim()) { toast.error("Client name required"); return; }
    await dbAddClientToPod(podName, form);
    toast.success(`Client "${form.clientName}" added to ${podName}`);
    setForm({ clientName: "", vsdName: "", principalBOPM: "", seniorBOPM: "", juniorBOPM: "" });
    onDone(); onClose();
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

const VSD_POD_MAP: Record<string, PodName> = {
  "Aamir Khan": "Integrated",
  "Aditya Shaw": "BFSI",
  "Neema Jayadas": "US B2B",
  "Sneha Iyer": "FMCG",
  "Sumit Shekhawat": "India B2B",
};

// ─── Capability Multi-Select ────────────────────────────
function CapabilitySelect({ value, onChange }: { value: DealCapability[]; onChange: (v: DealCapability[]) => void }) {
  const toggle = (cap: DealCapability) => {
    onChange(value.includes(cap) ? value.filter(c => c !== cap) : [...value, cap]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {DEAL_CAPABILITIES.map(cap => (
        <button key={cap} type="button" onClick={() => toggle(cap)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${value.includes(cap) ? "bg-primary/15 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:bg-accent"}`}>
          {cap}
        </button>
      ))}
    </div>
  );
}

// ─── Add Deal Dialog ────────────────────────────────────
function AddDealDialog({ clientId, clientName, open, onClose, onDone }: { clientId: string; clientName: string; open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    dealName: "", dealType: "Retainer", status: "Active" as DealStatus, currency: "INR" as CurrencyCode,
    signingEntity: "", geography: "", vsdName: "", mrr: 0, contractDuration: "",
    contractStartDate: "", contractEndDate: "", capabilities: [] as DealCapability[], capabilityLeader: "",
  });
  const dealId = useMemo(() => `D-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, [open]);

  const save = async () => {
    if (!form.dealName.trim()) { toast.error("Deal name required"); return; }
    await dbAddDealToClient(clientId, form);
    toast.success(`Deal "${form.dealName}" added`);
    setForm({ dealName: "", dealType: "Retainer", status: "Active", currency: "INR", signingEntity: "", geography: "", vsdName: "", mrr: 0, contractDuration: "", contractStartDate: "", contractEndDate: "", capabilities: [], capabilityLeader: "" });
    onDone(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Deal to {clientName}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Deal ID (auto)</Label><Input value={dealId} disabled className="font-mono text-xs bg-muted/50" /></div>
          <div><Label className="text-xs">Deal Name *</Label><Input value={form.dealName} onChange={e => setForm(p => ({ ...p, dealName: e.target.value }))} placeholder="e.g. Content Retainer" /></div>
          <div><Label className="text-xs">VSD</Label>
            <Select value={form.vsdName || "none"} onValueChange={v => setForm(p => ({ ...p, vsdName: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Select VSD" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select —</SelectItem>
                {Object.keys(VSD_POD_MAP).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select></div>
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
          <div><Label className="text-xs">MRR (Monthly Recurring Revenue)</Label>
            <Input type="number" value={form.mrr || ""} onChange={e => setForm(p => ({ ...p, mrr: +e.target.value }))} placeholder="e.g. 500000" className="font-mono" /></div>
          <div><Label className="text-xs">Contract Duration</Label>
            <Input value={form.contractDuration} onChange={e => setForm(p => ({ ...p, contractDuration: e.target.value }))} placeholder="e.g. 12 months" /></div>
          <div><Label className="text-xs">Contract Start Date</Label>
            <Input type="date" value={form.contractStartDate} onChange={e => setForm(p => ({ ...p, contractStartDate: e.target.value }))} /></div>
          <div><Label className="text-xs">Contract End Date</Label>
            <Input type="date" value={form.contractEndDate} onChange={e => setForm(p => ({ ...p, contractEndDate: e.target.value }))} /></div>
          <div><Label className="text-xs">Geography</Label><Input value={form.geography} onChange={e => setForm(p => ({ ...p, geography: e.target.value }))} placeholder="e.g. India" /></div>
          <div><Label className="text-xs">Capability Leader</Label><Input value={form.capabilityLeader} onChange={e => setForm(p => ({ ...p, capabilityLeader: e.target.value }))} placeholder="e.g. John Doe" /></div>
          <div className="col-span-2"><Label className="text-xs">Capabilities</Label><CapabilitySelect value={form.capabilities} onChange={v => setForm(p => ({ ...p, capabilities: v }))} /></div>
          <div className="col-span-2"><Label className="text-xs">Signing Entity</Label><Input value={form.signingEntity} onChange={e => setForm(p => ({ ...p, signingEntity: e.target.value }))} placeholder="e.g. Pepper Content Pvt Ltd" /></div>
        </div>
        <DialogFooter><Button onClick={save}>Add Deal</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Deal Dialog ───────────────────────────────────
function EditDealDialog({ deal, open, onClose, onDone }: { deal: DealV2; open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    dealName: deal.dealName, dealType: deal.dealType, status: deal.status as DealStatus, vsdName: deal.vsdName || "",
    mrr: deal.mrr || 0, contractDuration: deal.contractDuration || "", contractStartDate: deal.contractStartDate || "",
    contractEndDate: deal.contractEndDate || "", capabilities: (deal.capabilities || []) as DealCapability[],
    capabilityLeader: deal.capabilityLeader || "", currency: deal.currency, signingEntity: deal.signingEntity || "", geography: deal.geography || "",
  });
  const [newDealId, setNewDealId] = useState(deal.id);
  const save = async () => {
    if (newDealId && newDealId !== deal.id) {
      await dbRenameDealId(deal.id, newDealId);
    }
    await dbUpdateDeal(newDealId || deal.id, form);
    toast.success("Deal updated");
    onDone(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Deal ID</Label><Input value={newDealId} onChange={e => setNewDealId(e.target.value)} className="font-mono text-xs" /></div>
          <div><Label className="text-xs">Deal Name</Label><Input value={form.dealName} onChange={e => setForm(p => ({ ...p, dealName: e.target.value }))} /></div>
          <div><Label className="text-xs">VSD</Label>
            <Select value={form.vsdName || "none"} onValueChange={v => setForm(p => ({ ...p, vsdName: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {Object.keys(VSD_POD_MAP).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select></div>
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
          <div><Label className="text-xs">MRR</Label>
            <Input type="number" value={form.mrr || ""} onChange={e => setForm(p => ({ ...p, mrr: +e.target.value }))} className="font-mono" /></div>
          <div><Label className="text-xs">Contract Duration</Label>
            <Input value={form.contractDuration} onChange={e => setForm(p => ({ ...p, contractDuration: e.target.value }))} placeholder="e.g. 12 months" /></div>
          <div><Label className="text-xs">Contract Start Date</Label>
            <Input type="date" value={form.contractStartDate} onChange={e => setForm(p => ({ ...p, contractStartDate: e.target.value }))} /></div>
          <div><Label className="text-xs">Contract End Date</Label>
            <Input type="date" value={form.contractEndDate} onChange={e => setForm(p => ({ ...p, contractEndDate: e.target.value }))} /></div>
          <div><Label className="text-xs">Geography</Label><Input value={form.geography} onChange={e => setForm(p => ({ ...p, geography: e.target.value }))} /></div>
          <div><Label className="text-xs">Capability Leader</Label><Input value={form.capabilityLeader} onChange={e => setForm(p => ({ ...p, capabilityLeader: e.target.value }))} /></div>
          <div className="col-span-2"><Label className="text-xs">Capabilities</Label><CapabilitySelect value={form.capabilities} onChange={v => setForm(p => ({ ...p, capabilities: v }))} /></div>
          <div className="col-span-2"><Label className="text-xs">Signing Entity</Label><Input value={form.signingEntity} onChange={e => setForm(p => ({ ...p, signingEntity: e.target.value }))} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Creator Dialog ────────────────────────────────
function EditCreatorDialog({ creator, open, onClose, onDone }: { creator: DeployedCreatorV2; open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    creatorName: creator.creatorName, role: creator.role, source: creator.source as ResourceSource,
    payModel: creator.payModel, payRate: creator.payRate, expectedVolume: creator.expectedVolume,
    totalCost: creator.totalCost, clientBilling: creator.clientBilling, city: creator.city,
    opsLink: creator.opsLink, linkedinId: creator.linkedinId, currency: creator.currency as CurrencyCode,
  });

  const save = async () => {
    await dbUpdateCreator(creator.id, form);
    toast.success("Creator updated");
    onDone(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Creator — {creator.creatorName}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Creator Name</Label><Input value={form.creatorName} onChange={e => setForm(p => ({ ...p, creatorName: e.target.value }))} /></div>
          <div><Label className="text-xs">Role</Label>
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v as RoleType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Writer", "Editor", "Designer", "Video", "Translator", "Other"] as RoleType[]).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs">Source</Label>
            <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v as ResourceSource }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Freelancer">Freelancer</SelectItem><SelectItem value="In-house">In-house</SelectItem></SelectContent>
            </Select></div>
          <div><Label className="text-xs">Pay Model</Label>
            <Select value={form.payModel} onValueChange={v => setForm(p => ({ ...p, payModel: v as PayModel }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Per Word", "Per Assignment", "Retainer", "Hourly"] as PayModel[]).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs">Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v as CurrencyCode }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="INR">INR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
            </Select></div>
          <div><Label className="text-xs">Creator Unit Rate</Label><Input type="number" className="font-mono" value={form.payRate || ""} onChange={e => setForm(p => ({ ...p, payRate: +e.target.value }))} /></div>
          <div><Label className="text-xs">Expected Volume</Label><Input type="number" className="font-mono" value={form.expectedVolume || ""} onChange={e => setForm(p => ({ ...p, expectedVolume: +e.target.value }))} /></div>
          <div><Label className="text-xs">Total Cost</Label><Input type="number" className="font-mono" value={form.totalCost || ""} onChange={e => setForm(p => ({ ...p, totalCost: +e.target.value }))} /></div>
          <div><Label className="text-xs">Client Unit Price</Label><Input type="number" className="font-mono" value={form.clientBilling || ""} onChange={e => setForm(p => ({ ...p, clientBilling: +e.target.value }))} /></div>
          {form.source !== "Freelancer" && (
            <div><Label className="text-xs">City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
          )}
          <div className={form.source !== "Freelancer" ? "" : "col-span-2"}><Label className="text-xs">Ops Link</Label><Input value={form.opsLink} onChange={e => setForm(p => ({ ...p, opsLink: e.target.value }))} placeholder="https://..." /></div>
          <div className="col-span-2"><Label className="text-xs">LinkedIn</Label><Input value={form.linkedinId} onChange={e => setForm(p => ({ ...p, linkedinId: e.target.value }))} placeholder="https://linkedin.com/in/..." /></div>
        </div>
        <DialogFooter><Button onClick={save}>Save Changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Add Creator (Card Layout) ─────────────────────
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
  opsLink: string;
  linkedinId: string;
  currency: CurrencyCode;
}

function emptyLineItem(): CreatorLineItem {
  return { id: crypto.randomUUID(), creatorName: "", role: "Writer", source: "Freelancer", payModel: "Per Word", payRate: 0, totalCost: 0, clientBilling: 0, city: "", opsLink: "", linkedinId: "", currency: "INR" };
}

function BulkAddCreatorDialog({ dealId, open, onClose, onDone }: { dealId: string; open: boolean; onClose: () => void; onDone: () => void }) {
  const [rows, setRows] = useState<CreatorLineItem[]>([emptyLineItem()]);

  const updateRow = (id: string, updates: Partial<CreatorLineItem>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyLineItem()]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const save = async () => {
    const valid = rows.filter(r => r.creatorName.trim());
    if (valid.length === 0) { toast.error("At least one creator name required"); return; }
    for (const r of valid) {
      await dbAddCreatorToDeal(dealId, {
        creatorName: r.creatorName, role: r.role, source: r.source, payModel: r.payModel,
        payRate: r.payRate, expectedVolume: 0, totalCost: r.totalCost, clientBilling: r.clientBilling,
        dealStatus: "Active", capabilityLeadRating: "", bopmRating: "", city: r.city,
        opsLink: r.opsLink, linkedinId: r.linkedinId, currency: r.currency,
      });
    }
    toast.success(`${valid.length} creator(s) added`);
    setRows([emptyLineItem()]);
    onDone(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Creators to Deal</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {rows.map((r, idx) => (
            <div key={r.id} className="border border-border rounded-lg p-4 bg-card/50 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">Creator #{idx + 1}</span>
                <button onClick={() => removeRow(r.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {/* Row 1: Name, Role, Source */}
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Creator Name *</Label><Input placeholder="Name" value={r.creatorName} onChange={e => updateRow(r.id, { creatorName: e.target.value })} /></div>
                <div><Label className="text-xs">Role</Label>
                  <Select value={r.role} onValueChange={v => updateRow(r.id, { role: v as RoleType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["Writer", "Editor", "Designer", "Video", "Translator", "Other"] as RoleType[]).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label className="text-xs">Source</Label>
                  <Select value={r.source} onValueChange={v => updateRow(r.id, { source: v as ResourceSource })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Freelancer">Freelancer</SelectItem><SelectItem value="In-house">In-house</SelectItem></SelectContent>
                  </Select></div>
              </div>
              {/* Row 2: Pay Model, Currency, Unit Rate, Cost, Client Unit Price */}
              <div className="grid grid-cols-5 gap-3">
                <div><Label className="text-xs">Pay Model</Label>
                  <Select value={r.payModel} onValueChange={v => updateRow(r.id, { payModel: v as PayModel })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["Per Word", "Per Assignment", "Retainer", "Hourly"] as PayModel[]).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label className="text-xs">Currency</Label>
                  <Select value={r.currency} onValueChange={v => updateRow(r.id, { currency: v as CurrencyCode })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="INR">INR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                  </Select></div>
                <div><Label className="text-xs">Creator Unit Rate</Label><Input type="number" className="font-mono" placeholder="Rate" value={r.payRate || ""} onChange={e => updateRow(r.id, { payRate: +e.target.value })} /></div>
                <div><Label className="text-xs">Cost</Label><Input type="number" className="font-mono" placeholder="Cost" value={r.totalCost || ""} onChange={e => updateRow(r.id, { totalCost: +e.target.value })} /></div>
                <div><Label className="text-xs">Client Unit Price</Label><Input type="number" className="font-mono" placeholder="Billing" value={r.clientBilling || ""} onChange={e => updateRow(r.id, { clientBilling: +e.target.value })} /></div>
              </div>
              {/* Row 3: Ops Link, LinkedIn, City (conditional) */}
              <div className={`grid gap-3 ${r.source !== "Freelancer" ? "grid-cols-3" : "grid-cols-2"}`}>
                <div><Label className="text-xs">Ops Link</Label><Input placeholder="https://..." value={r.opsLink} onChange={e => updateRow(r.id, { opsLink: e.target.value })} /></div>
                <div><Label className="text-xs">LinkedIn</Label><Input placeholder="https://linkedin.com/in/..." value={r.linkedinId} onChange={e => updateRow(r.id, { linkedinId: e.target.value })} /></div>
                {r.source !== "Freelancer" && (
                  <div><Label className="text-xs">City</Label><Input placeholder="City" value={r.city} onChange={e => updateRow(r.id, { city: e.target.value })} /></div>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Another Creator</Button>
        </div>
        <DialogFooter><Button onClick={save}>Add {rows.filter(r => r.creatorName.trim()).length} Creator(s)</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transfer/Copy Creators Dialog ──────────────────────
function TransferCreatorsDialog({ dealId, creators, otherDeals, open, onClose, onDone }: { dealId: string; creators: DeployedCreatorV2[]; otherDeals: DealV2[]; open: boolean; onClose: () => void; onDone: () => void }) {
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [targetDealId, setTargetDealId] = useState("");
  const [mode, setMode] = useState<"copy" | "move">("copy");

  const toggleCreator = (id: string) => {
    setSelectedCreators(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedCreators.size === creators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(creators.map(c => c.id)));
    }
  };

  const handleTransfer = async () => {
    if (selectedCreators.size === 0) { toast.error("Select at least one creator"); return; }
    if (!targetDealId) { toast.error("Select a target deal"); return; }
    await dbCopyCreatorsToDeal(dealId, targetDealId, Array.from(selectedCreators), mode === "move");
    const targetDeal = otherDeals.find(d => d.id === targetDealId);
    toast.success(`${selectedCreators.size} creator(s) ${mode === "move" ? "moved" : "copied"} to ${targetDeal?.dealName || targetDealId}`);
    setSelectedCreators(new Set());
    setTargetDealId("");
    onDone(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "copy" ? "Copy" : "Move"} Creators to Another Deal</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "copy" ? "default" : "outline"} size="sm" onClick={() => setMode("copy")} className="gap-1 text-xs"><Copy className="h-3 w-3" />Copy</Button>
            <Button variant={mode === "move" ? "default" : "outline"} size="sm" onClick={() => setMode("move")} className="gap-1 text-xs"><ArrowRightLeft className="h-3 w-3" />Move</Button>
          </div>
          <div>
            <Label className="text-xs">Target Deal</Label>
            {otherDeals.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">No other deals for this client. Add a deal first.</p>
            ) : (
              <Select value={targetDealId} onValueChange={setTargetDealId}>
                <SelectTrigger><SelectValue placeholder="Select target deal" /></SelectTrigger>
                <SelectContent>
                  {otherDeals.map(d => <SelectItem key={d.id} value={d.id}>{d.dealName} ({d.id})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Select Creators</Label>
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-xs">
                {selectedCreators.size === creators.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto border border-border rounded-md p-2">
              {creators.map(c => (
                <label key={c.id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedCreators.has(c.id)} onChange={() => toggleCreator(c.id)} className="rounded border-border" />
                  <span className="font-medium text-foreground">{c.creatorName}</span>
                  <span className="text-xs text-muted-foreground">{c.role}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-auto">{formatCurrency(c.clientBilling)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleTransfer} disabled={selectedCreators.size === 0 || !targetDealId}>
            {mode === "copy" ? "Copy" : "Move"} {selectedCreators.size} Creator(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function CreatorStatusSelect({ creatorId, creator, onDone }: { creatorId: string; creator: DeployedCreatorV2; onDone: () => void }) {
  return (
    <Select value={creator.dealStatus} onValueChange={async v => { await dbUpdateCreator(creatorId, { dealStatus: v as CreatorDealStatus }); toast.success("Status updated"); onDone(); }}>
      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {(["Active", "Inactive", "Removed", "Flagged"] as CreatorDealStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RatingSelect({ creatorId, field, value, onDone }: { creatorId: string; field: "capabilityLeadRating" | "bopmRating"; value: HealthColor | ""; onDone: () => void }) {
  const [reasonDialog, setReasonDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<HealthColor | "">("");

  const handleChange = async (v: string) => {
    const newVal = v === "none" ? "" : v as HealthColor;
    if (newVal === "yellow" || newVal === "red") {
      setPendingRating(newVal);
      setReasonDialog(true);
    } else {
      await dbUpdateCreator(creatorId, { [field]: newVal });
      onDone();
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
        onSave={async (reason) => {
          await dbUpdateCreator(creatorId, { [field]: pendingRating, [reasonField]: reason });
          toast.success("Rating updated with reason");
          onDone();
        }}
      />
    </>
  );
}

// ─── Deal Row ───────────────────────────────────────────
function DealRow({ deal, showInactive, otherDeals, onDone }: { deal: DealV2; showInactive: boolean; otherDeals: DealV2[]; onDone: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editDeal, setEditDeal] = useState(false);
  const [addCreator, setAddCreator] = useState(false);
  const [transferCreators, setTransferCreators] = useState(false);
  const [editingCreator, setEditingCreator] = useState<DeployedCreatorV2 | null>(null);

  const visibleCreators = showInactive ? deal.creators : deal.creators.filter(c => c.dealStatus === "Active");
  const handovers = getHandoversByDeal(deal.id);

  const toggleContentStudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await dbUpdateDeal(deal.id, { isContentStudio: !deal.isContentStudio });
    toast.success(deal.isContentStudio ? "Removed from Content Studio" : "Added to Content Studio");
    onDone();
  };

  return (
    <div className="border border-border rounded-md bg-card/50">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">{deal.dealName}</span>
            <span className="text-xs font-mono text-muted-foreground">({deal.id})</span>
            <span className="text-xs text-muted-foreground">{deal.dealType}</span>
            {deal.vsdName && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{deal.vsdName}</span>}
            {deal.isContentStudio && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Studio</span>}
            {(deal.capabilities || []).map(cap => (
              <Badge key={cap} variant="outline" className="text-[10px] px-1.5 py-0">{cap}</Badge>
            ))}
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
             <div className="flex items-center gap-2">
               {deal.creators.length > 0 && (
                 <Button variant="outline" size="sm" onClick={() => setTransferCreators(true)} className="h-7 text-xs gap-1"><ArrowRightLeft className="h-3 w-3" />Transfer/Copy</Button>
               )}
               <Button variant="outline" size="sm" onClick={() => setAddCreator(true)} className="h-7 text-xs gap-1"><Plus className="h-3 w-3" />Add Creators</Button>
             </div>
           </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
               <tr className="border-b border-border text-left">
                  {["Creator", "Ops Link", "LinkedIn", "Role", "Pay Model", "Currency", "Creator Unit Rate", "Cost", "Client Unit Price", "Margin%", "Cap Lead", "BOPM", "Status", ""].map(h => (
                    <th key={h} className="pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCreators.map(c => (
                  <tr key={c.id} className={`data-table-row ${c.dealStatus === "Inactive" ? "bg-warning/5" : c.dealStatus === "Removed" ? "bg-destructive/5" : ""}`}>
                    <td className="py-2 font-medium text-foreground pr-3">{c.creatorName}</td>
                    <td className="py-2 pr-3">{c.opsLink ? <a href={c.opsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate max-w-[100px] inline-block">Link</a> : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="py-2 pr-3">{c.linkedinId ? <a href={c.linkedinId} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate max-w-[100px] inline-block">Profile</a> : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="py-2 text-muted-foreground pr-3">{c.role}</td>
                    <td className="py-2 text-muted-foreground pr-3">{c.payModel}</td>
                    <td className="py-2 text-muted-foreground pr-3">{c.currency}</td>
                    <td className="py-2 font-mono text-foreground pr-3">{c.payRate.toLocaleString()}</td>
                    <td className="py-2 font-mono text-muted-foreground pr-3">{formatCurrency(c.totalCost)}</td>
                    <td className="py-2 font-mono text-foreground pr-3">{formatCurrency(c.clientBilling)}</td>
                    <td className="py-2 font-mono text-success pr-3">{c.grossMarginPercent}%</td>
                    <td className="py-2 pr-3"><RatingSelect creatorId={c.id} field="capabilityLeadRating" value={c.capabilityLeadRating} onDone={onDone} /></td>
                    <td className="py-2 pr-3"><RatingSelect creatorId={c.id} field="bopmRating" value={c.bopmRating} onDone={onDone} /></td>
                    <td className="py-2 pr-1"><CreatorStatusSelect creatorId={c.id} creator={c} onDone={onDone} /></td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingCreator(c)} className="p-1 rounded hover:bg-muted" title="Edit creator"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        <button onClick={async () => { await dbRemoveCreator(c.id); toast.success(`Removed ${c.creatorName}`); onDone(); }} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Remove creator"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
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

      <EditDealDialog deal={deal} open={editDeal} onClose={() => setEditDeal(false)} onDone={onDone} />
      <BulkAddCreatorDialog dealId={deal.id} open={addCreator} onClose={() => setAddCreator(false)} onDone={onDone} />
      {deal.creators.length > 0 && <TransferCreatorsDialog dealId={deal.id} creators={deal.creators} otherDeals={otherDeals} open={transferCreators} onClose={() => setTransferCreators(false)} onDone={onDone} />}
      {editingCreator && <EditCreatorDialog creator={editingCreator} open={!!editingCreator} onClose={() => setEditingCreator(null)} onDone={onDone} />}
    </div>
  );
}

// ─── Client Card ────────────────────────────────────────
function ClientCard({ client, filterDeals, onDone }: { client: ClientV2; filterDeals?: DealV2[]; onDone: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editClient, setEditClient] = useState(false);
  const [addDeal, setAddDeal] = useState(false);
  const [showInactiveDeals, setShowInactiveDeals] = useState(false);
  const [showInactiveCreators, setShowInactiveCreators] = useState(false);

  const deals = filterDeals ?? client.deals;
  const visibleDeals = (showInactiveDeals ? deals : deals.filter(d => d.status === "Active")).sort((a, b) => a.dealName.localeCompare(b.dealName));
  const totalRev = deals.reduce((s, d) => s + d.totalContractValue, 0);
  const totalCost = deals.reduce((s, d) => s + d.totalCreatorCost, 0);

  // Build BOPM subtitle showing all three names
  const bopmParts: string[] = [];
  if (client.principalBOPM) bopmParts.push(`P: ${client.principalBOPM}`);
  if (client.seniorBOPM) bopmParts.push(`S: ${client.seniorBOPM}`);
  if (client.juniorBOPM) bopmParts.push(`J: ${client.juniorBOPM}`);
  const bopmLine = bopmParts.length > 0 ? bopmParts.join(" · ") : "—";

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="font-semibold text-foreground">{client.clientName}</p>
            <p className="text-xs text-muted-foreground">BOPM: {bopmLine}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Revenue</p><p className="font-mono text-foreground">{formatCurrency(totalRev)}</p></div>
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Cost</p><p className="font-mono text-foreground">{formatCurrency(totalCost)}</p></div>
          <div className="text-right"><p className="text-xs font-mono uppercase text-muted-foreground">Margin</p><p className="font-mono text-success">{totalRev ? Math.round((totalRev - totalCost) / totalRev * 1000) / 10 : 0}%</p></div>
          <button onClick={e => { e.stopPropagation(); setEditClient(true); }} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
          <button onClick={async (e) => {
            e.stopPropagation();
            if (!confirm(`Delete client "${client.clientName}" and all its deals?`)) return;
            try {
              await dbDeleteClient(client.id);
              toast.success(`"${client.clientName}" deleted`);
              onDone();
            } catch (err: any) { toast.error("Failed: " + err.message); }
          }} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
            {visibleDeals.map(deal => {
              const otherDeals = client.deals.filter(d => d.id !== deal.id);
              return <DealRow key={deal.id} deal={deal} showInactive={showInactiveCreators} otherDeals={otherDeals} onDone={onDone} />;
            })}
            {visibleDeals.length === 0 && <p className="text-xs text-muted-foreground py-2">No active deals</p>}
          </div>
        </div>
      )}
      <EditClientDialog client={client} open={editClient} onClose={() => setEditClient(false)} onDone={onDone} />
      <AddDealDialog clientId={client.id} clientName={client.clientName} open={addDeal} onClose={() => setAddDeal(false)} onDone={onDone} />
    </div>
  );
}

// ─── CSV Import Dialog ──────────────────────────────────
function CSVImportDialog({ selectedPod, open, onClose, onDone }: { selectedPod: string; open: boolean; onClose: () => void; onDone: () => void }) {
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
    const blob = new Blob([dbGetClientCSVTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "client-deal-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async () => {
    if (!csvText.trim()) { toast.error("No CSV data"); return; }
    const result = await dbParseClientCSV(csvText, targetPod);
    toast.success(`Imported ${result.added} creator(s) into ${targetPod}`);
    setCsvText("");
    onDone(); onClose();
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

// ─── Unassigned Client Row ──────────────────────────────
function UnassignedClientRow({ client, onDone }: { client: ClientV2; onDone: () => void }) {
  const [selectedPodTarget, setSelectedPodTarget] = useState<string>("");
  const [vsd, setVsd] = useState(client.vsdName);

  const handleAssign = async () => {
    if (!selectedPodTarget) { toast.error("Select a pod"); return; }
    if (vsd.trim()) await dbUpdateClient(client.id, { vsdName: vsd.trim() });
    await dbMoveClientToPod(client.id, selectedPodTarget as PodName);
    toast.success(`"${client.clientName}" assigned to ${selectedPodTarget}`);
    onDone();
  };

  const handleVsdChange = (v: string) => {
    setVsd(v);
    if (VSD_POD_MAP[v]) setSelectedPodTarget(VSD_POD_MAP[v]);
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-md border border-border bg-card">
      <div className="flex-1">
        <p className="font-medium text-sm text-foreground">{client.clientName}</p>
        <p className="text-xs text-muted-foreground">{client.deals.length} deal{client.deals.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex items-center gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">VSD</Label>
          <Select value={vsd} onValueChange={handleVsdChange}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Select VSD" /></SelectTrigger>
            <SelectContent>
              {Object.keys(VSD_POD_MAP).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Pod</Label>
          <Select value={selectedPodTarget} onValueChange={setSelectedPodTarget}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Select Pod" /></SelectTrigger>
            <SelectContent>
              {POD_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleAssign} className="h-8 text-xs mt-3.5">Assign</Button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
const DealMargins = () => {
  const { data: pods, isLoading } = usePods();
  const refresh = useRefreshPods();
  const [selectedPod, setSelectedPod] = useState<string>("All");
  const [addClient, setAddClient] = useState(false);
  const [csvImport, setCsvImport] = useState(false);
  const [showClosedClients, setShowClosedClients] = useState(false);

  if (isLoading || !pods) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-semibold text-foreground">Talent X Client View</h1><div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    );
  }

  const allClientsRaw = pods.flatMap(p => p.clients);
  const clientMap = new Map<string, ClientV2>();
  allClientsRaw.forEach(c => clientMap.set(c.id, c));
  const allClients = Array.from(clientMap.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));

  const isClientAllClosed = (c: ClientV2) => c.deals.length > 0 && c.deals.every(d => d.status === "Completed" || (d.status as string) === "Closed");
  const filterClosed = (clients: ClientV2[]) => showClosedClients ? clients : clients.filter(c => !isClientAllClosed(c));

  const getClientsForPod = (podName: string): { client: ClientV2; deals: DealV2[] }[] => {
    const vsdNames = Object.entries(VSD_POD_MAP).filter(([, pod]) => pod === podName).map(([vsd]) => vsd);
    const results: { client: ClientV2; deals: DealV2[] }[] = [];
    for (const client of allClients) {
      const podDeals = client.deals.filter(d => vsdNames.includes(d.vsdName));
      if (podDeals.length > 0) results.push({ client, deals: podDeals });
    }
    return results.sort((a, b) => a.client.clientName.localeCompare(b.client.clientName));
  };

  const unassignedEntries = allClients.filter(c => c.deals.some(d => !d.vsdName || !VSD_POD_MAP[d.vsdName])).map(c => ({
    client: c,
    deals: c.deals.filter(d => !d.vsdName || !VSD_POD_MAP[d.vsdName]),
  }));

  const closedClientCount = allClients.filter(isClientAllClosed).length;

  const visibleClients = (() => {
    if (selectedPod === "All") return filterClosed(allClients);
    if (selectedPod === "Unassigned") return filterClosed(unassignedEntries.map(e => e.client));
    const podClients = getClientsForPod(selectedPod);
    const mapped = podClients.map(({ client, deals }) => ({ ...client, deals }));
    return filterClosed(mapped);
  })();

  const handleExportCSV = () => {
    const csv = exportPodsAsCSV(pods);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "talent-client-data.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported as CSV");
  };

  return (
    <div className="space-y-6 animate-fade-in">
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

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showClosedClients} onChange={e => setShowClosedClients(e.target.checked)} className="rounded border-border" />
          Show closed clients ({closedClientCount})
        </label>
      </div>

      <Tabs value={selectedPod} onValueChange={setSelectedPod}>
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="All" className="text-xs font-mono">All</TabsTrigger>
          {POD_NAMES.map(name => (
            <TabsTrigger key={name} value={name} className="text-xs font-mono">{name} ({getClientsForPod(name).length})</TabsTrigger>
          ))}
          {unassignedEntries.length > 0 && (
            <TabsTrigger value="Unassigned" className="text-xs font-mono text-warning">⚠ Unassigned ({unassignedEntries.length})</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="All" className="space-y-4 mt-4">
          {filterClosed(allClients).map(client => <ClientCard key={client.id} client={client} onDone={refresh} />)}
        </TabsContent>
        {POD_NAMES.map(podName => {
          const podClients = getClientsForPod(podName);
          const filtered = showClosedClients ? podClients : podClients.filter(({ client }) => !isClientAllClosed(client));
          return (
            <TabsContent key={podName} value={podName} className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setAddClient(true)} className="gap-1 text-xs"><Plus className="h-3 w-3" />Add Client to {podName}</Button>
              </div>
              {filtered.length === 0 && <p className="text-sm text-muted-foreground">No clients in this pod</p>}
              {filtered.map(({ client, deals }) => <ClientCard key={`${client.id}-${podName}`} client={client} filterDeals={deals} onDone={refresh} />)}
            </TabsContent>
          );
        })}
        {unassignedEntries.length > 0 && (
          <TabsContent value="Unassigned" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Deals without VSD Assignment</h3>
              <p className="text-xs text-muted-foreground mb-4">These deals need a VSD assigned. Edit each deal to set a VSD, which will automatically map it to the correct pod.</p>
              <div className="space-y-3">
                {unassignedEntries.map(({ client, deals }) => (
                  <ClientCard key={`${client.id}-unassigned`} client={client} filterDeals={deals} onDone={refresh} />
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {selectedPod !== "All" && selectedPod !== "Unassigned" && (
        <AddClientDialog podName={selectedPod as PodName} open={addClient} onClose={() => setAddClient(false)} onDone={refresh} />
      )}
      <CSVImportDialog selectedPod={selectedPod} open={csvImport} onClose={() => setCsvImport(false)} onDone={refresh} />
    </div>
  );
};

export default DealMargins;
