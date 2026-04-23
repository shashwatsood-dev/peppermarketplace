import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, ArrowLeft, CheckCircle, Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CurrencyInput, CurrencySelect } from "@/components/CurrencyInput";
import {
  OPPORTUNITY_STAGES, URGENCY_LEVELS, CREATOR_TYPES, EXPERIENCE_LEVELS,
  PAYMENT_MODELS, DEAL_TYPES_SALES, RESOURCE_TYPES_SALES,
  RESOURCE_SPECIFIC_TYPES, STUDIO_TYPES, VSD_DEAL_TYPES,
  FREELANCER_TALENT_TYPES, SIGNING_ENTITIES,
  createEmptyLineItem, getCurrencySymbol,
  type RequisitionFlow, type VSDLineItem, type CurrencyCode, type AdvancedRequisition, type AuditEntry,
} from "@/lib/requisition-types";
import { POD_NAMES as TALENT_POD_NAMES } from "@/lib/talent-client-types";
import { fetchRequisitions, dbUpdateRequisition } from "@/lib/requisition-db-store";

const NewRequisition = () => {
  const navigate = useNavigate();
  const { reqId: editReqId } = useParams<{ reqId: string }>();
  const isEditMode = !!editReqId;
  const [existingReq, setExistingReq] = useState<AdvancedRequisition | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [flow, setFlow] = useState<RequisitionFlow | "">("");

  const [raisedByName, setRaisedByName] = useState("");
  const [raisedByPhone, setRaisedByPhone] = useState("");

  // Sales flow
  const [salesClientName, setSalesClientName] = useState("");
  const [salesOpportunityName, setSalesOpportunityName] = useState("");
  const [salesDealType, setSalesDealType] = useState("");
  const [salesResourceType, setSalesResourceType] = useState("");
  const [salesSpecificTypes, setSalesSpecificTypes] = useState<string[]>([]);
  const [salesOtherSpec, setSalesOtherSpec] = useState("");
  const [salesCreatorPay, setSalesCreatorPay] = useState("");
  const [salesClientBilling, setSalesClientBilling] = useState("");
  const [salesMargin, setSalesMargin] = useState(40);
  const [salesStage, setSalesStage] = useState("");
  const [salesUrgency, setSalesUrgency] = useState("");
  const [salesCurrency, setSalesCurrency] = useState<CurrencyCode>("INR");

  // Hiring flow
  const [hiringClientName, setHiringClientName] = useState("");
  const [hiringDealId, setHiringDealId] = useState("");
  const [hiringDealType, setHiringDealType] = useState("");
  const [hiringStudioType, setHiringStudioType] = useState("");
  const [hiringGeography, setHiringGeography] = useState("");
  const [hiringTalentType, setHiringTalentType] = useState("");
  const [hiringStage, setHiringStage] = useState("");
  const [hiringClientDetails, setHiringClientDetails] = useState("");
  const [hiringCurrency, setHiringCurrency] = useState<CurrencyCode>("INR");
  const [hiringMrr, setHiringMrr] = useState(0);
  const [hiringContractDuration, setHiringContractDuration] = useState("");
  const [hiringTargetMargin, setHiringTargetMargin] = useState(40);
  const [hiringLineItems, setHiringLineItems] = useState<VSDLineItem[]>([createEmptyLineItem()]);
  const [hiringUrgencyScale, setHiringUrgencyScale] = useState(5);
  const [hiringIsReplacement, setHiringIsReplacement] = useState(false);
  const [hiringReplacementOf, setHiringReplacementOf] = useState("");
  const [hiringSigningEntity, setHiringSigningEntity] = useState("");
  const [hiringPod, setHiringPod] = useState("");

  // ── Load existing requisition for edit mode ──────────────────────
  useEffect(() => {
    if (!isEditMode || !editReqId) return;
    let cancelled = false;
    fetchRequisitions().then(reqs => {
      if (cancelled) return;
      const r = reqs.find(x => x.id === editReqId);
      if (!r) {
        toast.error("Requisition not found");
        navigate("/requisitions");
        return;
      }
      setExistingReq(r);
      setLoadingExisting(false);
      setFlow(r.flow);
      setRaisedByName(r.raisedByName);
      setRaisedByPhone(r.raisedByPhone);
      if (r.salesData) {
        setSalesClientName(r.salesData.clientName);
        setSalesOpportunityName(r.salesData.opportunityName);
        setSalesDealType(r.salesData.dealType);
        setSalesResourceType(r.salesData.resourceType);
        setSalesSpecificTypes(r.salesData.specificResourceTypes || []);
        setSalesOtherSpec(r.salesData.otherResourceTypeSpec);
        setSalesCreatorPay(r.salesData.expectedCreatorPay);
        setSalesClientBilling(r.salesData.expectedClientBilling);
        setSalesMargin(r.salesData.expectedMarginPercent);
        setSalesStage(r.salesData.opportunityStage);
        setSalesUrgency(r.salesData.urgency);
        setSalesCurrency(r.salesData.currency);
      }
      if (r.hiringData) {
        setHiringClientName(r.hiringData.clientName);
        setHiringDealId(r.hiringData.dealId);
        setHiringDealType(r.hiringData.dealType);
        setHiringStudioType(r.hiringData.studioType);
        setHiringGeography(r.hiringData.geography);
        setHiringSigningEntity(r.hiringData.signingEntity);
        setHiringTalentType(r.hiringData.talentType);
        setHiringStage(r.hiringData.opportunityStage);
        setHiringClientDetails(r.hiringData.clientDetails);
        setHiringCurrency(r.hiringData.currency);
        setHiringMrr(r.hiringData.mrr);
        setHiringContractDuration(r.hiringData.contractDuration);
        setHiringTargetMargin(r.hiringData.targetMarginPercent);
        setHiringLineItems(r.hiringData.lineItems.length > 0 ? r.hiringData.lineItems : [createEmptyLineItem()]);
        setHiringUrgencyScale(r.hiringData.urgencyScale);
        setHiringIsReplacement(r.hiringData.isReplacementHiring);
        setHiringReplacementOf(r.hiringData.replacementOf);
        setHiringPod(r.hiringData.pod);
      }
    }).catch(err => {
      toast.error("Failed to load requisition: " + err.message);
      navigate("/requisitions");
    });
    return () => { cancelled = true; };
  }, [isEditMode, editReqId, navigate]);

  const updateLineItem = (id: string, updates: Partial<VSDLineItem>) => {
    setHiringLineItems(prev => prev.map(li => li.id === id ? { ...li, ...updates } : li));
  };

  const addLineItem = () => setHiringLineItems(prev => [...prev, createEmptyLineItem()]);
  const removeLineItem = (id: string) => setHiringLineItems(prev => prev.filter(li => li.id !== id));

  const toggleSpecificType = (type: string) => {
    setSalesSpecificTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSubmit = async () => {
    if (!raisedByName || !raisedByPhone || !flow) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { generateReqId } = await import("@/lib/requisition-types");
    const { dbCreateRequisition } = await import("@/lib/requisition-db-store");

    const reqId = isEditMode && existingReq ? existingReq.id : generateReqId(flow);
    const now = new Date().toISOString();

    let totalClientRevenue = 0;
    let totalCreatorCost = 0;

    if (flow === "sales") {
      totalClientRevenue = Number(salesClientBilling) || 0;
      totalCreatorCost = Number(salesCreatorPay) || 0;
    } else {
      totalClientRevenue = hiringLineItems.reduce((s, li) => s + li.clientUnitPrice * li.numberOfCreators, 0);
      totalCreatorCost = hiringLineItems.reduce((s, li) => s + li.supplyUnitPay * li.numberOfCreators, 0);
    }

    const grossMargin = totalClientRevenue - totalCreatorCost;
    const grossMarginPercent = totalClientRevenue ? Math.round(grossMargin / totalClientRevenue * 1000) / 10 : 0;
    const targetMarginPercent = flow === "sales" ? salesMargin : hiringTargetMargin;

    const salesData = flow === "sales" ? {
      clientName: salesClientName,
      opportunityName: salesOpportunityName,
      dealType: salesDealType,
      resourceType: salesResourceType,
      specificResourceTypes: salesSpecificTypes,
      otherResourceTypeSpec: salesOtherSpec,
      expectedCreatorPay: salesCreatorPay,
      expectedClientBilling: salesClientBilling,
      expectedMarginPercent: salesMargin,
      opportunityStage: salesStage as any,
      urgency: salesUrgency as any,
      currency: salesCurrency,
    } : undefined;

    const hiringData = (flow === "studio" || flow === "freelancer") ? {
      clientName: hiringClientName,
      dealId: hiringDealId,
      dealType: hiringDealType,
      studioType: hiringStudioType,
      geography: hiringGeography,
      signingEntity: hiringSigningEntity,
      talentType: hiringTalentType,
      opportunityStage: hiringStage as any,
      clientDetails: hiringClientDetails,
      currency: hiringCurrency,
      mrr: hiringMrr,
      contractDuration: hiringContractDuration,
      targetMarginPercent: hiringTargetMargin,
      lineItems: hiringLineItems,
      urgencyScale: hiringUrgencyScale,
      isReplacementHiring: hiringIsReplacement,
      replacementOf: hiringReplacementOf,
      pod: hiringPod,
    } : undefined;

    if (isEditMode && existingReq) {
      // ── Build audit log entries by diffing top-level + nested fields ──
      const newAudit: AuditEntry[] = [];
      const ts = now;
      const editor = "Admin (edit form)";
      const pushChange = (field: string, oldV: any, newV: any) => {
        const o = oldV === undefined || oldV === null ? "" : String(oldV);
        const n = newV === undefined || newV === null ? "" : String(newV);
        if (o !== n) newAudit.push({ id: crypto.randomUUID(), fieldChanged: field, oldValue: o, newValue: n, editedBy: editor, timestamp: ts });
      };
      pushChange("raisedByName", existingReq.raisedByName, raisedByName);
      pushChange("raisedByPhone", existingReq.raisedByPhone, raisedByPhone);
      pushChange("totalClientRevenue", existingReq.totalClientRevenue, totalClientRevenue);
      pushChange("totalCreatorCost", existingReq.totalCreatorCost, totalCreatorCost);
      pushChange("grossMarginPercent", existingReq.grossMarginPercent, grossMarginPercent);
      pushChange("targetMarginPercent", existingReq.targetMarginPercent, targetMarginPercent);
      if (existingReq.salesData && salesData) {
        Object.keys(salesData).forEach(k => pushChange(`salesData.${k}`, (existingReq.salesData as any)[k], (salesData as any)[k]));
      }
      if (existingReq.hiringData && hiringData) {
        Object.keys(hiringData).forEach(k => {
          const oldVal = (existingReq.hiringData as any)[k];
          const newVal = (hiringData as any)[k];
          if (k === "lineItems") {
            const oldLen = Array.isArray(oldVal) ? oldVal.length : 0;
            const newLen = Array.isArray(newVal) ? newVal.length : 0;
            if (oldLen !== newLen) pushChange("hiringData.lineItems.count", oldLen, newLen);
            // Also diff per-line aggregates so financial edits are tracked
            const oldRev = (oldVal as VSDLineItem[] || []).reduce((s, li) => s + li.clientUnitPrice * li.numberOfCreators, 0);
            const newRev = (newVal as VSDLineItem[] || []).reduce((s, li) => s + li.clientUnitPrice * li.numberOfCreators, 0);
            if (oldRev !== newRev) pushChange("hiringData.lineItems.totalClientRevenue", oldRev, newRev);
          } else {
            pushChange(`hiringData.${k}`, oldVal, newVal);
          }
        });
      }

      const updated: AdvancedRequisition = {
        ...existingReq,
        raisedByName,
        raisedByPhone,
        flow,
        salesData,
        hiringData,
        totalClientRevenue,
        totalCreatorCost,
        grossMargin,
        grossMarginPercent,
        targetMarginPercent,
        currency: flow === "sales" ? salesCurrency : hiringCurrency,
        updatedAt: now,
        auditLog: [...existingReq.auditLog, ...newAudit],
      };

      try {
        await dbUpdateRequisition(reqId, {}, updated);
        toast.success(`Requisition updated · ${newAudit.length} change${newAudit.length === 1 ? "" : "s"} logged`);
        navigate("/requisitions");
      } catch (err: any) {
        toast.error("Failed to update requisition: " + err.message);
      }
      return;
    }

    const req: AdvancedRequisition = {
      id: reqId,
      raisedByName,
      raisedByPhone,
      flow,
      salesData,
      hiringData,
      status: "RMG approval Pending",
      rmgNotes: "",
      rejectionReason: "",
      podLeadAssigned: "",
      recruiterAssigned: "",
      targetClosureDate: "",
      linkedInRecruiterLink: "",
      atsSheetLink: "",
      createdAt: now,
      updatedAt: now,
      totalClientRevenue,
      totalCreatorCost,
      grossMargin,
      grossMarginPercent,
      targetMarginPercent,
      currency: flow === "sales" ? salesCurrency : hiringCurrency,
      dailyUpdates: [],
      auditLog: [],
      taEditedPendingApproval: false,
    };

    try {
      await dbCreateRequisition(req);
      toast.success("Requisition submitted for RMG review");
      navigate("/requisitions");
    } catch (err: any) {
      toast.error("Failed to save requisition: " + err.message);
    }
  };

  const sym = getCurrencySymbol(flow === "sales" ? salesCurrency : hiringCurrency);
  const formatCurrency = (n: number) => sym + n.toLocaleString(flow === "sales" && salesCurrency === "USD" ? "en-US" : "en-IN");

  const isStudio = flow === "studio";
  const isFreelancer = flow === "freelancer";
  const isHiring = isStudio || isFreelancer;

  // Pricing mode handlers for line items
  const handleClientUnitPriceChange = (item: VSDLineItem, price: number) => {
    const supplyPay = price * (1 - item.targetUnitMargin / 100);
    updateLineItem(item.id, { clientUnitPrice: price, supplyUnitPay: Math.round(supplyPay * 100) / 100, pricingMode: "client-to-supply" });
  };

  const handleSupplyUnitPayChange = (item: VSDLineItem, pay: number) => {
    const clientPrice = item.targetUnitMargin < 100 ? pay / (1 - item.targetUnitMargin / 100) : 0;
    updateLineItem(item.id, { supplyUnitPay: pay, clientUnitPrice: Math.round(clientPrice * 100) / 100, pricingMode: "supply-to-client" });
  };

  const handleTargetMarginChange = (item: VSDLineItem, margin: number) => {
    if (item.pricingMode === "supply-to-client") {
      const clientPrice = margin < 100 ? item.supplyUnitPay / (1 - margin / 100) : 0;
      updateLineItem(item.id, { targetUnitMargin: margin, clientUnitPrice: Math.round(clientPrice * 100) / 100 });
    } else {
      const supplyPay = item.clientUnitPrice * (1 - margin / 100);
      updateLineItem(item.id, { targetUnitMargin: margin, supplyUnitPay: Math.round(supplyPay * 100) / 100 });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/requisitions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{isEditMode ? `Edit Requisition · ${editReqId}` : "New Requisition"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{isEditMode ? "Every change is recorded in the audit log" : "Raise a new resource requisition"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
          navigator.clipboard.writeText(window.location.origin + "/requisitions/new-public");
          toast.success("Public form link copied to clipboard");
        }}>
          <Copy className="h-4 w-4" /> Copy Public Link
        </Button>
      </div>

      {/* SECTION 1: RAISED BY */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Requisition Raised By</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={raisedByName} onChange={e => setRaisedByName(e.target.value)} placeholder="Full name" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input type="tel" value={raisedByPhone} onChange={e => setRaisedByPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="bg-background border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Requisition Type *</Label>
            <div className="flex gap-3">
              <Button variant={flow === "sales" ? "default" : "outline"} onClick={() => setFlow("sales")} className="flex-1">Sample Profile Request</Button>
              <Button variant={flow === "studio" ? "default" : "outline"} onClick={() => setFlow("studio")} className="flex-1">Hiring Request — Studio</Button>
              <Button variant={flow === "freelancer" ? "default" : "outline"} onClick={() => setFlow("freelancer")} className="flex-1">Hiring Request — Freelancer</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SALES FLOW */}
      {flow === "sales" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-info" /> Sample Profile Request — Pre-Deal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Client Name *</Label>
                <Input value={salesClientName} onChange={e => setSalesClientName(e.target.value)} className="bg-background border-border" /></div>
              <div className="space-y-2"><Label>Opportunity Name *</Label>
                <Input value={salesOpportunityName} onChange={e => setSalesOpportunityName(e.target.value)} placeholder="e.g. Video deal, Blog deal" className="bg-background border-border" /></div>
              <div className="space-y-2"><Label>Type of Deal Being Pitched *</Label>
                <Select value={salesDealType} onValueChange={setSalesDealType}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{DEAL_TYPES_SALES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Type of Resource Required *</Label>
                <Select value={salesResourceType} onValueChange={setSalesResourceType}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{RESOURCE_TYPES_SALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="space-y-2">
              <Label>Specific Resource Types Needed *</Label>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_SPECIFIC_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleSpecificType(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${salesSpecificTypes.includes(t)
                      ? "bg-primary/20 border-primary text-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
              {salesSpecificTypes.includes("Other") && (
                <Input value={salesOtherSpec} onChange={e => setSalesOtherSpec(e.target.value)} placeholder="Please specify the resource type..." className="bg-background border-border mt-2" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <CurrencySelect value={salesCurrency} onChange={setSalesCurrency} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Expected Creator Pay</Label>
                <Input value={salesCreatorPay} onChange={e => setSalesCreatorPay(e.target.value)} placeholder="Range or estimate" className="bg-background border-border" /></div>
              <div className="space-y-2"><Label>Expected Client Billing</Label>
                <Input value={salesClientBilling} onChange={e => setSalesClientBilling(e.target.value)} placeholder={`${sym} amount`} className="bg-background border-border" /></div>
              <div className="space-y-2"><Label>Expected Margin %</Label>
                <Input type="number" value={salesMargin} onChange={e => setSalesMargin(Number(e.target.value))} className="bg-background border-border" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Opportunity Stage *</Label>
                <Select value={salesStage} onValueChange={setSalesStage}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>{OPPORTUNITY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Urgency *</Label>
                <Select value={salesUrgency} onValueChange={setSalesUrgency}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                  <SelectContent>{URGENCY_LEVELS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HIRING FLOW */}
      {isHiring && (
        <>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                Hiring Request — {isStudio ? "Studio" : "Freelancer"} — Deal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Client Name *</Label>
                  <Input value={hiringClientName} onChange={e => setHiringClientName(e.target.value)} className="bg-background border-border" /></div>
                <div className="space-y-2"><Label>Deal ID *</Label>
                  <Input value={hiringDealId} onChange={e => setHiringDealId(e.target.value)} placeholder="DEAL-XXX" className="bg-background border-border" /></div>
                <div className="space-y-2"><Label>Deal Type *</Label>
                  <Select value={hiringDealType} onValueChange={setHiringDealType}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{VSD_DEAL_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select></div>

                {isStudio && (
                  <>
                    <div className="space-y-2"><Label>Studio Type *</Label>
                      <Select value={hiringStudioType} onValueChange={setHiringStudioType}>
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{STUDIO_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select></div>
                    {(hiringStudioType === "Onsite" || hiringStudioType === "Hybrid") && (
                      <div className="space-y-2"><Label>Geography *</Label>
                        <Input value={hiringGeography} onChange={e => setHiringGeography(e.target.value)} placeholder="e.g. Mumbai, Delhi" className="bg-background border-border" /></div>
                    )}
                    <div className="space-y-2"><Label>Signing Entity *</Label>
                      <Select value={hiringSigningEntity} onValueChange={setHiringSigningEntity}>
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select entity" /></SelectTrigger>
                        <SelectContent>{SIGNING_ENTITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </>
                )}

                {isFreelancer && (
                  <div className="space-y-2"><Label>Talent Sourcing *</Label>
                    <Select value={hiringTalentType} onValueChange={setHiringTalentType}>
                      <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{FREELANCER_TALENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select></div>
                )}

                <div className="space-y-2"><Label>Opportunity Stage *</Label>
                  <Select value={hiringStage} onValueChange={setHiringStage}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>{OPPORTUNITY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select></div>

                <div className="space-y-2"><Label>POD *</Label>
                  <Select value={hiringPod} onValueChange={setHiringPod}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select POD" /></SelectTrigger>
                    <SelectContent>{TALENT_POD_NAMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>

              <div className="space-y-2"><Label>Client Details *</Label>
                <Textarea value={hiringClientDetails} onChange={e => setHiringClientDetails(e.target.value)}
                  placeholder="Industry, Scale, Expectations, Complexity, Sensitivities..."
                  className="bg-background border-border min-h-[100px]" /></div>

              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deal-Level Financials</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>MRR *</Label>
                  <CurrencyInput currency={hiringCurrency} onCurrencyChange={setHiringCurrency}
                    value={hiringMrr || ""} onValueChange={v => setHiringMrr(Number(v))} /></div>
                <div className="space-y-2"><Label>Contract Duration</Label>
                  <Input value={hiringContractDuration} onChange={e => setHiringContractDuration(e.target.value)} placeholder="e.g. 12 months" className="bg-background border-border" /></div>
                <div className="space-y-2"><Label>Target Margin %</Label>
                  <Input type="number" value={hiringTargetMargin} onChange={e => setHiringTargetMargin(Number(e.target.value))} className="bg-background border-border" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Resource Requirements — Line Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {hiringLineItems.map((item, idx) => (
                <div key={item.id} className="border border-border rounded-lg p-4 space-y-4 bg-background/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Line Item {idx + 1}</h4>
                    {hiringLineItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Creator Type *</Label>
                      <Select value={item.creatorType} onValueChange={v => updateLineItem(item.id, { creatorType: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{CREATOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                    {item.creatorType === "Other" && (
                      <div className="space-y-1.5"><Label className="text-xs">Specify Type *</Label>
                        <Input value={item.otherCreatorTypeSpec} onChange={e => updateLineItem(item.id, { otherCreatorTypeSpec: e.target.value })}
                          placeholder="Specify..." className="bg-background border-border h-9" /></div>
                    )}
                    {item.creatorType === "Translator" && (
                      <div className="space-y-1.5"><Label className="text-xs">Translation Language *</Label>
                        <Input value={item.languageRequirement} onChange={e => updateLineItem(item.id, { languageRequirement: e.target.value })}
                          placeholder="e.g. Hindi, Spanish, French" className="bg-background border-border h-9" /></div>
                    )}
                    <div className="space-y-1.5"><Label className="text-xs"># Creators *</Label>
                      <Input type="number" min={1} value={item.numberOfCreators}
                        onChange={e => updateLineItem(item.id, { numberOfCreators: Number(e.target.value) })}
                        className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Experience *</Label>
                      <Select value={item.experienceLevel} onValueChange={v => updateLineItem(item.id, { experienceLevel: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{EXPERIENCE_LEVELS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1.5"><Label className="text-xs">Payment Model *</Label>
                      <Select value={item.paymentModel} onValueChange={v => updateLineItem(item.id, { paymentModel: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{PAYMENT_MODELS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Est. Monthly Output</Label>
                      <Input value={item.estimatedMonthlyOutput} onChange={e => updateLineItem(item.id, { estimatedMonthlyOutput: e.target.value })}
                        placeholder="e.g. 40,000 words" className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Est. Hours/Month</Label>
                      <Input value={item.estimatedHoursPerMonth} onChange={e => updateLineItem(item.id, { estimatedHoursPerMonth: e.target.value })}
                        className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Client Unit Pricing ({sym}) *</Label>
                      <Input type="number" value={item.clientUnitPrice || ""}
                        onChange={e => handleClientUnitPriceChange(item, Number(e.target.value))}
                        className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Target Unit Margin %</Label>
                      <Input type="number" value={item.targetUnitMargin || ""}
                        onChange={e => handleTargetMarginChange(item, Number(e.target.value))}
                        className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Supply Unit Pay ({sym})</Label>
                      <Input type="number" value={item.supplyUnitPay || ""}
                        onChange={e => handleSupplyUnitPayChange(item, Number(e.target.value))}
                        className="bg-background border-border h-9" /></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox checked={item.isCombinedPay} onCheckedChange={v => updateLineItem(item.id, { isCombinedPay: !!v })} />
                    <Label className="text-xs text-muted-foreground">Combined pay for multiple roles</Label>
                  </div>

                  {/* Creator Details (no TAT, no replacement risk) */}
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creator Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Domain Expertise</Label>
                      <Input value={item.domainExpertise} onChange={e => updateLineItem(item.id, { domainExpertise: e.target.value })}
                        placeholder="e.g. Fintech, SaaS" className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Language</Label>
                      <Input value={item.languageRequirement} onChange={e => updateLineItem(item.id, { languageRequirement: e.target.value })}
                        placeholder="e.g. English" className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Tools Required</Label>
                      <Input value={item.toolsRequired} onChange={e => updateLineItem(item.id, { toolsRequired: e.target.value })}
                        placeholder="e.g. Google Docs" className="bg-background border-border h-9" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Portfolio Expectation</Label>
                      <Input value={item.portfolioExpectation} onChange={e => updateLineItem(item.id, { portfolioExpectation: e.target.value })}
                        className="bg-background border-border h-9" /></div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addLineItem} className="gap-2">
                <Plus className="h-4 w-4" /> Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Deal Financial Summary */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Deal-Level Financial Summary</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Overall Margin</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono uppercase">MRR</p>
                    <p className="text-lg font-semibold text-foreground font-mono mt-1">{formatCurrency(hiringMrr)}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono uppercase">Target Margin</p>
                    <p className="text-lg font-semibold text-foreground font-mono mt-1">{hiringTargetMargin}%</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground font-mono uppercase">Contract</p>
                    <p className="text-lg font-semibold text-foreground font-mono mt-1">{hiringContractDuration || "—"}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Unit-Level Margins</p>
                {hiringLineItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["#", "Creator Type", "Count", "Client Unit Price", "Target Unit Margin", "Supply Unit Pay", "Payment Model"].map(h => (
                            <th key={h} className="pb-2 text-xs font-mono uppercase text-muted-foreground pr-3 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hiringLineItems.map((li, idx) => (
                          <tr key={li.id} className="data-table-row">
                            <td className="py-2 pr-3 font-mono text-muted-foreground">{idx + 1}</td>
                            <td className="py-2 pr-3 text-xs">{li.creatorType === "Other" ? li.otherCreatorTypeSpec || "Other" : li.creatorType || "—"}</td>
                            <td className="py-2 pr-3 font-mono">{li.numberOfCreators}</td>
                            <td className="py-2 pr-3 font-mono">{formatCurrency(li.clientUnitPrice)}</td>
                            <td className="py-2 pr-3 font-mono">{li.targetUnitMargin}%</td>
                            <td className="py-2 pr-3 font-mono">{formatCurrency(li.supplyUnitPay)}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{li.paymentModel || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Add line items to see unit margins</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Urgency & SLA */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base">Urgency & SLA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Urgency *</Label>
                <Select value={String(hiringUrgencyScale)} onValueChange={v => setHiringUrgencyScale(Number(v))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Replacement Hiring?</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox checked={hiringIsReplacement} onCheckedChange={v => setHiringIsReplacement(!!v)} />
                  <span className="text-sm text-muted-foreground">Yes</span>
                </div>
              </div>
              {hiringIsReplacement && (
                <div className="space-y-2"><Label>Replacement of whom?</Label>
                  <Input value={hiringReplacementOf} onChange={e => setHiringReplacementOf(e.target.value)} className="bg-background border-border" /></div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Submit */}
      {flow && (
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate("/requisitions")}>Cancel</Button>
          {!isEditMode && <Button variant="outline" onClick={() => toast.info("Draft saved")}>Save as Draft</Button>}
          <Button onClick={handleSubmit} className="gap-2">
            <CheckCircle className="h-4 w-4" /> {isEditMode ? "Save Changes" : "Submit for Review"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewRequisition;
