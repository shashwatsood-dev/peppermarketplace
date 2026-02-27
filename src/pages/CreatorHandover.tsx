import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { addHandover, formatHandoverForSharing, getHandovers } from "@/lib/handover-store";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { CREATOR_TYPES, getCurrencySymbol, type CurrencyCode } from "@/lib/requisition-types";
import { CurrencySelect } from "@/components/CurrencyInput";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, Send, UserPlus, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { PayModel } from "@/lib/mock-data";

const PAYMENT_MODELS: PayModel[] = ["Per Word", "Per Assignment", "Retainer", "Hourly"];

// Filter requisitions to only show eligible statuses
const ELIGIBLE_STATUSES = ["Yet to start", "In progress", "Approved but not assigned"];

interface CreatorEntry {
  id: string;
  creatorName: string;
  creatorEmail: string;
  creatorType: string;
  pepperPortalLink: string;
  phone: string;
  paymentModel: PayModel | "";
  finalizedPay: string;
  marginFromRequisition: number;
  marginOverridden: boolean;
}

function createEmptyCreator(): CreatorEntry {
  return {
    id: crypto.randomUUID(),
    creatorName: "",
    creatorEmail: "",
    creatorType: "",
    pepperPortalLink: "",
    phone: "",
    paymentModel: "",
    finalizedPay: "",
    marginFromRequisition: 0,
    marginOverridden: false,
  };
}

const CreatorHandover = () => {
  const [handoversList, setHandoversList] = useState(getHandovers());
  const [creators, setCreators] = useState<CreatorEntry[]>([createEmptyCreator()]);
  const [dealId, setDealId] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [sharedTo, setSharedTo] = useState("");
  const [shareViaEmail, setShareViaEmail] = useState(false);
  const [shareViaSlack, setShareViaSlack] = useState(false);
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");

  // Get eligible requisitions
  const eligibleReqs = advancedRequisitions.filter(r => ELIGIBLE_STATUSES.includes(r.status));

  const selectedReq = advancedRequisitions.find(r => {
    const reqDealId = r.flow === "sales" ? r.id : r.hiringData?.dealId;
    return reqDealId === dealId || r.id === dealId;
  });

  // Get display label: Client - Deal Name
  const getReqLabel = (r: typeof advancedRequisitions[0]) => {
    const client = r.flow === "sales" ? r.salesData?.clientName : r.hiringData?.clientName;
    const deal = r.flow === "sales" ? r.salesData?.opportunityName : r.hiringData?.dealId;
    return `${client} — ${deal || r.id}`;
  };

  const updateCreator = (id: string, updates: Partial<CreatorEntry>) => {
    setCreators(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addCreator = () => setCreators(prev => [...prev, createEmptyCreator()]);
  const removeCreator = (id: string) => setCreators(prev => prev.filter(c => c.id !== id));

  // Auto-fill margin from requisition
  const handleDealChange = (id: string) => {
    setDealId(id);
    const req = advancedRequisitions.find(r => r.id === id || r.hiringData?.dealId === id);
    if (req) {
      setCreators(prev => prev.map(c => ({ ...c, marginFromRequisition: req.grossMarginPercent })));
    }
  };

  const handleSubmit = () => {
    const validCreators = creators.filter(c => c.creatorName && c.paymentModel && c.finalizedPay);
    if (validCreators.length === 0) { toast.error("At least one creator with all required fields"); return; }
    if (!dealId) { toast.error("Select a deal"); return; }
    if (!shareViaEmail && !shareViaSlack) { toast.error("Select at least one sharing channel"); return; }

    const sharedVia: ("email" | "slack")[] = [];
    if (shareViaEmail) sharedVia.push("email");
    if (shareViaSlack) sharedVia.push("slack");

    let lastHandover: any;
    for (const c of validCreators) {
      lastHandover = addHandover({
        requisitionId: selectedReq?.id || "",
        dealId,
        creatorName: c.creatorName,
        creatorEmail: c.creatorEmail,
        creatorType: c.creatorType,
        pepperPortalLink: c.pepperPortalLink,
        phone: c.phone,
        paymentModel: c.paymentModel as PayModel,
        finalizedPay: Number(c.finalizedPay),
        currency,
        handoverDate: new Date().toISOString().split("T")[0],
        sharedVia,
        sharedTo,
        notes,
        recruiterName,
        marginFromRequisition: c.marginFromRequisition,
        marginOverridden: c.marginOverridden,
      });
    }

    if (lastHandover) {
      navigator.clipboard.writeText(formatHandoverForSharing(lastHandover));
    }

    toast.success(`${validCreators.length} creator(s) handed over! Share message copied.`, { duration: 5000 });
    setHandoversList(getHandovers());
    setCreators([createEmptyCreator()]);
    setDealId("");
    setRecruiterName("");
    setSharedTo("");
    setShareViaEmail(false);
    setShareViaSlack(false);
    setNotes("");
  };

  const sym = getCurrencySymbol(currency);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Creator Handover</h1>
        <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
        <p className="text-sm text-muted-foreground mt-1">Hand over finalized creators to the Account Management team</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><UserPlus className="h-5 w-5" /> New Handover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deal Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Associated Deal *</Label>
              <Select value={dealId} onValueChange={handleDealChange}>
                <SelectTrigger><SelectValue placeholder="Select deal" /></SelectTrigger>
                <SelectContent>
                  {eligibleReqs.map(r => (
                    <SelectItem key={r.id} value={r.id}>{getReqLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReq && (
                <p className="text-xs text-muted-foreground">
                  Margin: {selectedReq.grossMarginPercent}% · Status: {selectedReq.status}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recruiter (Handing Over) *</Label>
              <Input placeholder="Recruiter name" value={recruiterName} onChange={e => setRecruiterName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>

          <Separator />

          {/* Multiple Creators */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Creators ({creators.length})</Label>
              <Button variant="outline" size="sm" onClick={addCreator} className="gap-1"><Plus className="h-3 w-3" /> Add Creator</Button>
            </div>

            {creators.map((c, idx) => (
              <div key={c.id} className="border border-border rounded-lg p-4 space-y-3 bg-background/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Creator {idx + 1}</h4>
                  {creators.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCreator(c.id)} className="text-destructive h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Creator Name *</Label>
                    <Input placeholder="Full name" value={c.creatorName} onChange={e => updateCreator(c.id, { creatorName: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Registered Creator Email *</Label>
                    <Input placeholder="creator@email.com" value={c.creatorEmail} onChange={e => updateCreator(c.id, { creatorEmail: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Creator Type *</Label>
                    <Select value={c.creatorType} onValueChange={v => updateCreator(c.id, { creatorType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{CREATOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="space-y-1.5"><Label className="text-xs">Portal Link</Label>
                    <Input placeholder="https://ops..." value={c.pepperPortalLink} onChange={e => updateCreator(c.id, { pepperPortalLink: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Phone</Label>
                    <Input placeholder="+91 XXXXX" value={c.phone} onChange={e => updateCreator(c.id, { phone: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Payment Model *</Label>
                    <Select value={c.paymentModel} onValueChange={v => updateCreator(c.id, { paymentModel: v as PayModel })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{PAYMENT_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="space-y-1.5"><Label className="text-xs">Finalized Pay ({sym}) *</Label>
                    <Input type="number" placeholder={`${sym} amount`} value={c.finalizedPay} onChange={e => updateCreator(c.id, { finalizedPay: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Margin % (from requisition)</Label>
                    <div className="flex gap-2">
                      <Input type="number" value={c.marginFromRequisition} onChange={e => updateCreator(c.id, { marginFromRequisition: Number(e.target.value), marginOverridden: true })} />
                      {c.marginOverridden && <span className="text-xs text-warning self-center">Overridden</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Sharing */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Share via *</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="email" checked={shareViaEmail} onCheckedChange={c => setShareViaEmail(!!c)} />
                <label htmlFor="email" className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer"><Mail className="h-4 w-4" /> Email</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="slack" checked={shareViaSlack} onCheckedChange={c => setShareViaSlack(!!c)} />
                <label htmlFor="slack" className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer"><MessageSquare className="h-4 w-4" /> Slack</label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recipient</Label>
              <Input placeholder="e.g. am-team@pepper.com or #account-management" value={sharedTo} onChange={e => setSharedTo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea placeholder="Any context for the AM team..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>

          {/* Briefing Call Scheduling */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
            <Label className="text-sm font-medium flex items-center gap-2">📞 Briefing Call (Optional)</Label>
            <p className="text-xs text-muted-foreground">Schedule a briefing call with the employee for onboarding</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Briefing Date & Time</Label>
                <Input type="datetime-local" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meeting Link</Label>
                <Input placeholder="https://meet.google.com/..." />
              </div>
            </div>
          </div>

          <Button className="gap-2" onClick={handleSubmit}>
            <Send className="h-4 w-4" /> Hand Over & Copy Share Message
          </Button>
        </CardContent>
      </Card>

      {/* Recent Handovers */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Handovers</CardTitle></CardHeader>
        <CardContent>
          {handoversList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No handovers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Creator", "Email", "Type", "Deal", "Pay Model", "Pay", "Recruiter", "Date", ""].map(h => (
                      <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {handoversList.map(ho => (
                    <tr key={ho.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium text-foreground pr-4">
                        <div className="flex items-center gap-2">
                          {ho.creatorName}
                          {ho.pepperPortalLink && <a href={ho.pepperPortalLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" /></a>}
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground pr-4">{ho.creatorEmail}</td>
                      <td className="py-2.5 text-muted-foreground pr-4">{ho.creatorType}</td>
                      <td className="py-2.5 text-muted-foreground pr-4">{ho.dealId}</td>
                      <td className="py-2.5 text-muted-foreground pr-4">{ho.paymentModel}</td>
                      <td className="py-2.5 font-mono text-foreground pr-4">{getCurrencySymbol(ho.currency)}{ho.finalizedPay.toLocaleString()}</td>
                      <td className="py-2.5 text-muted-foreground pr-4">{ho.recruiterName}</td>
                      <td className="py-2.5 text-muted-foreground pr-4">{ho.handoverDate}</td>
                      <td className="py-2.5">
                        <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(formatHandoverForSharing(ho)); toast.success("Copied"); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorHandover;
