import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAllStatuses, addCustomStatus, getCustomStatuses } from "@/lib/requisition-types";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const Settings = () => {
  const [newStatus, setNewStatus] = useState("");
  const [, setTick] = useState(0);

  const allStatuses = getAllStatuses();
  const customStatuses = getCustomStatuses();

  const handleAdd = () => {
    if (!newStatus.trim()) return;
    if (allStatuses.includes(newStatus.trim())) {
      toast.error("Status already exists");
      return;
    }
    addCustomStatus(newStatus.trim());
    setNewStatus("");
    setTick(t => t + 1);
    toast.success(`Status "${newStatus.trim()}" added`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin configuration for the Marketplace Procurement Suite</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition Status Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Custom Status</Label>
            <div className="flex gap-2">
              <Input
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                placeholder="New status name..."
                className="bg-background border-border"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <Button onClick={handleAdd} className="gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Default Statuses</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allStatuses.filter(s => !customStatuses.includes(s)).map(s => (
                <span key={s} className="status-badge bg-muted text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>

          {customStatuses.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Custom Statuses</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {customStatuses.map(s => (
                  <span key={s} className="status-badge bg-primary/15 text-primary">{s}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
