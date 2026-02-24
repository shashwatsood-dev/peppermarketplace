import { useState } from "react";
import { requisitions } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatCurrency = (n: number) => "₹" + (n / 100000).toFixed(1) + "L";

const Requisitions = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = requisitions.filter((r) => {
    const matchSearch = r.dealName.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Requisitions</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage resource requirements</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Requisition
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requisitions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Shortlisting">Shortlisting</SelectItem>
            <SelectItem value="Closed – Filled">Closed – Filled</SelectItem>
            <SelectItem value="Closed – Dropped">Closed – Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: requisitions.length },
          { label: "Open", value: requisitions.filter(r => !r.status.startsWith("Closed")).length },
          { label: "In Progress", value: requisitions.filter(r => r.status === "In Progress" || r.status === "Shortlisting").length },
          { label: "Closed", value: requisitions.filter(r => r.status.startsWith("Closed")).length },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-xl font-semibold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["ID", "Client / Deal", "AM", "Studio", "Roles", "Budget", "Margin Target", "Status", "Recruiter"].map(h => (
                <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} className="data-table-row">
                <td className="py-3 font-mono text-muted-foreground pr-4">{req.id}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-foreground">{req.dealName}</p>
                  <p className="text-xs text-muted-foreground">{req.clientName}</p>
                </td>
                <td className="py-3 text-muted-foreground pr-4 whitespace-nowrap">{req.accountManager}</td>
                <td className="py-3 pr-4"><span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{req.studioType}</span></td>
                <td className="py-3 text-muted-foreground pr-4 whitespace-nowrap">{req.roles.map(r => `${r.count}× ${r.roleType}`).join(", ")}</td>
                <td className="py-3 font-mono text-foreground pr-4">{formatCurrency(req.talentBudget)}</td>
                <td className="py-3 font-mono text-success pr-4">{req.targetMargin}%</td>
                <td className="py-3 pr-4"><StatusBadge status={req.status} /></td>
                <td className="py-3 text-muted-foreground whitespace-nowrap">{req.assignedRecruiter || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No requisitions found</p>
        )}
      </div>
    </div>
  );
};

export default Requisitions;
