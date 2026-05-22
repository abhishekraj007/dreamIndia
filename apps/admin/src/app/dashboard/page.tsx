"use client";

import { api } from "@convex-starter/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { PageHeader } from "@/components/admin/page-header";
import { PageShell } from "@/components/admin/page-shell";
import { StatChip } from "@/components/admin/stat-chip";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const uploads = useQuery(api.uploads.listUserUploads, { limit: 50 });
  const audienceStats = useQuery(
    api.pushNotifications.adminGetPushAudienceStats,
    userData?.profile?.isAdmin ? {} : "skip",
  );

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of reusable account, upload, notification, and runtime configuration tools."
        />

        <div className="mb-6 flex flex-wrap gap-2">
          <StatChip label="uploads" value={uploads?.length ?? 0} />
          <StatChip
            label="push audience"
            value={audienceStats?.eligibleUsers ?? 0}
            variant="outline"
          />
          <StatChip
            label="registered devices"
            value={audienceStats?.registeredUsers ?? 0}
            variant="outline"
          />
        </div>

        {userData === undefined ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Welcome back,{" "}
                {userData?.profile?.name || userData?.userMetadata?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use this admin console to manage shared app settings, uploads,
                push notifications, account access, and billing primitives.
              </p>
            </CardContent>
          </Card>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
