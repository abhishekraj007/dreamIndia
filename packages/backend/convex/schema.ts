import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profile: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    authUserId: v.string(),
    credits: v.optional(v.number()),
    // Admin status - can only be set manually in database
    isAdmin: v.optional(v.boolean()),
    // Premium status - can be granted manually or via subscription
    isPremium: v.optional(v.boolean()),
    premiumGrantedBy: v.optional(
      v.union(
        v.literal("manual"), // Admin granted
        v.literal("subscription"), // From active subscription
        v.literal("lifetime"), // Lifetime access
      ),
    ),
    premiumGrantedAt: v.optional(v.number()),
    premiumExpiresAt: v.optional(v.number()), // null = lifetime/subscription-based
    // Active thread for English tutor (syncs across devices)
    activeTutorThreadId: v.optional(v.string()),
    // Storage quota tracking (enforced in upload metadata sync)
    storageBytesUsed: v.optional(v.number()),
    uploadCount: v.optional(v.number()),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_email", ["email"]),

  // Unified subscriptions table for both Polar (web) and RevenueCat (native)
  // Single source of truth for all subscription and premium status data
  subscriptions: defineTable({
    userId: v.string(), // Better Auth user ID (stored as string)
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),

    // Customer and subscription identifiers (required for tracking)
    platformCustomerId: v.string(), // Polar/RevenueCat customer ID
    platformSubscriptionId: v.string(), // Polar/RevenueCat subscription ID
    platformProductId: v.string(), // Product ID from platform

    // Subscription details
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("past_due"),
      v.literal("trialing"),
    ),
    productType: v.optional(v.string()), // e.g., "monthly", "yearly" - derived from webhook

    // Customer info (denormalized for convenience)
    customerEmail: v.string(),
    customerName: v.optional(v.string()),

    // Dates
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_user_status", ["userId", "status"])
    .index("by_platform_subscription_id", ["platformSubscriptionId"])
    // Composite index for guaranteed uniqueness across platforms
    .index("by_platform_and_subscription", [
      "platform",
      "platformSubscriptionId",
    ]),

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),

  // Orders table for tracking one-time purchases (credit purchases)
  orders: defineTable({
    userId: v.string(), // Better Auth user ID (stored as string)
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    platformOrderId: v.string(), // Unique order ID from platform
    platformProductId: v.string(), // Product ID that was purchased
    amount: v.number(), // Credit amount purchased
    status: v.union(
      v.literal("paid"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    createdAt: v.number(),
  })
    .index("by_platform_order_id", ["platformOrderId"])
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"]),

  // Uploads table for tracking R2 uploads
  uploads: defineTable({
    key: v.string(), // R2 object key
    userId: v.string(), // Better Auth user ID
    contentType: v.string(),
    contentLength: v.number(),
    uploadedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_key", ["key"]),

  transformationReports: defineTable({
    creatorId: v.string(),
    creatorName: v.optional(v.string()),
    title: v.string(),
    issueType: v.union(
      v.literal("roads"),
      v.literal("rivers"),
      v.literal("popular-place"),
      v.literal("transit"),
      v.literal("waste"),
      v.literal("drainage"),
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    status: v.union(
      v.literal("submitted"),
      v.literal("ai-ready"),
      v.literal("planning"),
      v.literal("shared"),
    ),
    locationName: v.string(),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    description: v.string(),
    planningGoal: v.string(),
    beforeStorageId: v.optional(v.id("_storage")),
    afterStorageId: v.optional(v.id("_storage")),
    googleMapsUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    votes: v.number(),
    aiProposal: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_issue", ["issueType"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Runtime app configuration shared by web, admin, and native clients.
  appConfig: defineTable({
    key: v.string(),
    baseWebUrl: v.optional(v.string()),
    termsUrl: v.optional(v.string()),
    privacyUrl: v.optional(v.string()),
    helpCenterUrl: v.optional(v.string()),
    supportUrl: v.optional(v.string()),
    shareUrl: v.optional(v.string()),
    iosAppStoreId: v.optional(v.string()),
    androidAppId: v.optional(v.string()),
    revenueCatCreditProductIds: v.optional(v.array(v.string())),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_key", ["key"]),
});
