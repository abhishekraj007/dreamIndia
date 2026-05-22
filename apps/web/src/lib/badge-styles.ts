import type { IssueType, Severity } from "./dream-types";

const issueBadges: Record<IssueType, string> = {
  roads:
    "border-amber-500/20 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  rivers: "border-sky-500/20 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  "popular-place":
    "border-fuchsia-500/20 bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300",
  transit: "border-teal-500/20 bg-teal-500/12 text-teal-700 dark:text-teal-300",
  waste: "border-rose-500/20 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  drainage:
    "border-indigo-500/20 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
};

const severityBadges: Record<Severity, string> = {
  low: "border-muted-foreground/20 bg-muted text-muted-foreground",
  medium:
    "border-yellow-500/20 bg-yellow-500/12 text-yellow-700 dark:text-yellow-300",
  high: "border-orange-500/20 bg-orange-500/12 text-orange-700 dark:text-orange-300",
  critical: "border-red-500/25 bg-red-500/12 text-red-700 dark:text-red-300",
};

export const issuePinColors: Record<IssueType, string> = {
  roads: "#d97706",
  rivers: "#0284c7",
  "popular-place": "#c026d3",
  transit: "#0f766e",
  waste: "#e11d48",
  drainage: "#4f46e5",
};

export function issueTypeBadge(issueType: IssueType) {
  return issueBadges[issueType];
}

export function severityBadge(severity: Severity) {
  return severityBadges[severity];
}
