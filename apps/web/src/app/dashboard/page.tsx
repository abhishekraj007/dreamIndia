"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { issueTypeBadge, severityBadge } from "@/lib/badge-styles";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Vote,
  FileText,
  Sparkles,
  Loader2,
  Copy,
  X,
  BookOpen,
  Plus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const userReports = useQuery(api.reports.listUserReports);
  const vote = useMutation(api.reports.vote);
  const generateProposal = useAction(api.civicConsultant.generateProposal);

  // Proposal modal states
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReportTitle, setSelectedReportTitle] = useState<string>("");
  const [proposalText, setProposalText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userName =
    userData?.profile?.name || userData?.userMetadata?.name || "Citizen";
  const userEmail = userData?.profile?.email || userData?.userMetadata?.email;

  // Stats calculations
  const totalReports = userReports?.length || 0;
  const totalVotes =
    userReports?.reduce((sum: number, r: any) => sum + r.votes, 0) || 0;
  const totalProposals =
    userReports?.filter((r: any) => !!r.aiProposal).length || 0;

  async function handleOpenProposal(
    reportId: string,
    title: string,
    existingProposal?: string,
  ) {
    setSelectedReportId(reportId);
    setSelectedReportTitle(title);
    setErrorMsg(null);
    setIsModalOpen(true);

    if (existingProposal) {
      setProposalText(existingProposal);
      return;
    }

    // Generate proposal on-demand
    setProposalText(null);
    setIsGenerating(true);
    try {
      const res = await generateProposal({
        reportId: reportId as Id<"transformationReports">,
      });
      setProposalText(res.proposal);
    } catch (error) {
      console.error("Proposal generation failed:", error);
      setErrorMsg(
        "Failed to generate AI planning proposal. Please try again later.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopyProposal() {
    if (!proposalText) return;
    navigator.clipboard.writeText(proposalText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1300px] mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Citizen Hub
              </p>
              <h1 className="text-3xl font-bold tracking-tight mt-1">
                Your Civic Transformation Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome back,{" "}
                <span className="font-semibold text-foreground">
                  {userName}
                </span>{" "}
                ({userEmail})
              </p>
            </div>
            <Link href="/">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md">
                <Plus className="size-4 mr-2" />
                Submit New Report
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                  Reports Submitted
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-primary">
                  {totalReports}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                  Priority Votes Received
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {totalVotes}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                  Municipal Proposals
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-primary">
                  {totalProposals}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Reports Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Your Infrastructure Cases
            </h2>

            {!userReports ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : userReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-card border border-border rounded-xl p-6">
                <AlertTriangle className="size-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-lg font-semibold">
                  No reports submitted yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Upload a photo of a bad road, polluted river, or public space
                  to start transforming India.
                </p>
                <Link href="/" className="mt-4">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Your First Report
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userReports.map((report: any) => {
                  return (
                    <Card
                      key={report._id}
                      className="overflow-hidden border border-border bg-card shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Image side-by-side header */}
                        <div className="grid grid-cols-2 h-36 bg-muted relative">
                          <img
                            src={
                              report.beforeImageUrl || "/assets/road-before.png"
                            }
                            alt="Before"
                            className="h-full w-full object-cover border-r border-border"
                          />
                          {report.afterImageUrl ? (
                            <img
                              src={report.afterImageUrl}
                              alt="After"
                              className="h-full w-full object-cover animate-pulse-slow"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center bg-muted h-full">
                              <Sparkles className="size-5 text-primary mb-1" />
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                Transform Pending
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${issueTypeBadge(report.issueType)}`}
                            >
                              {report.issueType}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadge(report.severity)}`}
                            >
                              {report.severity}
                            </span>
                          </div>
                          <CardTitle className="text-base font-bold mt-2 truncate">
                            {report.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {report.locationName}
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-1 pb-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {report.description}
                        </CardContent>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 pt-0 border-t border-border bg-muted/40 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <Vote className="size-4 text-amber-500" />
                          <span>{report.votes} votes</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenProposal(
                              report._id,
                              report.title,
                              report.aiProposal,
                            )
                          }
                          className="h-8 text-xs font-semibold"
                        >
                          <FileText className="size-3.5 mr-1 text-primary" />
                          {report.aiProposal
                            ? "View Proposal"
                            : "Build Proposal"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Proposal Modal inside Dashboard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/15 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none">
                    AI Civic Planning Proposal
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs sm:max-w-md">
                    Case: {selectedReportTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-muted/35">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="size-12 animate-spin text-primary mb-4" />
                  <h4 className="text-base font-semibold text-foreground">
                    Drafting Civic Transformation Petition
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1 leading-relaxed">
                    Analyzing site location, formulating modern engineering
                    guidelines, and structuring citizens' endorsement...
                  </p>

                  {/* Step Indicators */}
                  <div className="mt-8 space-y-2.5 w-64 text-left text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary animate-ping" />
                      <span>Retrieving community report data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                      <span>Formulating structured municipal sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-muted-foreground/40" />
                      <span>Styling professional Markdown</span>
                    </div>
                  </div>
                </div>
              ) : errorMsg ? (
                <p className="text-center text-sm text-red-500 font-semibold">
                  {errorMsg}
                </p>
              ) : proposalText ? (
                <div className="prose dark:prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {proposalText}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No proposal generated.
                </p>
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
                  onClick={handleCopyProposal}
                  disabled={!proposalText}
                  className="font-medium"
                >
                  <Copy className="size-4 mr-2" />
                  {copyFeedback ? "Copied!" : "Copy Document"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
