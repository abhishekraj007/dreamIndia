"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CreditsModal } from "@/components/credits-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const userCredits = useQuery(api.features.credits.queries.getUserCredits);
  const premiumStatus = useQuery(api.features.premium.queries.isPremium);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("common");

  const isLoading = userData === undefined;

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Convex Starter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                  <LocaleSwitcher />
                </div>
                <ModeToggle />
                {isLoading ? (
                  <Skeleton className="hidden sm:block h-8 w-20 rounded-md" />
                ) : (
                  !premiumStatus?.isPremium && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push("/pricing")}
                      className="hidden sm:flex"
                    >
                      {t("upgrade")}
                    </Button>
                  )
                )}
                {isLoading ? (
                  <Skeleton className="h-8 w-16 rounded-md" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsModalOpen(true)}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    {userCredits?.credits ?? 0}
                  </Button>
                )}
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <CreditsModal
        open={creditsModalOpen}
        onOpenChange={setCreditsModalOpen}
      />
    </>
  );
}
