import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { authComponent } from "./lib/betterAuth";
import { ensureProfileForAuthUser } from "./model/username";
import { r2 } from "./uploads";

const issueType = v.union(
  v.literal("roads"),
  v.literal("rivers"),
  v.literal("popular-place"),
  v.literal("transit"),
  v.literal("waste"),
  v.literal("drainage"),
);

const severity = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const status = v.union(
  v.literal("submitted"),
  v.literal("ai-ready"),
  v.literal("planning"),
  v.literal("shared"),
);

const nullableString = v.union(v.string(), v.null());

const reportWithUrls = v.object({
  _id: v.id("transformationReports"),
  _creationTime: v.number(),
  creatorId: v.string(),
  creatorName: v.optional(v.string()),
  creatorUsername: v.optional(v.string()),
  title: v.string(),
  issueType,
  severity,
  status,
  locationName: v.string(),
  address: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  description: v.string(),
  planningGoal: v.string(),
  beforeStorageId: v.optional(v.id("_storage")),
  afterStorageId: v.optional(v.id("_storage")),
  beforeR2Key: v.optional(v.string()),
  afterR2Key: v.optional(v.string()),
  googleMapsUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  votes: v.number(),
  aiProposal: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  beforeImageUrl: nullableString,
  afterImageUrl: nullableString,
});

const publicReportWithUrls = v.object({
  _id: v.id("transformationReports"),
  _creationTime: v.number(),
  creatorName: v.optional(v.string()),
  creatorUsername: v.optional(v.string()),
  title: v.string(),
  issueType,
  severity,
  status,
  locationName: v.string(),
  address: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  description: v.string(),
  planningGoal: v.string(),
  beforeStorageId: v.optional(v.id("_storage")),
  afterStorageId: v.optional(v.id("_storage")),
  beforeR2Key: v.optional(v.string()),
  afterR2Key: v.optional(v.string()),
  googleMapsUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  votes: v.number(),
  aiProposal: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  beforeImageUrl: nullableString,
  afterImageUrl: nullableString,
});

const mapReport = v.object({
  _id: v.id("transformationReports"),
  lat: v.number(),
  lng: v.number(),
  issueType,
  severity,
  title: v.string(),
  locationName: v.string(),
  creatorUsername: v.optional(v.string()),
  votes: v.number(),
  beforeImageUrl: nullableString,
  afterImageUrl: nullableString,
});

async function withImageUrls(ctx: QueryCtx, row: Doc<"transformationReports">) {
  const [beforeImageUrl, afterImageUrl, creatorUsername] = await Promise.all([
    resolveImageUrl(ctx, row.beforeStorageId, row.beforeR2Key),
    resolveImageUrl(ctx, row.afterStorageId, row.afterR2Key),
    resolveCreatorUsername(ctx, row),
  ]);

  return {
    ...row,
    creatorUsername,
    beforeImageUrl,
    afterImageUrl,
  };
}

async function resolveCreatorUsername(
  ctx: QueryCtx,
  row: Doc<"transformationReports">,
) {
  if (row.creatorUsername) {
    return row.creatorUsername;
  }

  const profile = await ctx.db
    .query("profile")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", row.creatorId))
    .unique();
  return profile?.username;
}

async function resolveImageUrl(
  ctx: QueryCtx,
  storageId: Doc<"transformationReports">["beforeStorageId"],
  r2Key: string | undefined,
) {
  if (r2Key) {
    try {
      return await r2.getUrl(r2Key);
    } catch (error) {
      console.error(`Failed to create signed R2 URL for ${r2Key}:`, error);
    }
  }

  if (!storageId) {
    return null;
  }

  return await ctx.storage.getUrl(storageId);
}

function toPublicReport(report: Awaited<ReturnType<typeof withImageUrls>>) {
  const { creatorId: _creatorId, ...publicReport } = report;
  return publicReport;
}

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in before uploading a civic report photo.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const createReport = mutation({
  args: {
    title: v.string(),
    issueType,
    severity,
    locationName: v.string(),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    description: v.string(),
    planningGoal: v.string(),
    beforeStorageId: v.optional(v.id("_storage")),
    afterStorageId: v.optional(v.id("_storage")),
    beforeR2Key: v.optional(v.string()),
    afterR2Key: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  returns: v.id("transformationReports"),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in before saving the report to Convex.");
    }

    const { username } = await ensureProfileForAuthUser(ctx, user);
    const now = Date.now();
    const googleMapsUrl =
      args.lat !== undefined && args.lng !== undefined
        ? `https://www.google.com/maps/search/?api=1&query=${args.lat},${args.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(args.locationName)}`;

    const reportId = await ctx.db.insert("transformationReports", {
      ...args,
      creatorId: user._id,
      creatorName: user.name,
      creatorUsername: username,
      status: args.afterStorageId || args.afterR2Key ? "ai-ready" : "submitted",
      googleMapsUrl,
      votes: 1,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("reportVotes", {
      userId: user._id,
      reportId,
      createdAt: now,
    });

    return reportId;
  },
});

export const listReports = query({
  args: {
    issueType: v.optional(issueType),
    limit: v.optional(v.number()),
  },
  returns: v.array(reportWithUrls),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 24, 80);
    const rows = args.issueType
      ? await ctx.db
          .query("transformationReports")
          .withIndex("by_issue", (q) => q.eq("issueType", args.issueType!))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("transformationReports")
          .withIndex("by_created")
          .order("desc")
          .take(limit);

    return await Promise.all(rows.map((row) => withImageUrls(ctx, row)));
  },
});

export const listReportsForMap = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(mapReport),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const rows = await ctx.db
      .query("transformationReports")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    const geocodedRows = rows.filter(
      (row) => row.lat !== undefined && row.lng !== undefined,
    );

    return await Promise.all(
      geocodedRows.map(async (row) => {
        const [beforeImageUrl, afterImageUrl, creatorUsername] =
          await Promise.all([
            resolveImageUrl(ctx, row.beforeStorageId, row.beforeR2Key),
            resolveImageUrl(ctx, row.afterStorageId, row.afterR2Key),
            resolveCreatorUsername(ctx, row),
          ]);

        return {
          _id: row._id,
          lat: row.lat as number,
          lng: row.lng as number,
          issueType: row.issueType,
          severity: row.severity,
          title: row.title,
          locationName: row.locationName,
          creatorUsername,
          votes: row.votes,
          beforeImageUrl,
          afterImageUrl,
        };
      }),
    );
  },
});

export const impactStats = query({
  args: {},
  returns: v.object({
    reports: v.number(),
    aiReady: v.number(),
    planning: v.number(),
    votes: v.number(),
    byIssue: v.record(v.string(), v.number()),
  }),
  handler: async (ctx) => {
    const reports = await ctx.db.query("transformationReports").collect();
    const byIssue = reports.reduce<Record<string, number>>((acc, report) => {
      acc[report.issueType] = (acc[report.issueType] ?? 0) + 1;
      return acc;
    }, {});

    return {
      reports: reports.length,
      aiReady: reports.filter((report) => report.status === "ai-ready").length,
      planning: reports.filter((report) => report.status === "planning").length,
      votes: reports.reduce((sum, report) => sum + report.votes, 0),
      byIssue,
    };
  },
});

export const hasVoted = query({
  args: { id: v.id("transformationReports") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return false;
    }
    const existing = await ctx.db
      .query("reportVotes")
      .withIndex("by_user_and_report", (q) =>
        q.eq("userId", user._id).eq("reportId", args.id),
      )
      .unique();
    return Boolean(existing);
  },
});

export const vote = mutation({
  args: { id: v.id("transformationReports") },
  returns: v.object({
    voted: v.boolean(),
    votes: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in to vote on civic priorities.");
    }

    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new ConvexError("Report not found.");
    }

    const existing = await ctx.db
      .query("reportVotes")
      .withIndex("by_user_and_report", (q) =>
        q.eq("userId", user._id).eq("reportId", args.id),
      )
      .unique();

    if (existing) {
      const nextVotes = Math.max(0, report.votes - 1);
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.id, {
        votes: nextVotes,
        updatedAt: Date.now(),
      });
      return { voted: false, votes: nextVotes };
    }

    const nextVotes = report.votes + 1;
    await ctx.db.insert("reportVotes", {
      userId: user._id,
      reportId: args.id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.id, {
      votes: nextVotes,
      updatedAt: Date.now(),
    });
    return { voted: true, votes: nextVotes };
  },
});

export const listUserReports = query({
  args: {},
  returns: v.array(reportWithUrls),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }
    const rows = await ctx.db
      .query("transformationReports")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(rows.map((row) => withImageUrls(ctx, row)));
  },
});

export const getReport = query({
  args: { id: v.id("transformationReports") },
  returns: v.union(reportWithUrls, v.null()),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) {
      return null;
    }
    return await withImageUrls(ctx, report);
  },
});

export const getPublicReport = query({
  args: { id: v.id("transformationReports") },
  returns: v.union(publicReportWithUrls, v.null()),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) {
      return null;
    }
    return toPublicReport(await withImageUrls(ctx, report));
  },
});

export const saveAiProposal = mutation({
  args: {
    id: v.id("transformationReports"),
    proposal: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in before saving the proposal.");
    }
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new ConvexError("Report not found.");
    }
    if (report.aiProposal && report.creatorId !== user._id) {
      throw new ConvexError(
        "Only the report creator can replace an existing proposal.",
      );
    }
    await ctx.db.patch(args.id, {
      aiProposal: args.proposal,
      status: "planning",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
