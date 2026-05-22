"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { Copy, Loader2, MessageCircle, Sparkles, Vote } from "lucide-react";
import { toast } from "sonner";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { ProposalPdfButton } from "./proposal-pdf";

export function ReportShare({
  hasProposal,
  locationName,
  reportId,
  title,
  votes,
}: {
  hasProposal: boolean;
  locationName: string;
  reportId: string;
  title: string;
  votes: number;
}) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [optimisticVote, setOptimisticVote] = useState<{
    voted: boolean;
    votes: number;
  } | null>(null);
  const convexReportId = reportId as Id<"transformationReports">;
  const hasVoted = useQuery(api.reports.hasVoted, { id: convexReportId });
  const vote = useMutation(api.reports.vote);
  const generateProposal = useAction(api.civicConsultant.generateProposal);

  const currentVoted = optimisticVote?.voted ?? hasVoted ?? false;
  const currentVotes = optimisticVote?.votes ?? votes;

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(currentUrl || window.location.href);
    toast.success("Report link copied.");
  }

  async function toggleVote() {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    const previous = { voted: currentVoted, votes: currentVotes };
    setOptimisticVote({
      voted: !currentVoted,
      votes: Math.max(0, currentVotes + (currentVoted ? -1 : 1)),
    });

    try {
      const result = await vote({ id: convexReportId });
      setOptimisticVote(result);
    } catch (error) {
      setOptimisticVote(previous);
      toast.error(error instanceof Error ? error.message : "Vote failed.");
    }
  }

  async function handleGenerateProposal() {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      await generateProposal({ reportId: convexReportId });
      toast.success("Proposal generated.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate proposal.";
      if (
        message.toLowerCase().includes("sign in") ||
        message.toLowerCase().includes("unauth")
      ) {
        setLoginOpen(true);
      } else {
        toast.error(message);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const encodedShare = encodeURIComponent(
    `${title} - ${locationName}\n${currentUrl}`,
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          onClick={toggleVote}
          variant={currentVoted ? "default" : "outline"}
        >
          <Vote className={`size-4 ${currentVoted ? "fill-current" : ""}`} />
          {currentVoted ? "Voted" : "Vote"} ({currentVotes.toLocaleString()})
        </Button>
        {!hasProposal && (
          <Button
            type="button"
            onClick={handleGenerateProposal}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate proposal
          </Button>
        )}
        <ProposalPdfButton
          hasProposal={hasProposal}
          reportId={reportId}
          title={title}
        />
        <Button type="button" variant="outline" onClick={copyLink}>
          <Copy className="size-4" />
          Copy link
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://wa.me/?text=${encodedShare}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedShare}`}
            target="_blank"
            rel="noreferrer"
          >
            X
          </a>
        </Button>
      </div>
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        returnUrl={`/r/${reportId}`}
      />
    </div>
  );
}
