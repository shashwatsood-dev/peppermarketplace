import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStatuses, addCustomStatus, getCustomStatuses } from "@/lib/requisition-types";
import { useAuth, getRoleLabel, type UserRole } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, UserPlus } from "lucide-react";

const Settings = () => {
  const { currentUser, users, addUser } = useAuth();
  const [newStatus, setNewStatus] = useState("");
  const [, setTick] = useState(0);

  // User management
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("pod_lead_recruiter");

  const allStatuses = getAllStatuses();
  const customStatuses = getCustomStatuses();

  const handleAddStatus = () => {
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

  const handleAddUser = () => {
    if (!newUserEmail.trim() || !newUserName.trim()) {
      toast.error("Email and name are required");
      return;
    }
    if (users.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      toast.error("User with this email already exists");
      return;
    }
    addUser(newUserEmail.trim(), newUserName.trim(), newUserRole);
    toast.success(`User ${newUserName.trim()} added. They can set their password on first login.`);
    setNewUserEmail("");
    setNewUserName("");
    setNewUserRole("pod_lead_recruiter");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
        <p className="text-sm text-muted-foreground mt-1">Admin configuration for the Marketplace Procurement Suite</p>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" /> User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add New User</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input value={newUserName} onChange={e => setNewUserName(e.target.value)}
                placeholder="Full name" className="bg-background border-border" />
              <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                placeholder="Email address" className="bg-background border-border" />
              <Select value={newUserRole} onValueChange={v => setNewUserRole(v as UserRole)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pod_lead_recruiter">Pod Lead / Recruiter</SelectItem>
                  <SelectItem value="capability_lead_am">Capability Lead / AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddUser} className="gap-1">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Existing Users</Label>
            <div className="mt-2 space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border text-sm">
                  <div>
                    <span className="font-medium text-foreground">{u.name}</span>
                    <span className="text-muted-foreground ml-2">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-badge bg-primary/15 text-primary">{getRoleLabel(u.role)}</span>
                    {!u.passwordSet && <span className="status-badge bg-warning/15 text-warning">Pending Setup</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition Status Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Custom Status</Label>
            <div className="flex gap-2">
              <Input value={newStatus} onChange={e => setNewStatus(e.target.value)}
                placeholder="New status name..." className="bg-background border-border"
                onKeyDown={e => e.key === "Enter" && handleAddStatus()} />
              <Button onClick={handleAddStatus} className="gap-1">
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
