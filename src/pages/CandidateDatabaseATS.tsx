import { useState } from "react";
import { getCandidates, addCandidate, updateCandidate, getAllPipelineCandidates } from "@/lib/ats-store";
import type { Candidate } from "@/lib/ats-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search, Plus, Star, Filter, User, ExternalLink, FileText,
  MapPin, Briefcase, Clock,
} from "lucide-react";

const SOURCES = ["LinkedIn", "Referral", "Job Board", "Internal DB", "Other"];
const AVAILABILITY_OPTIONS = ["Immediate", "1 week", "2 weeks", "1 month", "Not available"];
const RATE_MODELS = ["Per Word", "Hourly", "Monthly", "Per Assignment"];

const CandidateDatabase = () => {
  const [candidates, setCandidates] = useState(getCandidates());
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formLanguages, setFormLanguages] = useState("");
  const [formTools, setFormTools] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formRateModel, setFormRateModel] = useState("");
  const [formAvailability, setFormAvailability] = useState<Candidate["availability"]>("Immediate");
  const [formSource, setFormSource] = useState("LinkedIn");
  const [formSkills, setFormSkills] = useState("");
  const [formLinkedIn, setFormLinkedIn] = useState("");
  const [formPortfolio, setFormPortfolio] = useState("");

  const allPipeline = getAllPipelineCandidates();

  const filtered = candidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.currentRole.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchSource = sourceFilter === "all" || c.source === sourceFilter;
    const matchTag = tagFilter === "all" || c.tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()));
    return matchSearch && matchSource && matchTag;
  });

  // Get all unique tags
  const allTags = [...new Set(candidates.flatMap(c => c.tags))];

  const getPipelineCount = (candidateId: string) =>
    allPipeline.filter(pc => pc.candidateId === candidateId).length;

  const getActivePipelines = (candidateId: string) =>
    allPipeline.filter(pc => pc.candidateId === candidateId && pc.currentStage !== "Rejected" && pc.currentStage !== "Hired");

  const handleAdd = () => {
    if (!formName || !formEmail) { toast.error("Name and email are required"); return; }
    addCandidate({
      name: formName, email: formEmail, phone: formPhone, altPhone: "",
      linkedIn: formLinkedIn, portfolioUrl: formPortfolio, resumeUrl: "",
      currentRole: formRole, experience: formExperience,
      skills: formSkills.split(",").map(s => s.trim()).filter(Boolean),
      tags: formSkills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
      domainExpertise: formDomain, languageSkills: formLanguages,
      toolsProficiency: formTools, expectedRate: formRate, rateModel: formRateModel,
      availability: formAvailability, noticePeriod: "", city: formCity,
      overallScore: 0, technicalScore: 0, communicationScore: 0, cultureFitScore: 0,
      workSamples: [], interactions: [], notes: [],
      source: formSource, pastAssignments: [],
    });
    setCandidates(getCandidates());
    toast.success("Candidate added");
    setAddDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone(""); setFormRole("");
    setFormExperience(""); setFormCity(""); setFormDomain(""); setFormLanguages("");
    setFormTools(""); setFormRate(""); setFormRateModel(""); setFormSource("LinkedIn");
    setFormSkills(""); setFormLinkedIn(""); setFormPortfolio("");
    setFormAvailability("Immediate");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Candidate Database</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1" />
          <p className="text-xs text-muted-foreground mt-0.5">{candidates.length} candidates · Full CRM view</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Candidate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search name, email, role, city, skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Tag filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Pipelines</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => { setSelectedCandidate(c); setDetailDialogOpen(true); }}>
                  <TableCell>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{c.currentRole}</TableCell>
                  <TableCell className="text-[13px]">{c.city}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="font-mono text-[13px]">{c.overallScore || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[13px]">{c.expectedRate || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.availability === "Immediate" ? "default" : c.availability === "Not available" ? "destructive" : "secondary"} className="text-[10px]">
                      {c.availability}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{c.source}</TableCell>
                  <TableCell>
                    <span className="font-mono text-[13px]">{getPipelineCount(c.id)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {c.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                      {c.tags.length > 2 && <span className="text-[9px] text-muted-foreground">+{c.tags.length - 2}</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No candidates found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Candidate</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Name *</Label><Input value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Email *</Label><Input value={formEmail} onChange={e => setFormEmail(e.target.value)} type="email" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Phone</Label><Input value={formPhone} onChange={e => setFormPhone(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Current Role</Label><Input value={formRole} onChange={e => setFormRole(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Experience</Label><Input value={formExperience} onChange={e => setFormExperience(e.target.value)} placeholder="e.g. 5 years" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">City</Label><Input value={formCity} onChange={e => setFormCity(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Domain Expertise</Label><Input value={formDomain} onChange={e => setFormDomain(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Languages</Label><Input value={formLanguages} onChange={e => setFormLanguages(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Tools</Label><Input value={formTools} onChange={e => setFormTools(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Expected Rate</Label><Input value={formRate} onChange={e => setFormRate(e.target.value)} placeholder="e.g. ₹3.5/word" /></div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider">Rate Model</Label>
              <Select value={formRateModel} onValueChange={setFormRateModel}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{RATE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider">Availability</Label>
              <Select value={formAvailability} onValueChange={v => setFormAvailability(v as Candidate["availability"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AVAILABILITY_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider">Source</Label>
              <Select value={formSource} onValueChange={setFormSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">LinkedIn</Label><Input value={formLinkedIn} onChange={e => setFormLinkedIn(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Portfolio URL</Label><Input value={formPortfolio} onChange={e => setFormPortfolio(e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label className="text-[10px] uppercase tracking-wider">Skills / Tags (comma-separated)</Label><Input value={formSkills} onChange={e => setFormSkills(e.target.value)} placeholder="e.g. Fintech, SEO, SaaS" /></div>
          </div>
          <Button className="w-full mt-3" onClick={handleAdd}>Add Candidate</Button>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" /> {selectedCandidate.name}
                  <Badge variant="outline" className="ml-2 text-[10px] font-mono">{selectedCandidate.id}</Badge>
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="profile">
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1 text-xs">Profile</TabsTrigger>
                  <TabsTrigger value="work" className="flex-1 text-xs">Work Samples</TabsTrigger>
                  <TabsTrigger value="interactions" className="flex-1 text-xs">Interactions</TabsTrigger>
                  <TabsTrigger value="pipelines" className="flex-1 text-xs">Pipelines</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Email</span>{selectedCandidate.email}</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Phone</span>{selectedCandidate.phone} {selectedCandidate.altPhone && `/ ${selectedCandidate.altPhone}`}</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">City</span>{selectedCandidate.city}</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Experience</span>{selectedCandidate.experience}</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Current Role</span>{selectedCandidate.currentRole}</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Source</span>{selectedCandidate.source}</div>
                    <div className="col-span-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Domain Expertise</span>{selectedCandidate.domainExpertise}</div>
                    <div className="col-span-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Languages</span>{selectedCandidate.languageSkills}</div>
                    <div className="col-span-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Tools</span>{selectedCandidate.toolsProficiency}</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Rate</span>{selectedCandidate.expectedRate} ({selectedCandidate.rateModel})</div>
                    <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Availability</span>{selectedCandidate.availability}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Scores</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[["Overall", selectedCandidate.overallScore], ["Technical", selectedCandidate.technicalScore], ["Communication", selectedCandidate.communicationScore], ["Culture", selectedCandidate.cultureFitScore]].map(([l, s]) => (
                        <div key={l as string} className="text-center bg-muted/50 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">{l as string}</p>
                          <p className="text-sm font-mono font-semibold">{(s as number) || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {selectedCandidate.tags.map(t => (
                      <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {selectedCandidate.linkedIn && (
                      <a href={selectedCandidate.linkedIn} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> LinkedIn</Button>
                      </a>
                    )}
                    {selectedCandidate.portfolioUrl && (
                      <a href={selectedCandidate.portfolioUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> Portfolio</Button>
                      </a>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="work" className="space-y-2">
                  {selectedCandidate.workSamples.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No work samples added yet.</p>
                  ) : (
                    selectedCandidate.workSamples.map(ws => (
                      <a key={ws.id} href={ws.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-[13px] font-medium">{ws.title}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{ws.type}</p>
                        </div>
                      </a>
                    ))
                  )}
                  {selectedCandidate.pastAssignments.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Past Assignments</span>
                      <div className="space-y-1">
                        {selectedCandidate.pastAssignments.map((pa, i) => (
                          <p key={i} className="text-[13px] text-foreground">• {pa}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="interactions" className="space-y-2">
                  {selectedCandidate.interactions.length === 0 && selectedCandidate.notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No interactions recorded.</p>
                  ) : (
                    <>
                      {selectedCandidate.interactions.map(int => (
                        <div key={int.id} className="border-l-2 border-primary/20 pl-3 py-1.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="secondary" className="text-[9px] capitalize">{int.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{int.author} · {new Date(int.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[13px]">{int.summary}</p>
                        </div>
                      ))}
                      {selectedCandidate.notes.map(n => (
                        <div key={n.id} className="border-l-2 border-muted pl-3 py-1.5">
                          <span className="text-[10px] text-muted-foreground">{n.author} · {new Date(n.timestamp).toLocaleDateString()}</span>
                          <p className="text-[13px]">{n.text}</p>
                        </div>
                      ))}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="pipelines" className="space-y-2">
                  {(() => {
                    const pipelines = allPipeline.filter(pc => pc.candidateId === selectedCandidate.id);
                    if (pipelines.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">Not in any pipeline.</p>;
                    return pipelines.map(pc => (
                      <div key={pc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="text-[13px] font-medium font-mono">{pc.requisitionId}</p>
                          <p className="text-[10px] text-muted-foreground">Added {new Date(pc.addedAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={pc.currentStage === "Hired" ? "default" : pc.currentStage === "Rejected" ? "destructive" : "secondary"} className="text-[10px]">
                          {pc.currentStage}
                        </Badge>
                      </div>
                    ));
                  })()}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateDatabase;
