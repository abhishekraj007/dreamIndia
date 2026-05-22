"use client";

import { useState } from "react";
import { MapPinned, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useAuthCallbackUrl } from "@/hooks/use-auth-callback-url";
import { Button } from "./ui/button";

type GoogleLoginPanelProps = {
  returnUrl?: string;
  variant?: "page" | "modal";
};

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginBanner({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-primary text-primary-foreground ${
        compact ? "min-h-[180px] md:min-h-0" : "min-h-[220px] lg:min-h-full"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22)_0%,transparent_55%)]" />
      <div className="pointer-events-none absolute -right-8 -bottom-8 size-48 rounded-full bg-accent/30 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
            <MapPinned className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-wide uppercase opacity-90">
            cockroachdreamindia
          </span>
        </div>
        <div className="mt-6 space-y-2 md:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">
            Civic transformation atlas
          </p>
          <p className="max-w-sm text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            Document bad infra. Visualize Dream India.
          </p>
          <p className="max-w-md text-sm leading-relaxed text-primary-foreground/80">
            Pin exact locations, compare before and after, and share realistic
            planning outcomes with your community.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginContent({
  isLoading,
  onGoogleSignIn,
}: {
  isLoading: boolean;
  onGoogleSignIn: () => void;
}) {
  return (
    <div className="flex flex-col justify-center gap-6 p-6 md:p-8 lg:p-10">
      <div className="space-y-2 text-center md:text-left">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary md:mx-0">
          <Sparkles className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Sign in to continue
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use your Google account to save reports, generate transformations, and
          vote on civic priorities across India.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onGoogleSignIn}
        disabled={isLoading}
        className="h-12 w-full gap-3 text-base font-medium"
      >
        <GoogleIcon />
        {isLoading ? "Redirecting to Google..." : "Continue with Google"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground md:text-left">
        By continuing, you agree to our{" "}
        <a
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

export function GoogleLoginPanel({
  returnUrl,
  variant = "page",
}: GoogleLoginPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const callbackURL = useAuthCallbackUrl(returnUrl);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch {
      toast.error("Failed to sign in with Google");
      setIsLoading(false);
    }
  }

  const layoutClass =
    variant === "modal"
      ? "flex w-full flex-col overflow-hidden rounded-lg md:max-w-3xl md:flex-row"
      : "flex min-h-[calc(100dvh-4rem)] w-full flex-col lg:min-h-[calc(100dvh-4rem)] lg:flex-row";

  const bannerClass =
    variant === "modal"
      ? "w-full shrink-0 md:w-[min(48%,320px)]"
      : "w-full shrink-0 lg:w-1/2 lg:max-w-xl";

  const contentClass =
    variant === "modal"
      ? "flex w-full flex-1 flex-col bg-card"
      : "flex w-full flex-1 flex-col bg-background lg:w-1/2";

  return (
    <div className={layoutClass}>
      <div className={bannerClass}>
        <LoginBanner compact={variant === "modal"} />
      </div>
      <div className={contentClass}>
        <LoginContent
          isLoading={isLoading}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
}
