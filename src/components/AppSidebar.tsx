import {
  LayoutDashboard, FileText, Users, Database, BarChart3, Settings,
  UserCheck, User, LogOut, Kanban, UserSearch, PieChart,
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
  { title: "ATS Pipeline", url: "/ats", icon: Kanban, roles: ["admin", "pod_lead_recruiter"] },
  { title: "Candidates", url: "/candidates", icon: UserSearch, roles: ["admin", "pod_lead_recruiter"] },
  { title: "ATS Reporting", url: "/ats-reporting", icon: PieChart, roles: ["admin", "pod_lead_recruiter"] },
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
    <Sidebar className="border-r border-border bg-card w-[228px]">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-semibold text-[11px]">MP</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">Procurement Suite</p>
            <p className="text-[10px] text-muted-foreground">Marketplace Ops</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-0.5">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"}
                      className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                      activeClassName="bg-accent text-accent-foreground font-medium border-l-2 border-primary">
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
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-0.5">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSystem.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url}
                        className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                        activeClassName="bg-accent text-accent-foreground font-medium border-l-2 border-primary">
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

        <div className="mt-auto px-3 py-3 border-t border-border space-y-2.5">
          {isAdmin && (
            <div className="space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">View as Role</p>
              <Select value={currentRole} onValueChange={v => switchRole(v as UserRole)}>
                <SelectTrigger className="h-7 text-xs bg-muted border-border">
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
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground leading-tight">{currentUser?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground">{getRoleLabel(currentRole)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
