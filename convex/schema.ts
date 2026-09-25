import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    poeAccessToken: v.optional(v.string()),
    poeRefreshToken: v.optional(v.string()),
    poeTokenExpiresAt: v.optional(v.number()),
    poeScope: v.optional(v.string()),
    poeUsername: v.optional(v.string()),
    poeSub: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
    items1: defineTable({
      name: v.string(),
      image: v.optional(v.string()),
      internalId: v.string(),
    })
      .index("by_name", ["name"])
      .index("by_internalId", ["internalId"]),
    items2: defineTable({
      name: v.string(),
      image: v.string(),
      internalId: v.string(),
    })
      .index("by_name", ["name"])
      .index("by_internalId", ["internalId"]),
    itemPairs1: defineTable({
      itemAId: v.id("items1"),
      itemBId: v.id("items1"),
    }),
    priceTick1: defineTable({
      userId: v.id("users"),
      itemPairId: v.id("itemPairs1"),
      price: v.number(),
      postTime: v.number(),
    })
      .index("by_itemPairId", ["itemPairId"])
      .index("by_time", ["postTime"]),
    itemPairs2: defineTable({
      itemAId: v.id("items2"),
      itemBId: v.id("items2"),
    }),
    priceTick2: defineTable({
      userId: v.id("users"),
      itemPairId: v.id("itemPairs2"),
      price: v.number(),
      postTime: v.number(),
    })
      .index("by_itemPairId", ["itemPairId"])
      .index("by_time", ["postTime"]),
});
