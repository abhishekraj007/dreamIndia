"use client";

import { useEffect, useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { PageHeader } from "@/components/admin/page-header";
import { PageShell } from "@/components/admin/page-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ConfigForm = {
  baseWebUrl: string;
  termsUrl: string;
  privacyUrl: string;
  helpCenterUrl: string;
  supportUrl: string;
  shareUrl: string;
  iosAppStoreId: string;
  androidAppId: string;
  revenueCatCreditProductIds: string;
};

const emptyForm: ConfigForm = {
  baseWebUrl: "",
  termsUrl: "",
  privacyUrl: "",
  helpCenterUrl: "",
  supportUrl: "",
  shareUrl: "",
  iosAppStoreId: "",
  androidAppId: "",
  revenueCatCreditProductIds: "[]",
};

const formatStringArrayValue = (value?: Array<string>) => {
  return JSON.stringify(value ?? [], null, 2);
};

const parseStringArrayValue = (value: string, label: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be a valid JSON array of strings`);
  }

  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== "string")
  ) {
    throw new Error(`${label} must be a JSON array of strings`);
  }

  return Array.from(
    new Set(
      parsed.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  );
};

export default function AppConfigPage() {
  const { isAuthenticated } = useConvexAuth();
  const adminConfig = useQuery(
    api.features.appConfig.queries.getAdminAppConfig,
    isAuthenticated ? {} : "skip",
  );
  const publicConfig = useQuery(
    api.features.appConfig.queries.getPublicAppConfig,
    isAuthenticated ? {} : "skip",
  );
  const upsertConfig = useMutation(
    api.features.appConfig.mutations.upsertAppConfig,
  );

  const [form, setForm] = useState<ConfigForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  useEffect(() => {
    if (!adminConfig || hasLoadedInitial) {
      return;
    }

    setForm({
      baseWebUrl: adminConfig.baseWebUrl ?? "",
      termsUrl: adminConfig.termsUrl ?? "",
      privacyUrl: adminConfig.privacyUrl ?? "",
      helpCenterUrl: adminConfig.helpCenterUrl ?? "",
      supportUrl: adminConfig.supportUrl ?? "",
      shareUrl: adminConfig.shareUrl ?? "",
      iosAppStoreId: adminConfig.iosAppStoreId ?? "",
      androidAppId: adminConfig.androidAppId ?? "",
      revenueCatCreditProductIds: formatStringArrayValue(
        adminConfig.revenueCatCreditProductIds,
      ),
    });
    setHasLoadedInitial(true);
  }, [adminConfig, hasLoadedInitial]);

  const resolved = useMemo(() => {
    return {
      termsUrl: publicConfig?.termsUrl ?? "-",
      privacyUrl: publicConfig?.privacyUrl ?? "-",
      helpCenterUrl: publicConfig?.helpCenterUrl ?? "-",
      supportUrl: publicConfig?.supportUrl ?? "-",
      shareUrl: publicConfig?.shareUrl ?? "-",
      revenueCatCreditProductIds:
        publicConfig?.revenueCatCreditProductIds?.join(", ") ?? "-",
    };
  }, [publicConfig]);

  const onChange = (key: keyof ConfigForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildConfigPayload = (nextForm: ConfigForm) => ({
    baseWebUrl: nextForm.baseWebUrl || undefined,
    termsUrl: nextForm.termsUrl || undefined,
    privacyUrl: nextForm.privacyUrl || undefined,
    helpCenterUrl: nextForm.helpCenterUrl || undefined,
    supportUrl: nextForm.supportUrl || undefined,
    shareUrl: nextForm.shareUrl || undefined,
    iosAppStoreId: nextForm.iosAppStoreId || undefined,
    androidAppId: nextForm.androidAppId || undefined,
    revenueCatCreditProductIds: parseStringArrayValue(
      nextForm.revenueCatCreditProductIds,
      "RevenueCat credit product IDs",
    ),
  });

  const onSave = async () => {
    setIsSaving(true);

    try {
      await upsertConfig(buildConfigPayload(form));
      toast.success("App configuration updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update config",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = adminConfig === undefined;

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          title="App Configuration"
          subtitle="Manage reusable runtime URLs and store identifiers without shipping a new client release."
          actions={
            <Button onClick={onSave} disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          }
        />

        {isLoading ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Managed Values</CardTitle>
                <CardDescription>
                  Leave a URL empty to use defaults derived from the base web
                  URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  id="baseWebUrl"
                  label="Base Web URL"
                  value={form.baseWebUrl}
                  onChange={(value) => onChange("baseWebUrl", value)}
                  placeholder="https://your-domain.com"
                />

                <Separator />

                <Field
                  id="termsUrl"
                  label="Terms URL"
                  value={form.termsUrl}
                  onChange={(value) => onChange("termsUrl", value)}
                  placeholder="https://your-domain.com/terms"
                />

                <Field
                  id="privacyUrl"
                  label="Privacy URL"
                  value={form.privacyUrl}
                  onChange={(value) => onChange("privacyUrl", value)}
                  placeholder="https://your-domain.com/privacy"
                />

                <Field
                  id="helpCenterUrl"
                  label="Help Center URL"
                  value={form.helpCenterUrl}
                  onChange={(value) => onChange("helpCenterUrl", value)}
                  placeholder="https://your-domain.com/help"
                />

                <Field
                  id="supportUrl"
                  label="Support URL"
                  value={form.supportUrl}
                  onChange={(value) => onChange("supportUrl", value)}
                  placeholder="https://your-domain.com/support"
                />

                <Field
                  id="shareUrl"
                  label="Share URL"
                  value={form.shareUrl}
                  onChange={(value) => onChange("shareUrl", value)}
                  placeholder="https://your-domain.com"
                />

                <Separator />

                <Field
                  id="iosAppStoreId"
                  label="iOS App Store ID"
                  value={form.iosAppStoreId}
                  onChange={(value) => onChange("iosAppStoreId", value)}
                  placeholder="1234567890"
                />

                <Field
                  id="androidAppId"
                  label="Android App ID"
                  value={form.androidAppId}
                  onChange={(value) => onChange("androidAppId", value)}
                  placeholder="com.example.app"
                />

                <Separator />

                <ArrayField
                  id="revenueCatCreditProductIds"
                  label="RevenueCat Credit Product IDs"
                  value={form.revenueCatCreditProductIds}
                  onChange={(value) =>
                    onChange("revenueCatCreditProductIds", value)
                  }
                  placeholder={`[
  "credits_1000",
  "credits_2500",
  "credits_5000"
]`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolved Runtime Links</CardTitle>
                <CardDescription>
                  These computed values are consumed by account screens and
                  other clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ResolvedRow label="Terms" value={resolved.termsUrl} />
                <ResolvedRow label="Privacy" value={resolved.privacyUrl} />
                <ResolvedRow label="Help" value={resolved.helpCenterUrl} />
                <ResolvedRow label="Support" value={resolved.supportUrl} />
                <ResolvedRow label="Share" value={resolved.shareUrl} />
                <ResolvedRow
                  label="Credit IDs"
                  value={resolved.revenueCatCreditProductIds}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ArrayField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-36 font-mono text-xs sm:text-sm"
      />
    </div>
  );
}

function ResolvedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
      <span className="font-medium">{label}</span>
      <span className="truncate text-muted-foreground">{value}</span>
    </div>
  );
}
