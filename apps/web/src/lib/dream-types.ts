export type IssueType =
  | "roads"
  | "rivers"
  | "popular-place"
  | "transit"
  | "waste"
  | "drainage";

export type Severity = "low" | "medium" | "high" | "critical";

export type ReportStatus = "submitted" | "ai-ready" | "planning" | "shared";

export type DreamReport = {
  _id?: string;
  id?: string;
  title: string;
  issueType: IssueType;
  severity: Severity;
  status: ReportStatus;
  locationName: string;
  address?: string;
  lat?: number;
  lng?: number;
  description: string;
  planningGoal: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  googleMapsUrl?: string;
  tags: string[];
  votes: number;
  createdAt: number;
};

export type DreamStats = {
  reports: number;
  aiReady: number;
  planning: number;
  votes: number;
  byIssue: Record<string, number>;
};
