import { useState, useMemo } from "react";
import { getCreators } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPods } from "@/lib/talent-client-store";
import type { Creator } from "@/lib/mock-data";

const formatCurrency = (n: number) => "₹" + (n / 1000).toFixed(0) + "K";

// Find projects a creator has been part of by matching name
function getCreatorProjects(creatorName: string) {
  const pods = getPods();
  const projects: { dealName: string; clientName: string; role: string; status: string; podName: string }[] = [];
  for (const pod of pods) {
    for (const client of pod.clients) {
      for (const deal of client.deals) {
        for (const c of deal.creators) {
          if (c.creatorName.toLowerCase() === creatorName.toLowerCase()) {
            projects.push({ dealName: deal.dealName, clientName: client.clientName, role: c.role, status: deal.status, podName: pod.name });
          }
        }
      }
    }
  }
  return projects;
}

function CreatorDetailDialog({ creator, open, onClose }: { creator: Creator; open: boolean; onClose: () => void }) {
  const projects = getCreatorProjects(creator.name);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {creator.name}
            {creator.linkedIn && (
              <a href={creator.linkedIn.startsWith("http") ? creator.linkedIn : `https://${creator.linkedIn}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{creator.email}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{creator.phone}</span></div>
            <div><span className="text-muted-foreground">City:</span> <span className="text-foreground">{creator.city}</span></div>
            <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{creator.category}</span></div>
            <div><span className="text-muted-foreground">Language:</span> <span className="text-foreground">{creator.language}</span></div>
            <div><span className="text-muted-foreground">Rating:</span> <span className="text-foreground flex items-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" />{creator.rating}</span></div>
            <div><span className="text-muted-foreground">Rate:</span> <span className="text-foreground font-mono">₹{creator.negotiatedRate.toLocaleString()}/{creator.payModel === "Per Word" ? "w" : "asgn"}</span></div>
            <div><span className="text-muted-foreground">On-time:</span> <span className="text-foreground font-mono">{creator.onTimePercent}%</span></div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Domains</h4>
            <div className="flex gap-1 flex-wrap">
              {creator.domains.map(d => (
                <span key={d} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{d}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Past & Current Projects</h4>
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((p, i) => (
                  <div key={i} className="p-2.5 rounded border border-border bg-muted/20 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{p.dealName}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>Client: {p.clientName}</span>
                      <span>Role: {p.role}</span>
                      <span>Pod: {p.podName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No project history found.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CreatorDatabase = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const filtered = creators.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.domains.some(d => d.toLowerCase().includes(search.toLowerCase())) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Creator Database</h1>
          <p className="text-sm text-muted-foreground mt-1">{creators.length} freelancers · Searchable & filterable</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Creator
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, domain, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Writer">Writer</SelectItem>
            <SelectItem value="Editor">Editor</SelectItem>
            <SelectItem value="Designer">Designer</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Translator">Translator</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Preferred">Preferred</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: creators.length },
          { label: "Active", value: creators.filter(c => c.status === "Active").length },
          { label: "Preferred", value: creators.filter(c => c.status === "Preferred").length },
          { label: "Avg Rating", value: (creators.reduce((s, c) => s + c.rating, 0) / creators.length).toFixed(1) },
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
              {["Creator", "LinkedIn", "Category", "Domains", "City", "Rate", "Rating", "On-time", "Revenue", "Margin", "Status"].map(h => (
                <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="data-table-row">
                <td className="py-3 pr-4">
                  <button onClick={() => setSelectedCreator(c)} className="text-left hover:underline">
                    <p className="font-medium text-primary">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </button>
                </td>
                <td className="py-3 pr-4">
                  {c.linkedIn ? (
                    <a href={c.linkedIn.startsWith("http") ? c.linkedIn : `https://${c.linkedIn}`} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{c.category}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex gap-1 flex-wrap">
                    {c.domains.map(d => (
                      <span key={d} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{d}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 text-muted-foreground pr-4">{c.city}</td>
                <td className="py-3 font-mono text-foreground pr-4">
                  ₹{c.negotiatedRate.toLocaleString()}
                  <span className="text-xs text-muted-foreground ml-1">/{c.payModel === "Per Word" ? "w" : "asgn"}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <span className="font-mono text-foreground">{c.rating}</span>
                  </div>
                </td>
                <td className="py-3 font-mono text-muted-foreground pr-4">{c.onTimePercent}%</td>
                <td className="py-3 font-mono text-foreground pr-4">{formatCurrency(c.revenueGenerated)}</td>
                <td className="py-3 font-mono text-success pr-4">{formatCurrency(c.marginContribution)}</td>
                <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No creators found</p>
        )}
      </div>

      {selectedCreator && (
        <CreatorDetailDialog creator={selectedCreator} open={!!selectedCreator} onClose={() => setSelectedCreator(null)} />
      )}
    </div>
  );
};

export default CreatorDatabase;