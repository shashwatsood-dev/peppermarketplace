import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { advancedRequisitions } from "@/lib/requisition-mock-data";
import { getPipelineCandidates } from "@/lib/ats-store";
import { getStagesForFlow } from "@/lib/ats-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronRight } from "lucide-react";

const ATSOverview = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const reqs = advancedRequisitions.map(req => {
    const pipeline = getPipelineCandidates(req.id);
    const clientName = req.flow === "sales" ? req.salesData?.clientName : req.hiringData?.clientName;
    const flowLabel = req.flow === "sales" ? "Sample Profile" : req.flow === "studio" ? "Content Studio" : "Freelancer";
    return {
      ...req,
      clientName: clientName || "Unknown",
      flowLabel,
      pipelineCount: pipeline.length,
      hired: pipeline.filter(pc => pc.currentStage === "Hired").length,
      rejected: pipeline.filter(pc => pc.currentStage === "Rejected").length,
      inProcess: pipeline.filter(pc => !["Hired", "Rejected", "Sourced"].includes(pc.currentStage)).length,
    };
  });

  const filtered = reqs.filter(r =>
    r.clientName.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-foreground">ATS Pipeline</h1>
        <div className="h-0.5 w-8 bg-primary rounded-full mt-1" />
        <p className="text-xs text-muted-foreground mt-0.5">Click any requisition to view its candidate pipeline</p>
      </div>

      <div className="relative max-w-[320px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search by client or Req ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Req ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>In Process</TableHead>
                <TableHead>Hired</TableHead>
                <TableHead>Rejected</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/ats/${r.id}`)}>
                  <TableCell className="font-mono text-[13px] font-medium text-primary">{r.id}</TableCell>
                  <TableCell className="text-[13px]">{r.clientName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.flowLabel}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{r.status}</Badge></TableCell>
                  <TableCell className="font-mono">{r.pipelineCount}</TableCell>
                  <TableCell className="font-mono text-primary">{r.inProcess}</TableCell>
                  <TableCell className="font-mono text-emerald-600">{r.hired}</TableCell>
                  <TableCell className="font-mono text-destructive">{r.rejected}</TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ATSOverview;
