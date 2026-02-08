import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, FolderOpen, Clock, Settings } from "lucide-react";
import { useResearchData } from "@/hooks/useResearchData";
import { IdeaBank } from "@/components/IdeaBank";
import { ActiveProjects } from "@/components/ActiveProjects";
import { DeadlinesView } from "@/components/DeadlinesView";
import { SettingsView } from "@/components/SettingsView";
import { CheckInCard } from "@/components/CheckInCard";
import { toast } from "sonner";
import type { TabType } from "@/types/research";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "deadlines", label: "Deadlines", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("ideas");
  const data = useResearchData();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container py-4">
          <h1 className="font-serif text-xl font-semibold tracking-tight">Research Pipeline</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your calm research corner</p>
        </div>
      <nav className="container flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === "ideas" ? data.ideas.length
              : tab.id === "projects" ? data.projects.length
              : tab.id === "deadlines" ? data.deadlines.length
              : null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count !== null && count > 0 && (
                  <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold inline-flex items-center justify-center">
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="container py-6 space-y-6">
        <CheckInCard
          projects={data.projects}
          deadlines={data.deadlines}
          settings={data.checkInSettings}
          onDismiss={data.dismissCheckIn}
        />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "ideas" && (
            <IdeaBank
              ideas={data.ideas}
              onAdd={(idea) => { data.addIdea(idea); toast("Idea safely parked for later."); }}
              onUpdate={data.updateIdea}
              onDelete={data.deleteIdea}
              onConvert={(id) => { data.convertIdeaToProject(id); toast("Nice, promoted to a project!"); }}
            />
          )}

          {activeTab === "projects" && (
            <ActiveProjects
              projects={data.projects}
              deadlines={data.deadlines}
              onAdd={(p) => { data.addProject(p); toast("New project started. One step at a time."); }}
              onUpdate={(id, u) => { data.updateProject(id, u); toast("Nice, one small step forward."); }}
              onDelete={data.deleteProject}
            />
          )}

          {activeTab === "deadlines" && (
            <DeadlinesView
              deadlines={data.deadlines}
              projects={data.projects}
              onAdd={(d) => { data.addDeadline(d); toast("Deadline noted."); }}
              onUpdate={data.updateDeadline}
              onDelete={data.deleteDeadline}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              checkInSettings={data.checkInSettings}
              onUpdateCheckTime={data.updateCheckTime}
              onExportJSON={data.exportJSON}
              onImportJSON={data.importJSON}
              onExportCSV={data.exportCSV}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
