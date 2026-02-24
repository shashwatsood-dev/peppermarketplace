import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { deals } from "@/lib/mock-data";
import { addHandover, formatHandoverForSharing, getHandovers } from "@/lib/handover-store";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, Send, UserPlus, ExternalLink } from "lucide-react";
import type { PayModel } from "@/lib/mock-data";

const PAYMENT_MODELS: PayModel[] = ["Per Word", "Per Assignment", "Retainer", "Hourly"];

const CreatorHandover = () => {
  const [handoversList, setHandoversList] = useState(getHandovers());
  const [form, setForm] = useState({
    creatorName: "",
    pepperIdNumber: "",
    pepperPortalLink: "",
    phone: "",
    paymentModel: "" as PayModel | "",
    finalizedPay: "",
    dealId: "",
    sharedTo: "",
    shareViaEmail: false,
    shareViaSlack: false,
    notes: "",
  });

  const selectedDeal = deals.find((d) => d.id === form.dealId);

  const handleSubmit = () => {
    if (!form.creatorName || !form.pepperIdNumber || !form.paymentModel || !form.finalizedPay || !form.dealId) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!form.shareViaEmail && !form.shareViaSlack) {
      toast.error("Select at least one sharing channel");
      return;
    }

    const sharedVia: ("email" | "slack")[] = [];
    if (form.shareViaEmail) sharedVia.push("email");
    if (form.shareViaSlack) sharedVia.push("slack");

    const newHandover = addHandover({
      requisitionId: "",
      dealId: form.dealId,
      creatorName: form.creatorName,
      pepperIdNumber: form.pepperIdNumber,
      pepperPortalLink: form.pepperPortalLink,
      phone: form.phone,
      paymentModel: form.paymentModel as PayModel,
      finalizedPay: Number(form.finalizedPay),
      handoverDate: new Date().toISOString().split("T")[0],
      sharedVia,
      sharedTo: form.sharedTo,
      notes: form.notes,
    });

    // Copy formatted message to clipboard for sharing
    const shareText = formatHandoverForSharing(newHandover);
    navigator.clipboard.writeText(shareText);

    toast.success("Creator handed over! Share message copied to clipboard.", {
      description: `Paste into ${sharedVia.join(" & ")} to notify the account management team.`,
      duration: 5000,
    });

    setHandoversList(getHandovers());
    setForm({
      creatorName: "",
      pepperIdNumber: "",
      pepperPortalLink: "",
      phone: "",
      paymentModel: "",
      finalizedPay: "",
      dealId: "",
      sharedTo: "",
      shareViaEmail: false,
      shareViaSlack: false,
      notes: "",
    });
  };

  const copyHandoverMessage = (handover: typeof handoversList[0]) => {
    navigator.clipboard.writeText(formatHandoverForSharing(handover));
    toast.success("Handover details copied to clipboard");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Creator Handover</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hand over finalized creators to the Account Management team
        </p>
      </div>

      {/* Handover Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            New Handover
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deal Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Associated Deal *</Label>
            <Select value={form.dealId} onValueChange={(v) => setForm({ ...form, dealId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select deal" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.dealName} — {d.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDeal && (
              <p className="text-xs text-muted-foreground">
                AM: {selectedDeal.accountManager} · Contract: ₹{(selectedDeal.totalContractValue / 100000).toFixed(1)}L
              </p>
            )}
          </div>

          <Separator />

          {/* Creator Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Creator Name *</Label>
              <Input
                placeholder="Full name"
                value={form.creatorName}
                onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pepper ID *</Label>
              <Input
                placeholder="e.g. PEP-1001"
                value={form.pepperIdNumber}
                onChange={(e) => setForm({ ...form, pepperIdNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Operations Portal Link</Label>
              <Input
                placeholder="https://ops.peppercontent.io/..."
                value={form.pepperPortalLink}
                onChange={(e) => setForm({ ...form, pepperPortalLink: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Model *</Label>
              <Select
                value={form.paymentModel}
                onValueChange={(v) => setForm({ ...form, paymentModel: v as PayModel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Finalized Pay *</Label>
              <Input
                type="number"
                placeholder="₹ amount"
                value={form.finalizedPay}
                onChange={(e) => setForm({ ...form, finalizedPay: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Sharing */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Share via *</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="email"
                  checked={form.shareViaEmail}
                  onCheckedChange={(c) => setForm({ ...form, shareViaEmail: !!c })}
                />
                <label htmlFor="email" className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                  <Mail className="h-4 w-4" /> Email
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="slack"
                  checked={form.shareViaSlack}
                  onCheckedChange={(c) => setForm({ ...form, shareViaSlack: !!c })}
                />
                <label htmlFor="slack" className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                  <MessageSquare className="h-4 w-4" /> Slack
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recipient (email or Slack channel)</Label>
              <Input
                placeholder="e.g. am-team@pepper.com or #account-management"
                value={form.sharedTo}
                onChange={(e) => setForm({ ...form, sharedTo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              placeholder="Any context for the AM team..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button className="gap-2" onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            Hand Over & Copy Share Message
          </Button>
        </CardContent>
      </Card>

      {/* Recent Handovers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Handovers</CardTitle>
        </CardHeader>
        <CardContent>
          {handoversList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No handovers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Creator", "Pepper ID", "Deal", "Pay Model", "Pay", "Shared Via", "Date", ""].map((h) => (
                      <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {handoversList.map((ho) => {
                    const deal = deals.find((d) => d.id === ho.dealId);
                    return (
                      <tr key={ho.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-medium text-foreground pr-4">
                          <div className="flex items-center gap-2">
                            {ho.creatorName}
                            {ho.pepperPortalLink && (
                              <a href={ho.pepperPortalLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground pr-4">{ho.pepperIdNumber}</td>
                        <td className="py-2.5 text-muted-foreground pr-4">{deal?.dealName || ho.dealId}</td>
                        <td className="py-2.5 text-muted-foreground pr-4">{ho.paymentModel}</td>
                        <td className="py-2.5 font-mono text-foreground pr-4">₹{ho.finalizedPay.toLocaleString()}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex gap-1">
                            {ho.sharedVia.map((v) => (
                              <span key={v} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                {v === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                {v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 text-muted-foreground pr-4">{ho.handoverDate}</td>
                        <td className="py-2.5">
                          <Button variant="ghost" size="icon" onClick={() => copyHandoverMessage(ho)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
