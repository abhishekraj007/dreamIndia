"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle
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

  const userName = userData?.profile?.name || userData?.userMetadata?.name || "Citizen";
  const userEmail = userData?.profile?.email || userData?.userMetadata?.email;

  // Stats calculations
  const totalReports = userReports?.length || 0;
  const totalVotes = userReports?.reduce((sum: number, r: any) => sum + r.votes, 0) || 0;
  const totalProposals = userReports?.filter((r: any) => !!r.aiProposal).length || 0;

  async function handleOpenProposal(reportId: string, title: string, existingProposal?: string) {
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
      const res = await generateProposal({ reportId: reportId as Id<"transformationReports"> });
      setProposalText(res.proposal);
    } catch (error) {
      console.error("Proposal generation failed:", error);
      setErrorMsg("Failed to generate AI planning proposal. Please try again later.");
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
      <div className="min-h-screen bg-[#f7f9f6] dark:bg-slate-950 text-slate-900 dark:text-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1300px] mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                Citizen Hub
              </p>
              <h1 className="text-3xl font-bold tracking-tight mt-1">
                Your Civic Transformation Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{userName}</span> ({userEmail})
              </p>
            </div>
            <Link href="/">
              <Button className="bg-[#0d4f3b] hover:bg-[#093a2b] text-white font-medium shadow-md">
                <Plus className="size-4 mr-2" />
                Submit New Report
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Reports Submitted</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-[#0d4f3b] dark:text-emerald-400">{totalReports}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Priority Votes Received</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{totalVotes}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Municipal Proposals</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalProposals}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Reports Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
              Your Infrastructure Cases
            </h2>

            {!userReports ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-emerald-600" />
              </div>
            ) : userReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                <AlertTriangle className="size-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-lg font-semibold">No reports submitted yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Upload a photo of a bad road, polluted river, or public space to start transforming India.
                </p>
                <Link href="/" className="mt-4">
                  <Button className="bg-[#0d4f3b] hover:bg-[#093a2b] text-white">
                    Create Your First Report
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userReports.map((report: any) => {
                  const issueTypeColors: Record<string, string> = {
                    roads: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
                    rivers: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
                    "popular-place": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
                    transit: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
                    waste: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
                    drainage: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
                  };

                  const severityColors: Record<string, string> = {
                    low: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
                    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300",
                    high: "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300",
                    critical: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50",
                  };

                  return (
                    <Card key={report._id} className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                      <div>
                        {/* Image side-by-side header */}
                        <div className="grid grid-cols-2 h-36 bg-slate-100 dark:bg-slate-950 relative">
                          <img
                            src={report.beforeImageUrl || "/assets/road-before.png"}
                            alt="Before"
                            className="h-full w-full object-cover border-r border-slate-200 dark:border-slate-850"
                          />
                          {report.afterImageUrl ? (
                            <img
                              src={report.afterImageUrl}
                              alt="After"
                              className="h-full w-full object-cover animate-pulse-slow"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center bg-slate-50 dark:bg-slate-900/50 h-full">
                              <Sparkles className="size-5 text-emerald-500 mb-1" />
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Transform Pending</span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${issueTypeColors[report.issueType] || "bg-slate-100"}`}>
                              {report.issueType}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${severityColors[report.severity] || "bg-slate-100"}`}>
                              {report.severity}
                            </span>
                          </div>
                          <CardTitle className="text-base font-bold mt-2 truncate">
                            {report.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{report.locationName}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-1 pb-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {report.description}
                        </CardContent>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <Vote className="size-4 text-amber-500" />
                          <span>{report.votes} votes</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenProposal(report._id, report.title, report.aiProposal)}
                          className="h-8 text-xs font-semibold"
                        >
                          <FileText className="size-3.5 mr-1 text-emerald-600" />
                          {report.aiProposal ? "View Proposal" : "Build Proposal"}
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
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none">AI Civic Planning Proposal</h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs sm:max-w-md">Case: {selectedReportTitle}</p>
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
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
              {isGenerating ? (
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
                      <div className="size-1.5 rounded-full bg-slate-300 animate-pulse" />
                      <span>Formulating structured municipal sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-slate-300" />
                      <span>Styling professional Markdown</span>
                    </div>
                  </div>
                </div>
              ) : errorMsg ? (
                <p className="text-center text-sm text-red-500 font-semibold">{errorMsg}</p>
              ) : proposalText ? (
                <div className="prose dark:prose-invert prose-emerald max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {proposalText}
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
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
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
