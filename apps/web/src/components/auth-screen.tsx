"use client";

import { useSearchParams } from "next/navigation";
import { GoogleLoginPanel } from "./google-login-panel";

export default function AuthScreen() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  return (
    <div className="flex w-full justify-center bg-background">
      <div className="w-full max-w-6xl">
        <GoogleLoginPanel variant="page" returnUrl={redirectTo} />
      </div>
    </div>
  );
}
