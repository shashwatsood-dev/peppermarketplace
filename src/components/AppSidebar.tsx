import {
  LayoutDashboard, FileText, Users, Database, BarChart3, Settings,
  UserCheck, User, LogOut, ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth, getRoleLabel, type UserRole } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const allNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "pod_lead_recruiter"] },
  { title: "Requisitions", url: "/requisitions", icon: FileText, roles: ["admin", "pod_lead_recruiter", "capability_lead_am"] },
  { title: "Handover", url: "/handover", icon: UserCheck, roles: ["admin", "pod_lead_recruiter"] },
  { title: "Talent X Client View", url: "/deals", icon: User, roles: ["admin", "pod_lead_recruiter", "capability_lead_am"] },
  { title: "Studio Dashboard", url: "/studio", icon: BarChart3, roles: ["admin", "pod_lead_recruiter"] },
  { title: "Creator Database", url: "/creators", icon: Database, roles: ["admin"] },
];

const systemItems = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { currentUser, currentRole, switchRole, logout } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const visibleNav = allNavItems.filter(item => item.roles.includes(currentRole));
  const visibleSystem = systemItems.filter(item => item.roles.includes(currentRole));

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-sm">MP</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Procurement Suite</p>
            <p className="text-xs text-muted-foreground">Marketplace Ops</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-3 mb-1">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      activeClassName="bg-muted text-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleSystem.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-3 mb-1">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSystem.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        activeClassName="bg-muted text-foreground font-medium">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto px-3 py-4 border-t border-border space-y-3">
          {isAdmin && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">View as Role</p>
              <Select value={currentRole} onValueChange={v => switchRole(v as UserRole)}>
                <SelectTrigger className="h-8 text-xs bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pod_lead_recruiter">Pod Lead / Recruiter</SelectItem>
                  <SelectItem value="capability_lead_am">Capability Lead / AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{currentUser?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(currentRole)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
