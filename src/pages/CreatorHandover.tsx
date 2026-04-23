import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { addHandover, formatHandoverForSharing, getHandovers } from "@/lib/handover-store";
import { CREATOR_TYPES, getCurrencySymbol, type CurrencyCode } from "@/lib/requisition-types";
import { CurrencySelect } from "@/components/CurrencyInput";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, Send, UserPlus, ExternalLink, Plus, Trash2, Users, Search, ChevronDown, ChevronUp } from "lucide-react";
import type { PayModel } from "@/lib/mock-data";
import { usePods } from "@/lib/use-pods";
import type { ClientV2, DealV2 } from "@/lib/talent-client-types";
import { ALL_POD_NAMES } from "@/lib/talent-client-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const PAYMENT_MODELS: PayModel[] = ["Per Word", "Per Assignment", "Retainer", "Hourly"];

interface CreatorEntry {
  id: string;
  creatorName: string;
  creatorEmail: string;
  creatorType: string;
  pepperPortalLink: string;
  phone: string;
  paymentModel: PayModel | "";
  finalizedPay: string;
  clientBilling: string;
  marginPercent: number;
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
    clientBilling: "",
    marginPercent: 0,
    marginOverridden: false,
  };
}

const CreatorHandover = () => {
  const { data: pods = [], isLoading } = usePods();
  const [handoversList, setHandoversList] = useState(getHandovers());
  const [creators, setCreators] = useState<CreatorEntry[]>([createEmptyCreator()]);
  const [selectedPod, setSelectedPod] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [sharedTo, setSharedTo] = useState("");
  const [shareViaEmail, setShareViaEmail] = useState(false);
  const [shareViaSlack, setShareViaSlack] = useState(false);
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  // POD → Client → Deal cascade for handover form
  const podClients = useMemo(() => {
    if (!selectedPod) return [];
    const clients: ClientV2[] = [];
    for (const pod of pods) {
      if (pod.name === selectedPod || selectedPod === "All") {
        for (const client of pod.clients) {
          if (!clients.find(c => c.id === client.id)) clients.push(client);
        }
      }
    }
    return clients.sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [pods, selectedPod]);

  const clientDeals = useMemo(() => {
    if (!selectedClientId) return [];
    const client = podClients.find(c => c.id === selectedClientId);
    return client?.deals || [];
  }, [podClients, selectedClientId]);

  const selectedDeal = clientDeals.find(d => d.id === selectedDealId);

  const updateCreator = (id: string, updates: Partial<CreatorEntry>) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };
      const billing = Number(updated.clientBilling);
      const pay = Number(updated.finalizedPay);
      if (billing > 0 && pay > 0 && !updated.marginOverridden) {
        updated.marginPercent = Math.round((billing - pay) / billing * 1000) / 10;
      }
      return updated;
    }));
  };

  const addCreator = () => setCreators(prev => [...prev, createEmptyCreator()]);
  const removeCreator = (id: string) => setCreators(prev => prev.filter(c => c.id !== id));

  const handlePodChange = (pod: string) => { setSelectedPod(pod); setSelectedClientId(""); setSelectedDealId(""); };
  const handleClientChange = (clientId: string) => { setSelectedClientId(clientId); setSelectedDealId(""); };

  const handleSubmit = () => {
    const validCreators = creators.filter(c => c.creatorName && c.paymentModel && c.finalizedPay);
    if (validCreators.length === 0) { toast.error("At least one creator with all required fields"); return; }
    if (!selectedDealId) { toast.error("Select a deal"); return; }
    if (!shareViaEmail && !shareViaSlack) { toast.error("Select at least one sharing channel"); return; }

    const sharedVia: ("email" | "slack")[] = [];
    if (shareViaEmail) sharedVia.push("email");
    if (shareViaSlack) sharedVia.push("slack");

    let lastHandover: any;
    for (const c of validCreators) {
      lastHandover = addHandover({
        requisitionId: "", dealId: selectedDealId, creatorName: c.creatorName,
        creatorEmail: c.creatorEmail, creatorType: c.creatorType, pepperPortalLink: c.pepperPortalLink,
        phone: c.phone, paymentModel: c.paymentModel as PayModel, finalizedPay: Number(c.finalizedPay),
        currency, handoverDate: new Date().toISOString().split("T")[0], sharedVia, sharedTo, notes,
        recruiterName, marginFromRequisition: c.marginPercent, marginOverridden: c.marginOverridden,
      });
    }

    if (lastHandover) navigator.clipboard.writeText(formatHandoverForSharing(lastHandover));
    toast.success(`${validCreators.length} creator(s) handed over! Share message copied.`, { duration: 5000 });
    setHandoversList(getHandovers());
    setCreators([createEmptyCreator()]);
    setSelectedPod(""); setSelectedClientId(""); setSelectedDealId("");
    setRecruiterName(""); setSharedTo(""); setShareViaEmail(false); setShareViaSlack(false); setNotes("");
  };

  const sym = getCurrencySymbol(currency);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-6xl">
        <div><h1 className="text-2xl font-semibold text-foreground">Creator Handover</h1><div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" /></div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Exited: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Creator Handover</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
          <p className="text-sm text-muted-foreground mt-1">All deployed creators across deals and pods</p>
        </div>
        <Button className="gap-2" onClick={() => setShowHandoverForm(!showHandoverForm)}>
          {showHandoverForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showHandoverForm ? "Hide Form" : "New Handover"}
        </Button>
      </div>

      {/* Handover Form (collapsible) */}
      {showHandoverForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><UserPlus className="h-5 w-5" /> New Handover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">POD *</Label>
                <Select value={selectedPod} onValueChange={handlePodChange}>
                  <SelectTrigger><SelectValue placeholder="Select POD" /></SelectTrigger>
                  <SelectContent>{ALL_POD_NAMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Client *</Label>
                <Select value={selectedClientId} onValueChange={handleClientChange} disabled={!selectedPod}>
                  <SelectTrigger><SelectValue placeholder={selectedPod ? "Select client" : "Select POD first"} /></SelectTrigger>
                  <SelectContent>{podClients.map(c => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Deal *</Label>
                <Select value={selectedDealId} onValueChange={setSelectedDealId} disabled={!selectedClientId}>
                  <SelectTrigger><SelectValue placeholder={selectedClientId ? "Select deal" : "Select client first"} /></SelectTrigger>
                  <SelectContent>{clientDeals.map(d => <SelectItem key={d.id} value={d.id}>{d.dealName} ({d.id})</SelectItem>)}</SelectContent>
                </Select>
                {selectedDeal && <p className="text-xs text-muted-foreground">Margin: {selectedDeal.grossMarginPercent}% · Status: {selectedDeal.status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Recruiter (Handing Over) *</Label>
                <Input placeholder="Recruiter name" value={recruiterName} onChange={e => setRecruiterName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <CurrencySelect value={currency} onChange={setCurrency} />
              </div>
            </div>

            <Separator />

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
                    <div className="space-y-1.5"><Label className="text-xs">Client Billing ({sym})</Label>
                      <Input type="number" placeholder={`${sym} billing`} value={c.clientBilling} onChange={e => updateCreator(c.id, { clientBilling: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Margin %</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={c.marginPercent} onChange={e => updateCreator(c.id, { marginPercent: Number(e.target.value), marginOverridden: true })} />
                        {c.marginOverridden && <span className="text-xs text-warning self-center">Overridden</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

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

            <Button className="gap-2" onClick={handleSubmit}>
              <Send className="h-4 w-4" /> Hand Over & Copy Share Message
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Creator Directory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" /> All Creators ({allCreators.length})</CardTitle>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, client, deal, role..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterPod} onValueChange={setFilterPod}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All PODs</SelectItem>
                {ALL_POD_NAMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Exited">Exited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No creators found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Creator", "Role", "Client", "Deal", "POD", "Pay Model", "Pay Rate", "Client Billing", "Margin", "Status", "City", "Start Date", ""].map(h => (
                      <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCreators.map(cr => (
                    <tr key={cr.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium text-foreground pr-3">
                        <div className="flex items-center gap-1.5">
                          {cr.creatorName}
                          {cr.linkedinId && (
                            <a href={cr.linkedinId.startsWith("http") ? cr.linkedinId : `https://${cr.linkedinId}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground pr-3">{cr.role}</td>
                      <td className="py-2.5 text-muted-foreground pr-3">{cr.clientName}</td>
                      <td className="py-2.5 text-muted-foreground pr-3 max-w-[120px] truncate" title={cr.dealName}>{cr.dealName}</td>
                      <td className="py-2.5 pr-3"><Badge variant="outline" className="text-xs">{cr.podName}</Badge></td>
                      <td className="py-2.5 text-muted-foreground pr-3">{cr.payModel}</td>
                      <td className="py-2.5 font-mono text-foreground pr-3">{getCurrencySymbol(cr.currency)}{cr.payRate.toLocaleString()}</td>
                      <td className="py-2.5 font-mono text-foreground pr-3">{getCurrencySymbol(cr.currency)}{cr.clientBilling.toLocaleString()}</td>
                      <td className="py-2.5 font-mono pr-3">
                        <span className={cr.marginPercent >= 30 ? "text-green-600" : cr.marginPercent >= 15 ? "text-yellow-600" : "text-red-600"}>
                          {cr.marginPercent}%
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[cr.status] || "bg-muted text-muted-foreground"}`}>
                          {cr.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground pr-3">{cr.city || "—"}</td>
                      <td className="py-2.5 text-muted-foreground pr-3">{cr.startDate || "—"}</td>
                      <td className="py-2.5">
                        {cr.opsLink && (
                          <a href={cr.opsLink.startsWith("http") ? cr.opsLink : `https://${cr.opsLink}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </a>
                        )}
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
