"use client";

import { AccountScreen } from "@/components/settings/account-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <AccountScreen />
      </div>
    </ProtectedRoute>
  );
}
