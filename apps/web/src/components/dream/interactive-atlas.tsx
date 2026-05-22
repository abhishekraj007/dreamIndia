"use client";

import { useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery, useAction } from "convex/react";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { demoReports, demoStats, issueOptions } from "@/lib/dream-data";
import type { DreamReport, DreamStats, IssueType, Severity } from "@/lib/dream-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  CheckCircle2,
  FileImage,
  Layers3,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Send,
  Sparkles,
  Upload,
  Vote,
  WandSparkles,
  BookOpen,
  Copy,
  FileText,
  X,
  Check,
  Loader2,
} from "lucide-react";

type Props = {
  initialReports: DreamReport[];
  initialStats: DreamStats;
};

type Draft = {
  title: string;
  issueType: IssueType;
  severity: Severity;
  locationName: string;
  address: string;
  lat: string;
  lng: string;
  description: string;
  planningGoal: string;
  tags: string;
};

const emptyDraft: Draft = {
  title: "Citizen transformation report",
  issueType: "roads",
  severity: "high",
  locationName: "Silk Board service road, Bengaluru",
  address: "Near Silk Board Junction, Bengaluru, Karnataka",
  lat: "12.9177",
  lng: "77.6238",
  description:
    "Broken edge conditions, unsafe walking space, open drainage, and weak junction management.",
  planningGoal:
    "Safe complete street with covered drains, protected footpath, organized utilities, shade trees, and crossings.",
  tags: "footpath, drainage, crossing",
};

function getReportId(report: DreamReport) {
  return report._id ?? report.id ?? report.title;
}

async function uploadToConvex(url: string, blob: Blob) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  if (!response.ok) {
    throw new Error("Convex storage upload failed.");
  }
  const json = (await response.json()) as { storageId: Id<"_storage"> };
  return json.storageId;
}

export function InteractiveAtlas({ initialReports, initialStats }: Props) {
  const [selectedIssue, setSelectedIssue] = useState<IssueType | "all">("all");
  const [selectedReportId, setSelectedReportId] = useState(
    getReportId(initialReports[0] ?? demoReports[0]),
  );
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [divider, setDivider] = useState(52);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // AI states
  const [beforeStorageId, setBeforeStorageId] = useState<Id<"_storage"> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [proposal, setProposal] = useState<string | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const { data: session } = authClient.useSession();
  const liveReports = useQuery(
    api.reports.listReports,
    selectedIssue === "all"
      ? { limit: 24 }
      : { issueType: selectedIssue, limit: 24 },
  );
  const liveStats = useQuery(api.reports.impactStats);
  const createReport = useMutation(api.reports.createReport);
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl);
  const vote = useMutation(api.reports.vote);

  const analyzePhoto = useAction(api.analysis.analyzeReportPhoto);
  const generateCivicProposal = useAction(api.civicConsultant.generateProposal);

  const reports = (liveReports?.length ? liveReports : initialReports).map(
    (report: any) => ({ ...report, id: getReportId(report) }),
  ) as DreamReport[];
  const stats = liveStats ?? initialStats;
  const selectedReport =
    reports.find((report) => getReportId(report) === selectedReportId) ??
    reports[0] ??
    demoReports[0];
  const beforeImage = beforePreview ?? selectedReport.beforeImageUrl;
  const afterImage = generatedImage ?? selectedReport.afterImageUrl;
  const mapQuery = encodeURIComponent(
    draft.lat && draft.lng
      ? `${draft.lat},${draft.lng}`
      : draft.locationName || selectedReport.locationName,
  );
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapSrc =
    googleMapsKey && draft.lat && draft.lng
      ? `https://www.google.com/maps/embed/v1/streetview?key=${googleMapsKey}&location=${draft.lat},${draft.lng}&heading=210&pitch=0&fov=80`
      : `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  const planningChecklist = useMemo(
    () => [
      "Capture exact location and visual proof",
      "Classify issue, severity, and public risk",
      "Generate realistic after-view with planning constraints",
      "Save the before/after report to Convex",
      "Share a map-linked civic brief with stakeholders",
    ],
    [],
  );

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  // Touch/pointer dragging event handlers for premium slider
  const handleSliderMove = (clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    const percentage = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
    setDivider(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.clientX, rect);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.clientX, rect);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  async function onFileChange(nextFile: File | null) {
    setFile(nextFile);
    setGeneratedImage(null);
    setMessage(null);
    setBeforeStorageId(null);
    if (!nextFile) {
      setBeforePreview(null);
      return;
    }
    setBeforePreview(URL.createObjectURL(nextFile));
    
    // Auto-analyze photo via Convex Action + Gemini 3.1 Flash-Lite
    setIsAnalyzing(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const storageId = await uploadToConvex(uploadUrl, nextFile);
      setBeforeStorageId(storageId);
      
      const analysis = await analyzePhoto({ storageId });
      setDraft((curr) => ({
        ...curr,
        description: analysis.description,
        planningGoal: analysis.planningGoal,
        severity: analysis.severity as Severity,
        tags: analysis.tags.join(", "),
      }));
      setMessage("Street analysis completed! Form auto-filled with details.");
    } catch (error) {
      console.error("AI photo analysis failed:", error);
      setMessage("Photo uploaded, but automatic AI street analysis failed. Feel free to fill details manually.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerateProposal() {
    if (!selectedReport._id) {
      setMessage("Please save the report to the Convex database before generating a proposal.");
      return;
    }
    
    setProposal(null);
    setIsProposalModalOpen(true);
    setIsGeneratingProposal(true);
    
    try {
      if (selectedReport.aiProposal) {
        setProposal(selectedReport.aiProposal);
        return;
      }
      
      const res = await generateCivicProposal({ reportId: selectedReport._id as Id<"transformationReports"> });
      setProposal(res.proposal);
    } catch (err) {
      console.error("Proposal generation failed:", err);
      setMessage("Failed to generate AI proposal. Please try again.");
      setIsProposalModalOpen(false);
    } finally {
      setIsGeneratingProposal(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateDraft("lat", position.coords.latitude.toFixed(6));
        updateDraft("lng", position.coords.longitude.toFixed(6));
        setMessage("Location captured. Add a place name before saving.");
      },
      () => setMessage("Location permission was not granted."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function transformImage() {
    setIsTransforming(true);
    setMessage(null);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("photo", file);
      }
      formData.append("locationName", draft.locationName);
      formData.append("issueType", draft.issueType);
      formData.append("planningGoal", draft.planningGoal);
      formData.append("notes", draft.description);

      const response = await fetch("/api/transform", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as {
        imageUrl?: string;
        model?: string;
        error?: string;
      };
      if (!response.ok || !json.imageUrl) {
        throw new Error(json.error || "Image transform failed.");
      }
      setGeneratedImage(json.imageUrl);
      setDivider(48);
      setMessage(`Transformed with ${json.model ?? "OpenAI image model"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Transform failed.");
    } finally {
      setIsTransforming(false);
    }
  }

  async function saveReport() {
    if (!isAuthenticated) {
      setMessage("Sign in to save reports to the shared Convex atlas.");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const activeBeforeStorageId = beforeStorageId ?? (
        file && beforePreview
          ? await uploadToConvex(await generateUploadUrl(), file)
          : undefined
      );
      const afterStorageId = generatedImage
        ? await uploadToConvex(
            await generateUploadUrl(),
            await (await fetch(generatedImage)).blob(),
          )
        : undefined;

      await createReport({
        title: draft.title,
        issueType: draft.issueType,
        severity: draft.severity,
        locationName: draft.locationName,
        address: draft.address || undefined,
        lat: draft.lat ? Number(draft.lat) : undefined,
        lng: draft.lng ? Number(draft.lng) : undefined,
        description: draft.description,
        planningGoal: draft.planningGoal,
        beforeStorageId: activeBeforeStorageId ?? undefined,
        afterStorageId,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setMessage("Saved to the live Convex atlas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)_340px]">
        <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Field report
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Dream India from exact evidence
              </h1>
            </div>
            <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <MapPin className="size-5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-muted px-3 py-3 text-sm font-medium hover:bg-card">
              <Camera className="size-4" />
              Camera
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-muted px-3 py-3 text-sm font-medium hover:bg-card">
              <Upload className="size-4" />
              Upload
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            <Input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              aria-label="Report title"
            />
            <Input
              value={draft.locationName}
              onChange={(event) =>
                updateDraft("locationName", event.target.value)
              }
              aria-label="Location name"
            />
            <Input
              value={draft.address}
              onChange={(event) => updateDraft("address", event.target.value)}
              aria-label="Address"
              placeholder="Address or landmark"
            />
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                value={draft.lat}
                onChange={(event) => updateDraft("lat", event.target.value)}
                aria-label="Latitude"
                placeholder="Latitude"
              />
              <Input
                value={draft.lng}
                onChange={(event) => updateDraft("lng", event.target.value)}
                aria-label="Longitude"
                placeholder="Longitude"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={useCurrentLocation}
                aria-label="Use current location"
              >
                <LocateFixed className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={draft.issueType}
                onChange={(event) =>
                  updateDraft("issueType", event.target.value as IssueType)
                }
                aria-label="Issue type"
              >
                {issueOptions.map((issue) => (
                  <option key={issue.value} value={issue.value}>
                    {issue.label}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={draft.severity}
                onChange={(event) =>
                  updateDraft("severity", event.target.value as Severity)
                }
                aria-label="Severity"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={draft.description}
              onChange={(event) => updateDraft("description", event.target.value)}
              aria-label="Current condition notes"
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={draft.planningGoal}
              onChange={(event) => updateDraft("planningGoal", event.target.value)}
              aria-label="Transformation goal"
            />
            <Input
              value={draft.tags}
              onChange={(event) => updateDraft("tags", event.target.value)}
              aria-label="Tags"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={transformImage}
              disabled={isTransforming}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <WandSparkles className="size-4" />
              {isTransforming ? "Transforming" : "Transform"}
            </Button>
            <Button type="button" variant="outline" onClick={saveReport} disabled={isSaving}>
              <Send className="size-4" />
              {isSaving ? "Saving" : "Save"}
            </Button>
          </div>
          {message && (
            <p className="mt-4 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
              {message}
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {session?.user
              ? `Signed in as ${session.user.email}.`
              : "You can preview transforms now. Sign in to save and share reports."}
          </p>
        </aside>

        <section className="flex min-h-0 flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Current Google context
                  </p>
                  <h2 className="text-lg font-semibold">{draft.locationName}</h2>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Navigation className="size-4" />
                  Open
                </a>
              </div>
              <iframe
                title="Current Google map context"
                src={mapSrc}
                className="h-[330px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="rounded-lg border border-border bg-primary p-4 text-primary-foreground shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
                Live impact
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="reports" value={stats.reports} />
                <Metric label="ai-ready" value={stats.aiReady} />
                <Metric label="planning" value={stats.planning} />
                <Metric label="votes" value={stats.votes} />
              </div>
              <div className="mt-5 space-y-3">
                {planningChecklist.map((item) => (
                  <div key={item} className="flex gap-2 text-sm text-primary-foreground/90">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Before / Dream India after (Drag/Touch to Slide)
                </p>
                <h2 className="text-xl font-semibold">{selectedReport.title}</h2>
              </div>
            </div>
            <div 
              className="relative aspect-[16/8] min-h-[310px] bg-muted cursor-ew-resize select-none group touch-none overflow-hidden"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {afterImage && (
                <img
                  src={afterImage}
                  alt="Dream India transformed condition"
                  className="absolute inset-0 size-full object-cover pointer-events-none"
                />
              )}
              {beforeImage && (
                <img
                  src={beforeImage}
                  alt="Current bad infrastructure condition"
                  className="absolute inset-0 size-full object-cover pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - divider}% 0 0)` }}
                />
              )}
              
              {/* Glowing vertical slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] pointer-events-none"
                style={{ left: `${divider}%` }}
              />
              
              {/* Glassmorphic dragging handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-10 rounded-full bg-white/20 backdrop-blur-xs border border-white/40 shadow-xl flex items-center justify-center pointer-events-none transition-transform duration-100 group-hover:scale-110 group-active:scale-95"
                style={{ left: `${divider}%` }}
              >
                <div className="flex gap-0.5 items-center justify-center text-white font-bold select-none text-xs">
                  <span>◀</span>
                  <span>▶</span>
                </div>
              </div>
              
              <div className="absolute left-3 top-3 rounded-md bg-black/65 px-3 py-1 text-xs font-semibold text-white pointer-events-none uppercase tracking-wider">
                Current Condition
              </div>
              <div className="absolute right-3 top-3 rounded-md bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white pointer-events-none uppercase tracking-wider">
                Dream India Vision
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 border-t border-border px-4 py-3 bg-slate-50 dark:bg-slate-900/50">
              <span className="text-xs text-muted-foreground font-medium">
                {selectedReport._id ? "Live community report" : "Interactive demo report"}
              </span>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleGenerateProposal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition"
              >
                <FileText className="size-4 mr-2" />
                Generate AI Planning Proposal
              </Button>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Exact bad conditions
              </p>
              <h2 className="text-xl font-semibold">Transformation atlas</h2>
            </div>
            <Route className="size-5 text-primary" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedIssue("all")}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                selectedIssue === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
            {issueOptions.map((issue) => (
              <button
                key={issue.value}
                type="button"
                onClick={() => setSelectedIssue(issue.value)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  selectedIssue === issue.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {issue.label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {reports.map((report) => (
              <button
                key={getReportId(report)}
                type="button"
                onClick={() => setSelectedReportId(getReportId(report))}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  getReportId(report) === getReportId(selectedReport)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex gap-3">
                  {report.beforeImageUrl ? (
                    <img
                      src={report.beforeImageUrl}
                      alt=""
                      className="size-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-md bg-muted">
                      <FileImage className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {report.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {report.locationName}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{report.severity}</span>
                      <span>•</span>
                      <span>{report.votes} votes</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            disabled={!selectedReport._id}
            onClick={() =>
              selectedReport._id
                ? vote({ id: selectedReport._id as Id<"transformationReports"> })
                : setMessage("Demo reports cannot be voted on until saved.")
            }
          >
            <Vote className="size-4" />
            Vote for priority
          </Button>
        </aside>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {reports.slice(0, 6).map((report) => (
            <article
              key={`grid-${getReportId(report)}`}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              <div className="grid grid-cols-2">
                <img
                  src={report.beforeImageUrl || "/assets/road-before.png"}
                  alt="Before condition"
                  className="h-36 w-full object-cover"
                />
                <img
                  src={report.afterImageUrl || "/assets/road-after.png"}
                  alt="After transformation"
                  className="h-36 w-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{report.title}</h3>
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                    {report.issueType}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {report.planningGoal}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* AI Proposal Document Modal */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none">AI Civic Planning Proposal</h3>
                  <p className="text-xs text-muted-foreground mt-1">Formal petition to local municipality authorities</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
              {isGeneratingProposal ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="size-12 animate-spin text-emerald-600 mb-4" />
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    Drafting Civic Transformation Petition
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1 leading-relaxed">
                    Analyzing site location, formulating modern engineering guidelines, and structuring citizens' endorsement...
                  </p>
                  
                  {/* Step Indicators */}
                  <div className="mt-8 space-y-2.5 w-64 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Retrieving community report data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-slate-300" />
                      <span>Formulating structured municipal sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-slate-300" />
                      <span>Styling professional Markdown</span>
                    </div>
                  </div>
                </div>
              ) : proposal ? (
                <div className="prose dark:prose-invert prose-emerald max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {proposal}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">No proposal generated.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card">
              <span className="text-xs text-muted-foreground">
                Document is stored securely in the Convex database.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (proposal) {
                      navigator.clipboard.writeText(proposal);
                      setMessage("Proposal document copied to clipboard!");
                    }
                  }}
                  disabled={!proposal}
                  className="font-medium"
                >
                  <Copy className="size-4 mr-2" />
                  Copy Document
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-primary-foreground/15 bg-primary-foreground/10 p-3">
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-primary-foreground/75">
        {label}
      </div>
    </div>
  );
}
