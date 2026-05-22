import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/user";
import { ensureProfileForAuthUser } from "./model/username";

export const fetchUserAndProfile = query({
	handler: async (ctx) => {
		return await Users.getUserAndProfile(ctx);
	},
});

export const ensureUsername = mutation({
	args: {},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx) => {
		const user = await Users.safeGetUser(ctx);
		if (!user) {
			return null;
		}

		const result = await ensureProfileForAuthUser(ctx, user);
		return result.username;
	},
});
