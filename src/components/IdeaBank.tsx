import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Idea } from "@/types/research";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Pencil, Trash2, ArrowRight, Plus } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

interface IdeaBankProps {
  ideas: Idea[];
  onAdd: (idea: Omit<Idea, "id" | "createdDate">) => void;
  onUpdate: (id: string, updates: Partial<Idea>) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string) => void;
}

export function IdeaBank({ ideas, onAdd, onUpdate, onDelete, onConvert }: IdeaBankProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allTags = [...new Set(ideas.flatMap((i) => i.tags))];

  const filtered = ideas.filter((idea) => {
    if (statusFilter !== "all" && idea.status !== statusFilter) return false;
    if (tagFilter && !idea.tags.includes(tagFilter)) return false;
    if (search && !idea.title.toLowerCase().includes(search.toLowerCase()) && !idea.oneLinePitch.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 bg-card"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="parked">Parked</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={(v) => setTagFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-32 bg-card"><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5" onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4" /> Park an idea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit idea" : "Park a new idea"}</DialogTitle></DialogHeader>
            <IdeaForm
              idea={editingId ? ideas.find((i) => i.id === editingId) : undefined}
              onSubmit={(data) => {
                if (editingId) {
                  onUpdate(editingId, data);
                } else {
                  onAdd(data);
                }
                setFormOpen(false);
                setEditingId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No ideas yet</p>
          <p className="text-sm mt-1">Park your first idea whenever inspiration strikes.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((idea) => (
            <motion.div
              key={idea.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-gentle p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight">{idea.title}</h3>
                <StatusBadge status={idea.status} />
              </div>
              {idea.oneLinePitch && (
                <p className="text-xs text-muted-foreground leading-relaxed">{idea.oneLinePitch}</p>
              )}
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map((t) => (
                    <span key={t} className="tag-pill bg-secondary text-secondary-foreground">{t}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[11px] text-muted-foreground">{formatDate(idea.createdDate)}</span>
                <div className="flex gap-1">
                  {idea.status === "parked" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Move to project" onClick={() => onConvert(idea.id)}>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(idea.id); setFormOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(idea.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Idea["status"] }) {
  const styles = {
    parked: "bg-secondary text-secondary-foreground",
    active: "bg-sage-light text-primary",
    archived: "bg-muted text-muted-foreground",
  };
  return <span className={`tag-pill ${styles[status]}`}>{status}</span>;
}

function IdeaForm({ idea, onSubmit }: { idea?: Idea; onSubmit: (data: Omit<Idea, "id" | "createdDate">) => void }) {
  const [title, setTitle] = useState(idea?.title || "");
  const [pitch, setPitch] = useState(idea?.oneLinePitch || "");
  const [tags, setTags] = useState(idea?.tags.join(", ") || "");
  const [status, setStatus] = useState<Idea["status"]>(idea?.status || "parked");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          title: title.trim(),
          oneLinePitch: pitch.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          status,
          linkedProjectId: idea?.linkedProjectId,
        });
      }}
    >
      <div>
        <label className="text-sm font-medium mb-1 block">Title *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the idea?" required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">One-line pitch</label>
        <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="In one sentence..." rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="NLP, survey, pilot study" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Status</label>
        <Select value={status} onValueChange={(v) => setStatus(v as Idea["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="parked">Parked</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">{idea ? "Save changes" : "Park this idea"}</Button>
    </form>
  );
}
