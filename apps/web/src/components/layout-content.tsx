"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";

const bareLayoutRoutes = ["/auth"];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare =
    !!pathname &&
    bareLayoutRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

  if (isBare) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
