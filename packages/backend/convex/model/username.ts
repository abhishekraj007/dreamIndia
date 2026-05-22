import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type UsernameCtx = { db: MutationCtx["db"] };

type AuthUserForUsername = {
  _id: string;
  name?: string | null;
  email?: string | null;
};

function normalizeUsernameSeed(value: string) {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 22);

  return normalized.length >= 3 ? normalized : "dreamer";
}

function usernameSeedFromAuthUser(authUser: AuthUserForUsername) {
  const emailName = authUser.email?.split("@")[0];
  return normalizeUsernameSeed(authUser.name || emailName || authUser._id);
}

export async function generateUniqueUsername(
  ctx: UsernameCtx,
  seed: string,
  authUserId?: string,
) {
  const base = normalizeUsernameSeed(seed);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base.slice(0, 24 - suffix.length)}${suffix}`;
    const existing = await ctx.db
      .query("profile")
      .withIndex("by_username", (q) => q.eq("username", candidate))
      .unique();

    if (!existing || existing.authUserId === authUserId) {
      return candidate;
    }
  }

  return `${base.slice(0, 15)}-${Date.now().toString(36).slice(-6)}`;
}

export async function ensureProfileUsername(
  ctx: UsernameCtx,
  profile: Doc<"profile">,
  seed: string,
) {
  if (profile.username) {
    return profile.username;
  }

  const username = await generateUniqueUsername(ctx, seed, profile.authUserId);
  await ctx.db.patch(profile._id, { username });
  return username;
}

export async function ensureProfileForAuthUser(
  ctx: UsernameCtx,
  authUser: AuthUserForUsername,
) {
  const existingProfile = await ctx.db
    .query("profile")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
    .unique();

  const seed = usernameSeedFromAuthUser(authUser);
  if (existingProfile) {
    const username = await ensureProfileUsername(ctx, existingProfile, seed);
    return { profile: existingProfile, username };
  }

  const username = await generateUniqueUsername(ctx, seed, authUser._id);
  const profileId = await ctx.db.insert("profile", {
    authUserId: authUser._id,
    credits: 0,
    email: authUser.email || `${authUser._id}@dreamindia.local`,
    isPremium: false,
    name: authUser.name || undefined,
    username,
  });

  return { profileId, username };
}
