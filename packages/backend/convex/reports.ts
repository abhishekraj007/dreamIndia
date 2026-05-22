import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./lib/betterAuth";

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

export const generateUploadUrl = mutation({
  args: {},
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
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in before saving the report to Convex.");
    }

    const now = Date.now();
    const googleMapsUrl =
      args.lat !== undefined && args.lng !== undefined
        ? `https://www.google.com/maps/search/?api=1&query=${args.lat},${args.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(args.locationName)}`;

    return await ctx.db.insert("transformationReports", {
      ...args,
      creatorId: user._id,
      creatorName: user.name,
      status: args.afterStorageId ? "ai-ready" : "submitted",
      googleMapsUrl,
      votes: 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listReports = query({
  args: {
    issueType: v.optional(issueType),
    limit: v.optional(v.number()),
  },
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

    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        beforeImageUrl: row.beforeStorageId
          ? await ctx.storage.getUrl(row.beforeStorageId)
          : null,
        afterImageUrl: row.afterStorageId
          ? await ctx.storage.getUrl(row.afterStorageId)
          : null,
      })),
    );
  },
});

export const impactStats = query({
  args: {},
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

export const vote = mutation({
  args: { id: v.id("transformationReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new ConvexError("Report not found.");
    }
    await ctx.db.patch(args.id, {
      votes: report.votes + 1,
      updatedAt: Date.now(),
    });
  },
});

export const listUserReports = query({
  args: {},
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

    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        beforeImageUrl: row.beforeStorageId
          ? await ctx.storage.getUrl(row.beforeStorageId)
          : null,
        afterImageUrl: row.afterStorageId
          ? await ctx.storage.getUrl(row.afterStorageId)
          : null,
      })),
    );
  },
});

export const getReport = query({
  args: { id: v.id("transformationReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) {
      return null;
    }
    return {
      ...report,
      beforeImageUrl: report.beforeStorageId
        ? await ctx.storage.getUrl(report.beforeStorageId)
        : null,
      afterImageUrl: report.afterStorageId
        ? await ctx.storage.getUrl(report.afterStorageId)
        : null,
    };
  },
});

export const saveAiProposal = mutation({
  args: {
    id: v.id("transformationReports"),
    proposal: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in before saving the proposal.");
    }
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new ConvexError("Report not found.");
    }
    if (report.creatorId !== user._id) {
      throw new ConvexError("You do not have permission to modify this report.");
    }
    await ctx.db.patch(args.id, {
      aiProposal: args.proposal,
      status: "planning",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
