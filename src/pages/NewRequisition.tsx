import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  OPPORTUNITY_STAGES, URGENCY_LEVELS, CREATOR_TYPES, EXPERIENCE_LEVELS,
  PAYMENT_MODELS, DEPARTMENTS, DEAL_TYPES_SALES, RESOURCE_TYPES_SALES,
  RESOURCE_SPECIFIC_TYPES, STUDIO_TYPES, VSD_DEAL_TYPES, REPLACEMENT_RISK,
  createEmptyLineItem, calcLineItemMargins, getMarginRiskColor, getMarginRiskLabel,
  type RequisitionFlow, type VSDLineItem,
} from "@/lib/requisition-types";

const NewRequisition = () => {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<RequisitionFlow | "">("");

  // Raised-by fields
  const [raisedByName, setRaisedByName] = useState("");
  const [raisedByPhone, setRaisedByPhone] = useState("");
  const [department, setDepartment] = useState("");

  // Sales flow
  const [salesClientName, setSalesClientName] = useState("");
  const [salesOpportunityName, setSalesOpportunityName] = useState("");
  const [salesDealType, setSalesDealType] = useState("");
  const [salesResourceType, setSalesResourceType] = useState("");
  const [salesSpecificTypes, setSalesSpecificTypes] = useState<string[]>([]);
  const [salesCreatorPay, setSalesCreatorPay] = useState("");
  const [salesClientBilling, setSalesClientBilling] = useState("");
  const [salesMargin, setSalesMargin] = useState(40);
  const [salesStage, setSalesStage] = useState("");
  const [salesUrgency, setSalesUrgency] = useState("");

  // VSD flow
  const [vsdClientName, setVsdClientName] = useState("");
  const [vsdDealId, setVsdDealId] = useState("");
  const [vsdDealType, setVsdDealType] = useState("");
  const [vsdStudioType, setVsdStudioType] = useState("");
  const [vsdGeography, setVsdGeography] = useState("");
  const [vsdStage, setVsdStage] = useState("");
  const [vsdClientDetails, setVsdClientDetails] = useState("");
  const [vsdLineItems, setVsdLineItems] = useState<VSDLineItem[]>([createEmptyLineItem()]);
  const [vsdStartDate, setVsdStartDate] = useState("");
  const [vsdDeadline, setVsdDeadline] = useState("");
  const [vsdUrgency, setVsdUrgency] = useState("");
  const [vsdIsReplacement, setVsdIsReplacement] = useState(false);
  const [vsdReplacementOf, setVsdReplacementOf] = useState("");

  const updateLineItem = (id: string, updates: Partial<VSDLineItem>) => {
    setVsdLineItems(prev => prev.map(li => {
      if (li.id !== id) return li;
      const updated = { ...li, ...updates };
      return calcLineItemMargins(updated);
    }));
  };

  const addLineItem = () => setVsdLineItems(prev => [...prev, createEmptyLineItem()]);
  const removeLineItem = (id: string) => setVsdLineItems(prev => prev.filter(li => li.id !== id));

  const toggleSpecificType = (type: string) => {
    setSalesSpecificTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleCreatorType = (itemId: string, type: string) => {
    const item = vsdLineItems.find(li => li.id === itemId);
    if (!item) return;
    const updated = item.creatorTypes.includes(type)
      ? item.creatorTypes.filter(t => t !== type)
      : [...item.creatorTypes, type];
    updateLineItem(itemId, { creatorTypes: updated });
  };

  // VSD financial summary
  const vsdTotalRevenue = vsdLineItems.reduce((s, li) => s + li.clientPay, 0);
  const vsdTotalCost = vsdLineItems.reduce((s, li) => s + li.creatorPay, 0);
  const vsdGrossMargin = vsdTotalRevenue - vsdTotalCost;
  const vsdGrossMarginPercent = vsdTotalRevenue > 0 ? (vsdGrossMargin / vsdTotalRevenue) * 100 : 0;
  const vsdAvgTargetMargin = vsdLineItems.length > 0
    ? vsdLineItems.reduce((s, li) => s + li.targetMarginPercent, 0) / vsdLineItems.length : 40;

  const handleSubmit = () => {
    if (!raisedByName || !raisedByPhone || !department || !flow) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Requisition submitted for Head of Supply review");
    navigate("/requisitions");
  };

  const formatCurrency = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/requisitions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Requisition</h1>
          <p className="text-sm text-muted-foreground mt-1">Raise a new resource requisition</p>
        </div>
      </div>

      {/* SECTION 1: RAISED BY */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Requisition Raised By</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={raisedByName} onChange={e => setRaisedByName(e.target.value)} placeholder="Full name" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input type="tel" value={raisedByPhone} onChange={e => setRaisedByPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Requisition Type *</Label>
            <div className="flex gap-3">
              <Button variant={flow === "sales" ? "default" : "outline"} onClick={() => setFlow("sales")} className="flex-1">
                Sales-led Requisition
              </Button>
              <Button variant={flow === "vsd" ? "default" : "outline"} onClick={() => setFlow("vsd")} className="flex-1">
                VSD / Account Management-led
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SALES FLOW */}
      {flow === "sales" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-info" />
              Sales-led Requisition — Pre-Deal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input value={salesClientName} onChange={e => setSalesClientName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Opportunity Name *</Label>
                <Input value={salesOpportunityName} onChange={e => setSalesOpportunityName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Type of Deal Being Pitched *</Label>
                <Select value={salesDealType} onValueChange={setSalesDealType}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{DEAL_TYPES_SALES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resource Being Pitched *</Label>
                <Select value={salesResourceType} onValueChange={setSalesResourceType}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{RESOURCE_TYPES_SALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specific Resource Types Needed *</Label>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_SPECIFIC_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleSpecificType(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${salesSpecificTypes.includes(t)
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Expected Creator Pay</Label>
                <Input value={salesCreatorPay} onChange={e => setSalesCreatorPay(e.target.value)} placeholder="Range or estimate" className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Expected Client Billing</Label>
                <Input value={salesClientBilling} onChange={e => setSalesClientBilling(e.target.value)} placeholder="₹ amount" className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Expected Margin %</Label>
                <Input type="number" value={salesMargin} onChange={e => setSalesMargin(Number(e.target.value))} className="bg-background border-border" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opportunity Stage *</Label>
                <Select value={salesStage} onValueChange={setSalesStage}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>{OPPORTUNITY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgency *</Label>
                <Select value={salesUrgency} onValueChange={setSalesUrgency}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                  <SelectContent>{URGENCY_LEVELS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VSD FLOW */}
      {flow === "vsd" && (
        <>
          {/* SECTION A: Deal Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                VSD / Account-led — Deal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={vsdClientName} onChange={e => setVsdClientName(e.target.value)} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Deal ID *</Label>
                  <Input value={vsdDealId} onChange={e => setVsdDealId(e.target.value)} placeholder="DEAL-XXX" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Deal Type *</Label>
                  <Select value={vsdDealType} onValueChange={setVsdDealType}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{VSD_DEAL_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Studio Type *</Label>
                  <Select value={vsdStudioType} onValueChange={setVsdStudioType}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{STUDIO_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Geography *</Label>
                  <Input value={vsdGeography} onChange={e => setVsdGeography(e.target.value)} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Opportunity Stage *</Label>
                  <Select value={vsdStage} onValueChange={setVsdStage}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>{OPPORTUNITY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Client Details *</Label>
                <Textarea value={vsdClientDetails} onChange={e => setVsdClientDetails(e.target.value)}
                  placeholder="Industry, Scale, Expectations, Complexity, Sensitivities..."
                  className="bg-background border-border min-h-[100px]" />
              </div>
            </CardContent>
          </Card>

          {/* SECTION B: Line Items */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Resource Requirements — Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vsdLineItems.map((item, idx) => (
                <div key={item.id} className="border border-border rounded-lg p-4 space-y-4 bg-background/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Line Item {idx + 1}</h4>
                    {vsdLineItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Creator Types *</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CREATOR_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => toggleCreatorType(item.id, t)}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${item.creatorTypes.includes(t)
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs"># Creators *</Label>
                      <Input type="number" min={1} value={item.numberOfCreators}
                        onChange={e => updateLineItem(item.id, { numberOfCreators: Number(e.target.value) })}
                        className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Experience *</Label>
                      <Select value={item.experienceLevel} onValueChange={v => updateLineItem(item.id, { experienceLevel: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{EXPERIENCE_LEVELS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Payment Model *</Label>
                      <Select value={item.paymentModel} onValueChange={v => updateLineItem(item.id, { paymentModel: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{PAYMENT_MODELS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Margin %</Label>
                      <Input type="number" value={item.targetMarginPercent}
                        onChange={e => updateLineItem(item.id, { targetMarginPercent: Number(e.target.value) })}
                        className="bg-background border-border h-9" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Est. Monthly Output</Label>
                      <Input value={item.estimatedMonthlyOutput}
                        onChange={e => updateLineItem(item.id, { estimatedMonthlyOutput: e.target.value })}
                        placeholder="e.g. 40,000 words" className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Est. Hours/Month</Label>
                      <Input value={item.estimatedHoursPerMonth}
                        onChange={e => updateLineItem(item.id, { estimatedHoursPerMonth: e.target.value })}
                        className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Client Pay (₹) *</Label>
                      <Input type="number" value={item.clientPay || ""}
                        onChange={e => updateLineItem(item.id, { clientPay: Number(e.target.value) })}
                        className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Creator Pay (₹) *</Label>
                      <Input type="number" value={item.creatorPay || ""}
                        onChange={e => updateLineItem(item.id, { creatorPay: Number(e.target.value) })}
                        className="bg-background border-border h-9" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox checked={item.isCombinedPay} onCheckedChange={v => updateLineItem(item.id, { isCombinedPay: !!v })} />
                    <Label className="text-xs text-muted-foreground">Combined pay for multiple roles</Label>
                  </div>

                  {/* Auto-calculated margin display */}
                  {(item.clientPay > 0 || item.creatorPay > 0) && (
                    <div className={`flex items-center gap-4 p-3 rounded-md border ${
                      item.grossMarginPercent < item.targetMarginPercent
                        ? "border-destructive/50 bg-destructive/5"
                        : "border-success/50 bg-success/5"
                    }`}>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Gross Margin: </span>
                        <span className="font-mono font-medium text-foreground">{formatCurrency(item.grossMargin)}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">GM%: </span>
                        <span className={`font-mono font-medium ${item.grossMarginPercent < item.targetMarginPercent ? "text-destructive" : "text-success"}`}>
                          {item.grossMarginPercent.toFixed(1)}%
                        </span>
                      </div>
                      {item.grossMarginPercent < item.targetMarginPercent && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Below target ({item.targetMarginPercent}%)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Creator Details Section (collapsible feel) */}
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creator Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Domain Expertise</Label>
                      <Input value={item.domainExpertise} onChange={e => updateLineItem(item.id, { domainExpertise: e.target.value })}
                        placeholder="e.g. Fintech, SaaS" className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Language</Label>
                      <Input value={item.languageRequirement} onChange={e => updateLineItem(item.id, { languageRequirement: e.target.value })}
                        placeholder="e.g. English" className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tools Required</Label>
                      <Input value={item.toolsRequired} onChange={e => updateLineItem(item.id, { toolsRequired: e.target.value })}
                        placeholder="e.g. Google Docs" className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Portfolio Expectation</Label>
                      <Input value={item.portfolioExpectation} onChange={e => updateLineItem(item.id, { portfolioExpectation: e.target.value })}
                        className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Turnaround Time</Label>
                      <Input value={item.turnaroundTime} onChange={e => updateLineItem(item.id, { turnaroundTime: e.target.value })}
                        placeholder="e.g. 48 hours" className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Replacement Risk</Label>
                      <Select value={item.replacementRisk} onValueChange={v => updateLineItem(item.id, { replacementRisk: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{REPLACEMENT_RISK.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addLineItem} className="gap-2">
                <Plus className="h-4 w-4" /> Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* SECTION C: Deal Financial Summary */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Deal-Level Financial Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="stat-card text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Total Revenue</p>
                  <p className="text-lg font-semibold text-foreground font-mono mt-1">{formatCurrency(vsdTotalRevenue)}</p>
                </div>
                <div className="stat-card text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Total Cost</p>
                  <p className="text-lg font-semibold text-foreground font-mono mt-1">{formatCurrency(vsdTotalCost)}</p>
                </div>
                <div className="stat-card text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Gross Margin</p>
                  <p className="text-lg font-semibold text-foreground font-mono mt-1">{formatCurrency(vsdGrossMargin)}</p>
                </div>
                <div className="stat-card text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">GM %</p>
                  <p className={`text-lg font-semibold font-mono mt-1 text-${getMarginRiskColor(vsdGrossMarginPercent, vsdAvgTargetMargin)}`}>
                    {vsdGrossMarginPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="stat-card text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Risk</p>
                  <div className={`mt-1 status-badge bg-${getMarginRiskColor(vsdGrossMarginPercent, vsdAvgTargetMargin)}/15 text-${getMarginRiskColor(vsdGrossMarginPercent, vsdAvgTargetMargin)} mx-auto`}>
                    {getMarginRiskLabel(vsdGrossMarginPercent, vsdAvgTargetMargin)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION E: Urgency & SLA */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Urgency & SLA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Required Start Date *</Label>
                  <Input type="date" value={vsdStartDate} onChange={e => setVsdStartDate(e.target.value)} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Deadline to Close *</Label>
                  <Input type="date" value={vsdDeadline} onChange={e => setVsdDeadline(e.target.value)} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Urgency *</Label>
                  <Select value={vsdUrgency} onValueChange={setVsdUrgency}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{URGENCY_LEVELS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Replacement Hiring?</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox checked={vsdIsReplacement} onCheckedChange={v => setVsdIsReplacement(!!v)} />
                    <span className="text-sm text-muted-foreground">Yes</span>
                  </div>
                </div>
              </div>
              {vsdIsReplacement && (
                <div className="space-y-2">
                  <Label>Replacement of whom?</Label>
                  <Input value={vsdReplacementOf} onChange={e => setVsdReplacementOf(e.target.value)} className="bg-background border-border" />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Submit */}
      {flow && (
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate("/requisitions")}>Cancel</Button>
          <Button variant="outline" onClick={() => toast.info("Draft saved")}>Save as Draft</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewRequisition;
