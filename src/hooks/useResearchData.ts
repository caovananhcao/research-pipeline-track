import { useState, useEffect, useCallback } from "react";
import type { Idea, Project, Deadline, CheckInSettings } from "@/types/research";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useResearchData() {
  const [ideas, setIdeas] = useState<Idea[]>(() => load("rpt-ideas", []));
  const [projects, setProjects] = useState<Project[]>(() => load("rpt-projects", []));
  const [deadlines, setDeadlines] = useState<Deadline[]>(() => load("rpt-deadlines", []));
  const [checkInSettings, setCheckInSettings] = useState<CheckInSettings>(() =>
    load("rpt-checkin", { checkTime: "09:00", lastCheckDate: "" })
  );

  useEffect(() => save("rpt-ideas", ideas), [ideas]);
  useEffect(() => save("rpt-projects", projects), [projects]);
  useEffect(() => save("rpt-deadlines", deadlines), [deadlines]);
  useEffect(() => save("rpt-checkin", checkInSettings), [checkInSettings]);

  const genId = () => crypto.randomUUID();

  // Ideas
  const addIdea = useCallback((idea: Omit<Idea, "id" | "createdDate">) => {
    setIdeas((prev) => [...prev, { ...idea, id: genId(), createdDate: new Date().toISOString() }]);
  }, []);

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const deleteIdea = useCallback((id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const convertIdeaToProject = useCallback((ideaId: string) => {
    setIdeas((prev) => {
      const idea = prev.find((i) => i.id === ideaId);
      if (!idea) return prev;
      const projectId = genId();
      const now = new Date().toISOString();
      setProjects((pp) => [
        ...pp,
        {
          id: projectId,
          title: idea.title,
          goal: idea.oneLinePitch || "",
          stage: "Idea" as const,
          priority: "medium" as const,
          nextAction: "Define first step",
          lastUpdated: now,
          relatedIdeaIds: [ideaId],
          createdDate: now,
        },
      ]);
      return prev.map((i) =>
        i.id === ideaId ? { ...i, status: "active" as const, linkedProjectId: projectId } : i
      );
    });
  }, []);

  // Projects
  const addProject = useCallback((project: Omit<Project, "id" | "lastUpdated" | "createdDate">) => {
    const now = new Date().toISOString();
    setProjects((prev) => [...prev, { ...project, id: genId(), lastUpdated: now, createdDate: now }]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p))
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeadlines((prev) => prev.filter((d) => d.projectId !== id));
    setIdeas((prev) =>
      prev.map((i) => (i.linkedProjectId === id ? { ...i, linkedProjectId: undefined, status: "parked" as const } : i))
    );
  }, []);

  // Deadlines
  const addDeadline = useCallback((deadline: Omit<Deadline, "id">) => {
    setDeadlines((prev) => [...prev, { ...deadline, id: genId() }]);
  }, []);

  const updateDeadline = useCallback((id: string, updates: Partial<Deadline>) => {
    setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const deleteDeadline = useCallback((id: string) => {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Check-in
  const dismissCheckIn = useCallback(() => {
    setCheckInSettings((prev) => ({
      ...prev,
      lastCheckDate: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const updateCheckTime = useCallback((time: string) => {
    setCheckInSettings((prev) => ({ ...prev, checkTime: time }));
  }, []);

  // Backup
  const exportJSON = useCallback(() => {
    const data = { ideas, projects, deadlines, checkInSettings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-pipeline-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [ideas, projects, deadlines, checkInSettings]);

  const importJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.ideas) setIdeas(data.ideas);
      if (data.projects) setProjects(data.projects);
      if (data.deadlines) setDeadlines(data.deadlines);
      if (data.checkInSettings) setCheckInSettings(data.checkInSettings);
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportCSV = useCallback(() => {
    const projectRows = projects.map((p) =>
      [p.title, p.goal, p.stage, p.priority, p.nextAction, p.lastUpdated].map((v) => `"${v}"`).join(",")
    );
    const deadlineRows = deadlines.map((d) =>
      [d.name, d.datetime, d.type, d.projectId || ""].map((v) => `"${v}"`).join(",")
    );
    const csv = [
      "--- Projects ---",
      "Title,Goal,Stage,Priority,Next Action,Last Updated",
      ...projectRows,
      "",
      "--- Deadlines ---",
      "Name,DateTime,Type,ProjectId",
      ...deadlineRows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-pipeline-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projects, deadlines]);

  return {
    ideas, projects, deadlines, checkInSettings,
    addIdea, updateIdea, deleteIdea, convertIdeaToProject,
    addProject, updateProject, deleteProject,
    addDeadline, updateDeadline, deleteDeadline,
    dismissCheckIn, updateCheckTime,
    exportJSON, importJSON, exportCSV,
  };
}
