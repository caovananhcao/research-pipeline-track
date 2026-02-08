export function getCountdown(datetime: string): { label: string; tone: "safe" | "soon" | "today" | "overdue" } {
  const now = new Date();
  const target = new Date(datetime);
  const diff = target.getTime() - now.getTime();

  if (diff < 0) {
    const days = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
    return {
      label: days === 1 ? "1 day ago" : `${days} days ago`,
      tone: "overdue",
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days === 0 && hours === 0) {
    const mins = Math.floor(diff / (1000 * 60));
    return { label: `${mins}m left`, tone: "today" };
  }

  if (days === 0) {
    return { label: `${hours}h left`, tone: "today" };
  }

  if (days <= 3) {
    return { label: `${days}d ${hours % 24}h left`, tone: "soon" };
  }

  return { label: `${days} days left`, tone: "safe" };
}

export function getDeadlineMessage(tone: "safe" | "soon" | "today" | "overdue"): string {
  switch (tone) {
    case "safe": return "Still some time, you've got this.";
    case "soon": return "Getting closer — you're doing great.";
    case "today": return "Today's the day. One step at a time.";
    case "overdue": return "This one slipped past. No rush, just don't forget it.";
  }
}

export function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
