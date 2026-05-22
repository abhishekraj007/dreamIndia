"use client";

import { useConvexAuth } from "convex/react";
import { AuthenticatedLayout } from "@/components/authenticated-layout";
import Header from "@/components/header";
import { usePathname } from "next/navigation";

const publicRoutes = ["/", "/pricing", "/docs", "/auth/sign-in", "/auth/sign-up"];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname?.startsWith("/auth/") || pathname?.startsWith("/docs");

  // Show traditional header for public routes
  if (isPublicRoute) {
    return (
      <div className="grid grid-rows-[auto_1fr] h-svh">
        <Header />
        {children}
      </div>
    );
  }

  // For protected routes: show sidebar layout if authenticated or still loading
  // This prevents the layout from flashing to public header during navigation
  if (isAuthenticated || isLoading) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // Not authenticated and not loading -- show public header
  return (
    <div className="grid grid-rows-[auto_1fr] h-svh">
      <Header />
      {children}
    </div>
  );
}
