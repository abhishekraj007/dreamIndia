"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useAuthCallbackUrl(returnUrl?: string) {
  const pathname = usePathname();

  return useMemo(() => {
    if (typeof window === "undefined") {
      return "/";
    }
    const path = returnUrl ?? pathname ?? "/";
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }, [returnUrl, pathname]);
}
