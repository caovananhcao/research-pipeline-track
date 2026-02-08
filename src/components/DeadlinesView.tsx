import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Deadline, Project } from "@/types/research";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Pencil, Trash2, Plus, CalendarIcon } from "lucide-react";
import { getCountdown, getDeadlineMessage } from "@/lib/dateUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DeadlinesViewProps {
  deadlines: Deadline[];
  projects: Project[];
  onAdd: (d: Omit<Deadline, "id">) => void;
  onUpdate: (id: string, updates: Partial<Deadline>) => void;
  onDelete: (id: string) => void;
}

const toneStyles: Record<string, string> = {
  safe: "border-l-deadline-safe",
  soon: "border-l-deadline-soon",
  today: "border-l-deadline-today",
  overdue: "border-l-deadline-overdue",
};

const toneBg: Record<string, string> = {
  safe: "bg-sage-light/50",
  soon: "bg-peach/50",
  today: "bg-peach/70",
  overdue: "bg-rose/50",
};

export function DeadlinesView({ deadlines, projects, onAdd, onUpdate, onDelete }: DeadlinesViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...deadlines].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{deadlines.length} deadline{deadlines.length !== 1 ? "s" : ""}</p>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5" onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4" /> Add deadline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit deadline" : "Add a deadline"}</DialogTitle></DialogHeader>
            <DeadlineForm
              deadline={editingId ? deadlines.find((d) => d.id === editingId) : undefined}
              projects={projects}
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

      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No deadlines</p>
          <p className="text-sm mt-1">Add deadlines when they come up. No pressure.</p>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((deadline) => {
            const { label, tone } = getCountdown(deadline.datetime);
            const message = getDeadlineMessage(tone);
            const project = projects.find((p) => p.id === deadline.projectId);

            return (
              <motion.div
                key={deadline.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`card-gentle p-4 border-l-4 ${toneStyles[tone]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{deadline.name}</h3>
                      <span className={`tag-pill ${toneBg[tone]}`}>
                        {deadline.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{format(new Date(deadline.datetime), "MMM d, yyyy 'at' h:mm a")}</span>
                      {project && <span>· {project.title}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-sm font-semibold text-deadline-${tone}`}>{label}</span>
                      <span className="text-xs text-muted-foreground italic">{message}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(deadline.id); setFormOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(deadline.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DeadlineForm({ deadline, projects, onSubmit }: {
  deadline?: Deadline;
  projects: Project[];
  onSubmit: (data: Omit<Deadline, "id">) => void;
}) {
  const [name, setName] = useState(deadline?.name || "");
  const [date, setDate] = useState<Date | undefined>(deadline ? new Date(deadline.datetime) : undefined);
  const [time, setTime] = useState(deadline ? format(new Date(deadline.datetime), "HH:mm") : "23:59");
  const [type, setType] = useState<Deadline["type"]>(deadline?.type || "hard");
  const [projectId, setProjectId] = useState(deadline?.projectId || "");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !date) return;
        const [h, m] = time.split(":").map(Number);
        const dt = new Date(date);
        dt.setHours(h, m, 0, 0);
        onSubmit({
          name: name.trim(),
          datetime: dt.toISOString(),
          type,
          projectId: projectId || undefined,
        });
      }}
    >
      <div>
        <label className="text-sm font-medium mb-1 block">Name *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Conference submission" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Date *</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Time</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Type</label>
          <Select value={type} onValueChange={(v) => setType(v as Deadline["type"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="soft">Soft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Project</label>
          <Select value={projectId} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full">{deadline ? "Save changes" : "Add deadline"}</Button>
    </form>
  );
}
