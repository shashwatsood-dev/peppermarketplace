import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStatuses, addCustomStatus, getCustomStatuses } from "@/lib/requisition-types";
import { useAuth, getRoleLabel, type UserRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, UserPlus, Trash2, RotateCcw, Slack, Send, MessageSquare, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SLACK_TEMPLATES,
  SLACK_TEMPLATE_LABELS,
  SLACK_TEMPLATE_VARS,
  type SlackTemplateKey,
} from "@/lib/slack-templates";

interface ProfileRow {
  id: string;
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  role: UserRole;
}

const Settings = () => {
  const { currentUser } = useAuth();
  const [newStatus, setNewStatus] = useState("");
  const [, setTick] = useState(0);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [slackChannel, setSlackChannel] = useState("#test-for-vsd-ops");
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [savingSlack, setSavingSlack] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);

  const allStatuses = getAllStatuses();
  const customStatuses = getCustomStatuses();

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    const roleMap: Record<string, UserRole> = {};
    roles?.forEach((r: any) => { roleMap[r.user_id] = r.role as UserRole; });

    const merged: ProfileRow[] = (profiles || []).map((p: any) => ({
      ...p,
      role: roleMap[p.user_id] || "admin",
    }));
    setUsers(merged);
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
    // Load slack settings
    supabase.from("app_settings").select("*").in("key", ["slack_channel", "slack_enabled"]).then(({ data }) => {
      (data || []).forEach((r: any) => {
        if (r.key === "slack_channel") setSlackChannel(typeof r.value === "string" ? r.value : "#test-for-vsd-ops");
        if (r.key === "slack_enabled") setSlackEnabled(r.value !== false);
      });
    });
  }, []);

  const handleSaveSlack = async () => {
    setSavingSlack(true);
    const { error } = await supabase.from("app_settings").upsert([
      { key: "slack_channel", value: slackChannel as any, updated_at: new Date().toISOString() },
      { key: "slack_enabled", value: slackEnabled as any, updated_at: new Date().toISOString() },
    ]);
    setSavingSlack(false);
    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Slack settings saved");
  };

  const handleTestSlack = async () => {
    setTestingSlack(true);
    const { error } = await supabase.functions.invoke("slack-notify", {
      body: {
        type: "status_change",
        data: { oldStatus: "Test", newStatus: "Connected ✓", changedBy: currentUser?.email || "Admin" },
      },
    });
    setTestingSlack(false);
    if (error) toast.error("Test failed: " + error.message);
    else toast.success(`Test message sent to ${slackChannel}`);
  };

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

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    // Delete profile (cascade will handle user_roles due to FK)
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      toast.error("Failed to delete user");
      return;
    }
    toast.success("User removed");
    fetchUsers();
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      toast.error("Failed to send reset email");
      return;
    }
    toast.success(`Password reset email sent to ${email}`);
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    // Delete existing role
    await supabase.from("user_roles").delete().eq("user_id", userId);
    // Insert new role
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: newRole,
    });
    if (error) {
      toast.error("Failed to update role");
      return;
    }
    toast.success("Role updated");
    fetchUsers();
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
          <div>
            <Label className="text-xs text-muted-foreground">Registered Users</Label>
            {loadingUsers ? (
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            ) : (
              <div className="mt-2 space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border text-sm">
                    <div>
                      <span className="font-medium text-foreground">{u.name || "Unnamed"}</span>
                      <span className="text-muted-foreground ml-2">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={u.role}
                        onValueChange={v => handleChangeRole(u.user_id, v as UserRole)}
                        disabled={u.user_id === currentUser?.id}
                      >
                        <SelectTrigger className="h-7 text-xs w-44 bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="capability_lead_am">Capability Lead / AM</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleResetPassword(u.email)}
                        title="Reset password"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      {u.user_id !== currentUser?.id && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteUser(u.user_id)}
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slack Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Slack className="h-4 w-4" /> Slack Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Connected via Lovable Slack connector. The bot posts requisition events into the channel below as threaded messages.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Channel</Label>
            <Input
              value={slackChannel}
              onChange={e => setSlackChannel(e.target.value)}
              placeholder="#test-for-vsd-ops"
              className="bg-background border-border"
            />
            <p className="text-[11px] text-muted-foreground">Public channels only (or invite the bot to private channels).</p>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
            <div>
              <Label className="text-sm">Notifications enabled</Label>
              <p className="text-[11px] text-muted-foreground">When off, no Slack messages are sent.</p>
            </div>
            <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveSlack} disabled={savingSlack} size="sm">
              {savingSlack ? "Saving…" : "Save Settings"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleTestSlack} disabled={testingSlack} className="gap-1">
              <Send className="h-3.5 w-3.5" /> {testingSlack ? "Sending…" : "Send test message"}
            </Button>
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
