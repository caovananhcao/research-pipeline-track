import { motion } from "framer-motion";
import type { Project, Deadline, CheckInSettings } from "@/types/research";
import { getCountdown, getDaysSince } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";

interface CheckInCardProps {
  projects: Project[];
  deadlines: Deadline[];
  settings: CheckInSettings;
  onDismiss: () => void;
}

export function CheckInCard({ projects, deadlines, settings, onDismiss }: CheckInCardProps) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Don't show if already checked in today
  if (settings.lastCheckDate === today) return null;

  // Don't show if before check time
  const [checkH, checkM] = settings.checkTime.split(":").map(Number);
  if (now.getHours() < checkH || (now.getHours() === checkH && now.getMinutes() < checkM)) return null;

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const upcomingDeadlines = deadlines.filter((d) => {
    const diff = new Date(d.datetime).getTime() - now.getTime();
    return diff > 0 && diff <= threeDaysMs;
  });

  const overdueDeadlines = deadlines.filter((d) => new Date(d.datetime).getTime() < now.getTime());

  const staleProjects = projects.filter((p) => getDaysSince(p.lastUpdated) >= 7 && p.stage !== "Done");

  const topActions = projects
    .filter((p) => p.stage !== "Done")
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  const hasContent = upcomingDeadlines.length > 0 || overdueDeadlines.length > 0 || staleProjects.length > 0 || topActions.length > 0;

  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gentle p-5 bg-sage-light/60 border-primary/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg font-semibold">Good day, researcher</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs">
          Dismiss
        </Button>
      </div>

      <div className="space-y-4 text-sm">
        {upcomingDeadlines.length > 0 && (
          <div>
            <p className="font-medium mb-1.5">Coming up soon</p>
            {upcomingDeadlines.map((d) => {
              const { label } = getCountdown(d.datetime);
              return (
                <p key={d.id} className="text-muted-foreground ml-2">
                  · {d.name} — <span className="font-medium text-deadline-soon">{label}</span>
                </p>
              );
            })}
          </div>
        )}

        {overdueDeadlines.length > 0 && (
          <div>
            <p className="font-medium mb-1.5">Slipped past — no rush</p>
            {overdueDeadlines.map((d) => (
              <p key={d.id} className="text-muted-foreground ml-2">· {d.name}</p>
            ))}
          </div>
        )}

        {staleProjects.length > 0 && (
          <div>
            <p className="font-medium mb-1.5">Been quiet for a while</p>
            {staleProjects.map((p) => (
              <p key={p.id} className="text-muted-foreground ml-2">· {p.title} ({getDaysSince(p.lastUpdated)} days)</p>
            ))}
          </div>
        )}

        {topActions.length > 0 && (
          <div>
            <p className="font-medium mb-1.5">Today's focus</p>
            {topActions.map((p) => (
              <p key={p.id} className="text-muted-foreground ml-2">
                · <span className="text-foreground">{p.nextAction}</span> <span className="text-xs">({p.title})</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
