"use client";

import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

export function ProposalPdfButton({
  hasProposal,
  reportId,
  title,
}: {
  hasProposal: boolean;
  reportId: string;
  title: string;
}) {
  const { isAuthenticated } = useConvexAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  async function downloadPdf() {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    if (!hasProposal) {
      toast.error("Generate the proposal before downloading a PDF.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch("/api/proposal-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (response.status === 401) {
        setLoginOpen(true);
        return;
      }
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Unable to generate PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "proposal"
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to generate PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={downloadPdf}
        disabled={isDownloading || !hasProposal}
      >
        {isDownloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Download PDF
      </Button>
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        returnUrl={`/r/${reportId}`}
      />
    </>
  );
}
