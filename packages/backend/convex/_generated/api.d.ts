/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analysis from "../analysis.js";
import type * as auth from "../auth.js";
import type * as civicConsultant from "../civicConsultant.js";
import type * as englishTutor from "../englishTutor.js";
import type * as features_appConfig_guards from "../features/appConfig/guards.js";
import type * as features_appConfig_index from "../features/appConfig/index.js";
import type * as features_appConfig_mutations from "../features/appConfig/mutations.js";
import type * as features_appConfig_queries from "../features/appConfig/queries.js";
import type * as features_appConfig_shared from "../features/appConfig/shared.js";
import type * as features_credits_index from "../features/credits/index.js";
import type * as features_credits_mutations from "../features/credits/mutations.js";
import type * as features_credits_queries from "../features/credits/queries.js";
import type * as features_premium_admin from "../features/premium/admin.js";
import type * as features_premium_guards from "../features/premium/guards.js";
import type * as features_premium_index from "../features/premium/index.js";
import type * as features_premium_mutations from "../features/premium/mutations.js";
import type * as features_premium_queries from "../features/premium/queries.js";
import type * as features_subscriptions_actions from "../features/subscriptions/actions.js";
import type * as features_subscriptions_index from "../features/subscriptions/index.js";
import type * as features_subscriptions_mutations from "../features/subscriptions/mutations.js";
import type * as features_subscriptions_queries from "../features/subscriptions/queries.js";
import type * as geo from "../geo.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_betterAuth_component from "../lib/betterAuth/component.js";
import type * as lib_betterAuth_createAuth from "../lib/betterAuth/createAuth.js";
import type * as lib_betterAuth_index from "../lib/betterAuth/index.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_revenuecatWebhooks from "../lib/revenuecatWebhooks.js";
import type * as lib_uploadValidation from "../lib/uploadValidation.js";
import type * as migrations_addCreditsToProfiles from "../migrations/addCreditsToProfiles.js";
import type * as model_user from "../model/user.js";
import type * as model_username from "../model/username.js";
import type * as privateData from "../privateData.js";
import type * as purchases from "../purchases.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as reports from "../reports.js";
import type * as todos from "../todos.js";
import type * as transform from "../transform.js";
import type * as transformAccess from "../transformAccess.js";
import type * as uploads from "../uploads.js";
import type * as user from "../user.js";
import type * as util from "../util.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analysis: typeof analysis;
  auth: typeof auth;
  civicConsultant: typeof civicConsultant;
  englishTutor: typeof englishTutor;
  "features/appConfig/guards": typeof features_appConfig_guards;
  "features/appConfig/index": typeof features_appConfig_index;
  "features/appConfig/mutations": typeof features_appConfig_mutations;
  "features/appConfig/queries": typeof features_appConfig_queries;
  "features/appConfig/shared": typeof features_appConfig_shared;
  "features/credits/index": typeof features_credits_index;
  "features/credits/mutations": typeof features_credits_mutations;
  "features/credits/queries": typeof features_credits_queries;
  "features/premium/admin": typeof features_premium_admin;
  "features/premium/guards": typeof features_premium_guards;
  "features/premium/index": typeof features_premium_index;
  "features/premium/mutations": typeof features_premium_mutations;
  "features/premium/queries": typeof features_premium_queries;
  "features/subscriptions/actions": typeof features_subscriptions_actions;
  "features/subscriptions/index": typeof features_subscriptions_index;
  "features/subscriptions/mutations": typeof features_subscriptions_mutations;
  "features/subscriptions/queries": typeof features_subscriptions_queries;
  geo: typeof geo;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/betterAuth/component": typeof lib_betterAuth_component;
  "lib/betterAuth/createAuth": typeof lib_betterAuth_createAuth;
  "lib/betterAuth/index": typeof lib_betterAuth_index;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/revenuecatWebhooks": typeof lib_revenuecatWebhooks;
  "lib/uploadValidation": typeof lib_uploadValidation;
  "migrations/addCreditsToProfiles": typeof migrations_addCreditsToProfiles;
  "model/user": typeof model_user;
  "model/username": typeof model_username;
  privateData: typeof privateData;
  purchases: typeof purchases;
  pushNotifications: typeof pushNotifications;
  reports: typeof reports;
  todos: typeof todos;
  transform: typeof transform;
  transformAccess: typeof transformAccess;
  uploads: typeof uploads;
  user: typeof user;
  util: typeof util;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  polar: import("@convex-dev/polar/_generated/component.js").ComponentApi<"polar">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  pushNotifications: import("@convex-dev/expo-push-notifications/_generated/component.js").ComponentApi<"pushNotifications">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
