export interface Idea {
  id: string;
  title: string;
  oneLinePitch: string;
  tags: string[];
  status: "parked" | "active" | "archived";
  createdDate: string;
  linkedProjectId?: string;
}

export interface Project {
  id: string;
  title: string;
  goal: string;
  stage: "Idea" | "Reading" | "Design" | "Data" | "Writing" | "Submit" | "Revise" | "Done";
  priority: "low" | "medium" | "high";
  nextAction: string;
  lastUpdated: string;
  relatedIdeaIds: string[];
  createdDate: string;
}

export interface Deadline {
  id: string;
  name: string;
  datetime: string;
  type: "hard" | "soft";
  projectId?: string;
}

export interface CheckInSettings {
  checkTime: string; // HH:mm
  lastCheckDate: string; // YYYY-MM-DD
}

export type TabType = "ideas" | "projects" | "deadlines" | "settings";
