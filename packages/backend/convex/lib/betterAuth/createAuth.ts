import { type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import type { DataModel } from "../../_generated/dataModel";
import { betterAuth } from "better-auth";
import { authComponent } from "./component";

const siteUrl = process.env.SITE_URL || "http://localhost:3004";
const authBaseUrl = process.env.CONVEX_SITE_URL ?? siteUrl;
const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const trustedOrigins = Array.from(
  new Set([
    siteUrl,
    authBaseUrl,
    "http://localhost:3004",
    "http://127.0.0.1:3004",
    "https://expert-bird-512.convex.site",
    ...extraTrustedOrigins,
  ]),
);

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false },
) {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: authBaseUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // crossDomain plugin enables multi-app OAuth by skipping state cookie check
    plugins: [convex(), crossDomain({ siteUrl })],
  });
}
