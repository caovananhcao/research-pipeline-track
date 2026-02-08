import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project, Deadline } from "@/types/research";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Pencil, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { getDaysSince, formatDate, getCountdown, getDeadlineMessage } from "@/lib/dateUtils";

const STAGES = ["Idea", "Reading", "Design", "Data", "Writing", "Submit", "Revise", "Done"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

const priorityColors: Record<string, string> = {
  low: "bg-sky text-sky-deep",
  medium: "bg-peach text-peach-deep",
  high: "bg-rose text-rose-deep",
};

const stageColors: Record<string, string> = {
  Idea: "bg-lavender text-lavender-deep",
  Reading: "bg-sky text-sky-deep",
  Design: "bg-peach text-peach-deep",
  Data: "bg-sage-light text-primary",
  Writing: "bg-secondary text-secondary-foreground",
  Submit: "bg-peach text-peach-deep",
  Revise: "bg-lavender text-lavender-deep",
  Done: "bg-sage-light text-primary",
};

interface ActiveProjectsProps {
  projects: Project[];
  deadlines: Deadline[];
  onAdd: (p: Omit<Project, "id" | "lastUpdated" | "createdDate">) => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
}

export function ActiveProjects({ projects, deadlines, onAdd, onUpdate, onDelete }: ActiveProjectsProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    if (stageFilter !== "all" && p.stage !== stageFilter) return false;
    if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 bg-card" />
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-32 bg-card"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 bg-card"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5" onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4" /> New project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit project" : "Start a new project"}</DialogTitle></DialogHeader>
            <ProjectForm
              project={editingId ? projects.find((p) => p.id === editingId) : undefined}
              onSubmit={(data) => {
                if (editingId) onUpdate(editingId, data);
                else onAdd(data);
                setFormOpen(false);
                setEditingId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No projects yet</p>
          <p className="text-sm mt-1">Start a project when you're ready to commit to an idea.</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((project) => {
            const projectDeadlines = deadlines.filter((d) => d.projectId === project.id);
            const daysSince = getDaysSince(project.lastUpdated);
            const isExpanded = expandedId === project.id;

            return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-gentle p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm">{project.title}</h3>
                      <span className={`tag-pill ${stageColors[project.stage]}`}>{project.stage}</span>
                      <span className={`tag-pill ${priorityColors[project.priority]}`}>{project.priority}</span>
                    </div>
                    {project.goal && <p className="text-xs text-muted-foreground mb-2">{project.goal}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Next: <strong className="text-foreground font-medium">{project.nextAction}</strong></span>
                    </div>
                    {daysSince >= 7 && (
                      <p className="text-xs text-peach-deep mt-1.5 italic">This project has been quiet for a while.</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : project.id)}>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(project.id); setFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(project.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{formatDate(project.lastUpdated)}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-3 border-t border-border space-y-3">
                        <QuickNextAction
                          current={project.nextAction}
                          onSave={(nextAction) => onUpdate(project.id, { nextAction })}
                        />
                        {projectDeadlines.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2">Deadlines</p>
                            <div className="space-y-1.5">
                              {projectDeadlines.map((d) => {
                                const { label, tone } = getCountdown(d.datetime);
                                return (
                                  <div key={d.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                                    <span>{d.name}</span>
                                    <span className={`font-medium text-deadline-${tone}`}>{label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QuickNextAction({ current, onSave }: { current: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(current);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditing(true)}>
        Update next action
      </Button>
    );
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onSave(value.trim());
          setEditing(false);
        }
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="text-xs h-8" autoFocus />
      <Button type="submit" size="sm" className="h-8 text-xs">Save</Button>
    </form>
  );
}

function ProjectForm({ project, onSubmit }: {
  project?: Project;
  onSubmit: (data: Omit<Project, "id" | "lastUpdated" | "createdDate">) => void;
}) {
  const [title, setTitle] = useState(project?.title || "");
  const [goal, setGoal] = useState(project?.goal || "");
  const [stage, setStage] = useState<Project["stage"]>(project?.stage || "Idea");
  const [priority, setPriority] = useState<Project["priority"]>(project?.priority || "medium");
  const [nextAction, setNextAction] = useState(project?.nextAction || "");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !nextAction.trim()) return;
        onSubmit({
          title: title.trim(),
          goal: goal.trim(),
          stage,
          priority,
          nextAction: nextAction.trim(),
          relatedIdeaIds: project?.relatedIdeaIds || [],
        });
      }}
    >
      <div>
        <label className="text-sm font-medium mb-1 block">Title *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Goal</label>
        <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="One sentence goal" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Stage</label>
          <Select value={stage} onValueChange={(v) => setStage(v as Project["stage"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Priority</label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Project["priority"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Next action *</label>
        <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="What's the very next step?" required />
      </div>
      <Button type="submit" className="w-full">{project ? "Save changes" : "Create project"}</Button>
    </form>
  );
}
