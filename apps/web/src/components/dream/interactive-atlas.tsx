"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { api } from "@convex-starter/backend/convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authClient } from "@/lib/auth-client";
import { issueTypeBadge } from "@/lib/badge-styles";
import { demoReports, demoStats, issueOptions } from "@/lib/dream-data";
import type {
  DreamReport,
  DreamStats,
  IssueType,
  Severity,
} from "@/lib/dream-types";
import { readGpsFromImage } from "@/lib/exif";
import { LoginModal } from "@/components/login-modal";
import { SourcePreview } from "@/components/dream/source-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Camera,
  CheckCircle2,
  Copy,
  FileImage,
  FileText,
  Layers3,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Send,
  Sparkles,
  Upload,
  Vote,
  WandSparkles,
  X,
} from "lucide-react";

const reportIdTable = "transformationReports";

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

type AutoField = keyof Draft;

type ReverseGeocodeResult = {
  formattedAddress: string | null;
  locationName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
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

function isAuthError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    message.includes("sign in") ||
    message.includes("unauth") ||
    message.includes("not authenticated")
  );
}

function shouldReplaceLocation(value: string, defaultValue: string) {
  const trimmed = value.trim();
  return !trimmed || trimmed === defaultValue;
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
  const [autoDetectedFields, setAutoDetectedFields] = useState<Set<AutoField>>(
    new Set(),
  );
  const [file, setFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [beforeStorageId, setBeforeStorageId] = useState<Id<"_storage"> | null>(
    null,
  );
  const [afterStorageId, setAfterStorageId] = useState<Id<"_storage"> | null>(
    null,
  );
  const [beforeR2Key, setBeforeR2Key] = useState<string | null>(null);
  const [afterR2Key, setAfterR2Key] = useState<string | null>(null);
  const [divider, setDivider] = useState(52);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState<
    Record<string, { voted: boolean; votes: number }>
  >({});

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
  const transformImageAction = useAction(api.transform.transformImage);
  const ensureStorageImageInR2 = useAction(
    api.transform.ensureStorageImageInR2,
  );
  const reverseGeocode = useAction(api.geo.reverseGeocode);
  const generateCivicProposal = useAction(api.civicConsultant.generateProposal);

  const reports = (liveReports?.length ? liveReports : initialReports).map(
    (report) => ({ ...report, id: getReportId(report) }),
  ) as DreamReport[];
  const stats = liveStats ?? initialStats;
  const selectedReport =
    reports.find((report) => getReportId(report) === selectedReportId) ??
    reports[0] ??
    demoReports[0];
  const selectedReportConvexId = selectedReport._id
    ? (selectedReport._id as Id<typeof reportIdTable>)
    : null;
  const hasVoted = useQuery(
    api.reports.hasVoted,
    selectedReportConvexId ? { id: selectedReportConvexId } : "skip",
  );

  const beforeImage = beforePreview ?? selectedReport.beforeImageUrl;
  const afterImage = generatedImage ?? selectedReport.afterImageUrl;
  const hasLatLng = Boolean(draft.lat && draft.lng);
  const canUseStreetView = hasLatLng && !file && !isTransforming;

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
    setAutoDetectedFields((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function markAutoDetected(fields: Array<AutoField>) {
    setAutoDetectedFields((current) => {
      const next = new Set(current);
      fields.forEach((field) => next.add(field));
      return next;
    });
  }

  function openLoginForAuthError(error: unknown) {
    if (isAuthError(error)) {
      setLoginModalOpen(true);
    }
  }

  function applyAnalysis(analysis: {
    description: string;
    planningGoal: string;
    severity: Severity;
    tags: Array<string>;
  }) {
    setDraft((current) => ({
      ...current,
      description: analysis.description,
      planningGoal: analysis.planningGoal,
      severity: analysis.severity,
      tags: analysis.tags.join(", "),
    }));
    markAutoDetected(["description", "planningGoal", "severity", "tags"]);
  }

  function applyReverseGeocodeResult(
    result: ReverseGeocodeResult,
    coords?: { lat: number; lng: number },
  ) {
    const changedFields: Array<AutoField> = [];
    setDraft((current) => {
      const next = { ...current };
      if (coords) {
        next.lat = coords.lat.toFixed(6);
        next.lng = coords.lng.toFixed(6);
        changedFields.push("lat", "lng");
      }
      if (
        result.locationName &&
        shouldReplaceLocation(current.locationName, emptyDraft.locationName)
      ) {
        next.locationName = result.locationName;
        changedFields.push("locationName");
      }
      if (
        result.formattedAddress &&
        shouldReplaceLocation(current.address, emptyDraft.address)
      ) {
        next.address = result.formattedAddress;
        changedFields.push("address");
      }
      return next;
    });
    if (changedFields.length) {
      markAutoDetected(changedFields);
    }
  }

  async function reverseGeocodeAndPatch(coords: { lat: number; lng: number }) {
    const result = await reverseGeocode(coords);
    applyReverseGeocodeResult(result, coords);
    return result;
  }

  async function uploadFileForTransform(nextFile: File) {
    const uploadUrl = await generateUploadUrl();
    return await uploadToConvex(uploadUrl, nextFile);
  }

  async function runTransform(args: {
    photoStorageId?: Id<"_storage">;
    lat?: number;
    lng?: number;
    locationName?: string;
  }) {
    const result = await transformImageAction({
      photoStorageId: args.photoStorageId,
      lat: args.lat,
      lng: args.lng,
      locationName: args.locationName || draft.locationName,
      issueType: draft.issueType,
      planningGoal: draft.planningGoal,
      notes: draft.description,
    });

    setBeforeStorageId(result.beforeStorageId);
    setAfterStorageId(result.afterStorageId);
    setBeforeR2Key(result.beforeR2Key ?? null);
    setAfterR2Key(result.afterR2Key ?? null);
    setBeforePreview(result.beforeUrl);
    setGeneratedImage(result.afterUrl);
    setDivider(48);
    applyAnalysis(result.analysis);
    setMessage(`Transformed with ${result.model}.`);
  }

  async function onFileChange(nextFile: File | null) {
    setFile(nextFile);
    setGeneratedImage(null);
    setAfterStorageId(null);
    setBeforeStorageId(null);
    setBeforeR2Key(null);
    setAfterR2Key(null);
    setMessage(null);

    if (!nextFile) {
      setBeforePreview(null);
      return;
    }

    setBeforePreview(URL.createObjectURL(nextFile));
    setIsTransforming(true);
    setIsLocating(true);

    try {
      let nextCoords: { lat: number; lng: number } | undefined;
      let nextLocationName = draft.locationName;
      const gps = await readGpsFromImage(nextFile);
      if (gps) {
        nextCoords = gps;
        const geocode = await reverseGeocodeAndPatch(gps);
        nextLocationName = geocode.locationName || nextLocationName;
      }
      setIsLocating(false);

      const storageId = await uploadFileForTransform(nextFile);
      setBeforeStorageId(storageId);
      await runTransform({
        photoStorageId: storageId,
        lat: nextCoords?.lat,
        lng: nextCoords?.lng,
        locationName: nextLocationName,
      });
    } catch (error) {
      console.error("Upload analysis and transform failed:", error);
      openLoginForAuthError(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Photo upload or automatic transformation failed.",
      );
    } finally {
      setIsLocating(false);
      setIsTransforming(false);
    }
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await reverseGeocodeAndPatch({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMessage("Location captured and reverse geocoded.");
        } catch (error) {
          setDraft((current) => ({
            ...current,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          }));
          markAutoDetected(["lat", "lng"]);
          setMessage(
            error instanceof Error
              ? error.message
              : "Location captured, but reverse geocoding failed.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setMessage("Location permission was not granted.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleUseStreetView() {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    if (!draft.lat || !draft.lng) {
      setMessage("Set latitude and longitude before using Street View.");
      return;
    }

    setIsTransforming(true);
    setMessage(null);
    setFile(null);
    setAfterStorageId(null);
    setAfterR2Key(null);
    setGeneratedImage(null);

    try {
      await runTransform({
        lat: Number(draft.lat),
        lng: Number(draft.lng),
      });
    } catch (error) {
      console.error("Street View transform failed:", error);
      openLoginForAuthError(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Street View transform failed.",
      );
    } finally {
      setIsTransforming(false);
    }
  }

  async function transformImage() {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setIsTransforming(true);
    setMessage(null);
    try {
      if (beforeStorageId) {
        await runTransform({ photoStorageId: beforeStorageId });
        return;
      }
      if (file) {
        const storageId = await uploadFileForTransform(file);
        setBeforeStorageId(storageId);
        await runTransform({ photoStorageId: storageId });
        return;
      }
      if (draft.lat && draft.lng) {
        await runTransform({ lat: Number(draft.lat), lng: Number(draft.lng) });
        return;
      }
      setMessage("Upload a photo or set coordinates before transforming.");
    } catch (error) {
      console.error("Image transform failed:", error);
      openLoginForAuthError(error);
      setMessage(error instanceof Error ? error.message : "Transform failed.");
    } finally {
      setIsTransforming(false);
    }
  }

  async function saveReport() {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      setMessage("Sign in to save reports to the shared Convex atlas.");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const activeBeforeStorageId =
        beforeStorageId ??
        (file ? await uploadFileForTransform(file) : undefined);
      let activeBeforeR2Key = beforeR2Key;

      if (activeBeforeStorageId && !activeBeforeR2Key) {
        const persistedBeforeImage = await ensureStorageImageInR2({
          storageId: activeBeforeStorageId,
        });
        activeBeforeR2Key = persistedBeforeImage.r2Key;
        setBeforeR2Key(persistedBeforeImage.r2Key);
      }

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
        afterStorageId: afterStorageId ?? undefined,
        beforeR2Key: activeBeforeR2Key ?? undefined,
        afterR2Key: afterR2Key ?? undefined,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setMessage("Saved to the live Convex atlas.");
    } catch (error) {
      openLoginForAuthError(error);
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateProposal() {
    if (!selectedReport._id) {
      setMessage("Save the report before generating a proposal.");
      return;
    }
    if (!isAuthenticated) {
      setLoginModalOpen(true);
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
      const res = await generateCivicProposal({
        reportId: selectedReport._id as Id<"transformationReports">,
      });
      setProposal(res.proposal);
    } catch (error) {
      console.error("Proposal generation failed:", error);
      openLoginForAuthError(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate AI proposal.",
      );
      setIsProposalModalOpen(false);
    } finally {
      setIsGeneratingProposal(false);
    }
  }

  async function handleVote() {
    if (!selectedReportConvexId) {
      setMessage("Demo reports cannot be voted on until saved.");
      return;
    }
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    const reportKey = selectedReportConvexId;
    const currentVotes =
      optimisticVotes[reportKey]?.votes ?? selectedReport.votes;
    const currentVoted = optimisticVotes[reportKey]?.voted ?? hasVoted ?? false;
    setOptimisticVotes((current) => ({
      ...current,
      [reportKey]: {
        voted: !currentVoted,
        votes: Math.max(0, currentVotes + (currentVoted ? -1 : 1)),
      },
    }));

    try {
      const result = await vote({ id: selectedReportConvexId });
      setOptimisticVotes((current) => ({
        ...current,
        [reportKey]: result,
      }));
    } catch (error) {
      openLoginForAuthError(error);
      setOptimisticVotes((current) => ({
        ...current,
        [reportKey]: { voted: currentVoted, votes: currentVotes },
      }));
      setMessage(error instanceof Error ? error.message : "Vote failed.");
    }
  }

  const displayedSelectedVotes = selectedReportConvexId
    ? (optimisticVotes[selectedReportConvexId]?.votes ?? selectedReport.votes)
    : selectedReport.votes;
  const displayedSelectedVoted = selectedReportConvexId
    ? (optimisticVotes[selectedReportConvexId]?.voted ?? hasVoted ?? false)
    : false;

  const handleSliderMove = (clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    const percentage = Math.max(
      0,
      Math.min(100, (x / containerRect.width) * 100),
    );
    setDivider(percentage);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    handleSliderMove(event.clientX, rect);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    handleSliderMove(event.clientX, rect);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid max-w-[1500px] gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:grid-cols-[360px_minmax(0,1fr)_340px]">
        <aside className="order-2 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:order-1">
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

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <UploadLabel icon={<Camera className="size-4" />} label="Camera">
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) =>
                  onFileChange(event.target.files?.[0] ?? null)
                }
              />
            </UploadLabel>
            <UploadLabel icon={<Upload className="size-4" />} label="Upload">
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  onFileChange(event.target.files?.[0] ?? null)
                }
              />
            </UploadLabel>
            <Button
              type="button"
              variant="outline"
              className="h-12 justify-center gap-2"
              onClick={handleUseStreetView}
              disabled={!canUseStreetView}
            >
              <Layers3 className="size-4" />
              Street View
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <AutoFieldShell show={autoDetectedFields.has("title")}>
              <Input
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                aria-label="Report title"
              />
            </AutoFieldShell>
            <AutoFieldShell show={autoDetectedFields.has("locationName")}>
              <Input
                value={draft.locationName}
                onChange={(event) =>
                  updateDraft("locationName", event.target.value)
                }
                aria-label="Location name"
              />
            </AutoFieldShell>
            <AutoFieldShell show={autoDetectedFields.has("address")}>
              <Input
                value={draft.address}
                onChange={(event) => updateDraft("address", event.target.value)}
                aria-label="Address"
                placeholder="Address or landmark"
              />
            </AutoFieldShell>
            <div>
              {(autoDetectedFields.has("lat") ||
                autoDetectedFields.has("lng")) && <AutoDetectedPill />}
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
                  disabled={isLocating}
                  aria-label="Use current location"
                >
                  {isLocating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LocateFixed className="size-4" />
                  )}
                </Button>
              </div>
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
              <div>
                {autoDetectedFields.has("severity") && <AutoDetectedPill />}
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
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
            </div>
            <AutoFieldShell show={autoDetectedFields.has("description")}>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={draft.description}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                aria-label="Current condition notes"
              />
            </AutoFieldShell>
            <AutoFieldShell show={autoDetectedFields.has("planningGoal")}>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={draft.planningGoal}
                onChange={(event) =>
                  updateDraft("planningGoal", event.target.value)
                }
                aria-label="Transformation goal"
              />
            </AutoFieldShell>
            <AutoFieldShell show={autoDetectedFields.has("tags")}>
              <Input
                value={draft.tags}
                onChange={(event) => updateDraft("tags", event.target.value)}
                aria-label="Tags"
              />
            </AutoFieldShell>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={transformImage}
              disabled={isTransforming}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isTransforming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              {isTransforming ? "Transforming" : "Transform"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveReport}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
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
              : "Sign in to generate, save, vote, and share reports."}
          </p>
        </aside>

        <section className="order-1 flex min-h-0 flex-col gap-3 sm:gap-4 lg:order-2">
          <SourcePreview
            lat={draft.lat}
            lng={draft.lng}
            locationName={draft.locationName}
            address={draft.address}
            beforeImage={beforePreview}
            hasUploadedFile={!!file}
            onLocationResolved={({
              coords,
              formattedAddress,
              locationName,
            }) => {
              const changed: Array<AutoField> = ["lat", "lng"];
              setDraft((current) => {
                const next = {
                  ...current,
                  lat: coords.lat.toFixed(6),
                  lng: coords.lng.toFixed(6),
                };
                if (locationName) {
                  next.locationName = locationName;
                  changed.push("locationName");
                }
                if (formattedAddress) {
                  next.address = formattedAddress;
                  changed.push("address");
                }
                return next;
              });
              markAutoDetected(changed);
            }}
            onMessage={setMessage}
          />

          <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="hidden rounded-xl border border-border bg-primary p-4 text-primary-foreground shadow-sm xl:block">
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
                  <div
                    key={item}
                    className="flex gap-2 text-sm text-primary-foreground/90"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden xl:block" />
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Before / Dream India after
                </p>
                <h2 className="text-xl font-semibold">
                  {selectedReport.title}
                </h2>
              </div>
            </div>
            <div
              className="group relative aspect-[16/10] min-h-[260px] cursor-ew-resize touch-none select-none overflow-hidden bg-muted sm:aspect-[16/8] sm:min-h-[310px]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {afterImage ? (
                <img
                  src={afterImage}
                  alt="Dream India transformed condition"
                  className="pointer-events-none absolute inset-0 size-full object-cover"
                />
              ) : (
                <ImageFallback label="After image pending" />
              )}
              {beforeImage ? (
                <img
                  src={beforeImage}
                  alt="Current bad infrastructure condition"
                  className="pointer-events-none absolute inset-0 size-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - divider}% 0 0)` }}
                />
              ) : (
                <ImageFallback
                  label="Before image pending"
                  clipped
                  divider={divider}
                />
              )}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
                style={{ left: `${divider}%` }}
              />
              <div
                className="pointer-events-none absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/25 text-white shadow-xl backdrop-blur transition-transform duration-100 group-hover:scale-105"
                style={{ left: `${divider}%` }}
              >
                <Layers3 className="size-4" />
              </div>
              <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/65 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Current
              </div>
              <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                Vision
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedReport._id
                  ? "Live community report"
                  : "Interactive demo report"}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateProposal}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <FileText className="size-4" />
                Generate AI Planning Proposal
              </Button>
            </div>
          </div>
        </section>

        <aside className="order-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:order-3">
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
            <IssueFilterButton
              active={selectedIssue === "all"}
              onClick={() => setSelectedIssue("all")}
            >
              All
            </IssueFilterButton>
            {issueOptions.map((issue) => (
              <IssueFilterButton
                key={issue.value}
                active={selectedIssue === issue.value}
                onClick={() => setSelectedIssue(issue.value)}
              >
                {issue.label}
              </IssueFilterButton>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {reports.map((report) => {
              const reportKey = getReportId(report);
              const reportVotes = report._id
                ? (optimisticVotes[report._id]?.votes ?? report.votes)
                : report.votes;
              return (
                <button
                  key={reportKey}
                  type="button"
                  onClick={() => setSelectedReportId(reportKey)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    reportKey === getReportId(selectedReport)
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
                        <span>/</span>
                        <span>{reportVotes} votes</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant={displayedSelectedVoted ? "default" : "outline"}
            className="mt-4 w-full"
            disabled={!selectedReport._id}
            onClick={handleVote}
          >
            <Vote
              className={`size-4 ${displayedSelectedVoted ? "fill-current" : ""}`}
            />
            {displayedSelectedVoted ? "Voted" : "Vote for priority"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {displayedSelectedVotes.toLocaleString()} priority votes
          </p>
        </aside>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${issueTypeBadge(report.issueType)}`}
                  >
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

      {isProposalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/15 p-2 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none">
                    AI Civic Planning Proposal
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formal petition to local municipality authorities
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/35 px-6 py-6">
              {isGeneratingProposal ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="mb-4 size-12 animate-spin text-primary" />
                  <h4 className="text-base font-semibold text-foreground">
                    Drafting civic transformation petition
                  </h4>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Analyzing site location, engineering constraints, and
                    citizen impact.
                  </p>
                </div>
              ) : proposal ? (
                <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {proposal}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No proposal generated.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
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
                      setMessage("Proposal document copied to clipboard.");
                    }
                  }}
                  disabled={!proposal}
                >
                  <Copy className="size-4" />
                  Copy Document
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsProposalModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        returnUrl="/"
      />
    </main>
  );
}

function UploadLabel({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-muted px-3 text-sm font-medium hover:bg-card">
      {icon}
      {label}
      {children}
    </label>
  );
}

function AutoDetectedPill() {
  return (
    <div className="mb-1 flex justify-end">
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        auto-detected
      </span>
    </div>
  );
}

function AutoFieldShell({
  children,
  show,
}: {
  children: ReactNode;
  show: boolean;
}) {
  return (
    <div>
      {show && <AutoDetectedPill />}
      {children}
    </div>
  );
}

function IssueFilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ImageFallback({
  label,
  clipped,
  divider,
}: {
  label: string;
  clipped?: boolean;
  divider?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 grid place-items-center bg-muted text-sm font-medium text-muted-foreground"
      style={
        clipped && divider !== undefined
          ? { clipPath: `inset(0 ${100 - divider}% 0 0)` }
          : undefined
      }
    >
      <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
        <Sparkles className="mx-auto mb-1 size-4 text-primary" />
        {label}
      </div>
    </div>
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
