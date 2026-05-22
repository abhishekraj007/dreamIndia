import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getTransformUserAccess = internalQuery({
  args: {
    authUserId: v.string(),
  },
  returns: v.object({
    isPremium: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.authUserId))
      .unique();
    return { isPremium: profile?.isPremium === true };
  },
});
