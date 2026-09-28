import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { findOrCreateItemPair2 } from "./itemPairs";
import { simplifyAmounts } from "./priceAmounts";

export const add = mutation({
  args: {
    itemAId: v.id("items2"),
    itemBId: v.id("items2"),
    amountA: v.number(),
    amountB: v.number(),
  },
  returns: v.id("priceTick2"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const user = await ctx.db.get("users", userId);
    if (user === null || user.role === "banned") {
      throw new ConvexError("Not authorized");
    }
    if (!Number.isFinite(args.amountA) || args.amountA <= 0) {
      throw new ConvexError("Item A amount must be greater than zero");
    }
    if (!Number.isFinite(args.amountB) || args.amountB <= 0) {
      throw new ConvexError("Item B amount must be greater than zero");
    }
    const itemA = await ctx.db.get("items2", args.itemAId);
    const itemB = await ctx.db.get("items2", args.itemBId);
    if (itemA === null || itemB === null) {
      throw new ConvexError("Item not found");
    }
    const itemPairId = await findOrCreateItemPair2(
      ctx,
      args.itemAId,
      args.itemBId,
    );
    const amounts = simplifyAmounts(args.amountA, args.amountB);
    return await ctx.db.insert("priceTick2", {
      userId,
      itemPairId,
      amountA: amounts.amountA,
      amountB: amounts.amountB,
      postTime: Date.now(),
    });
  },
});

export const latestWithFavorites = query({
  args: {},
  returns: v.array(
    v.object({
      itemAId: v.id("items2"),
      itemBId: v.id("items2"),
      amountA: v.number(),
      amountB: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const user = await ctx.db.get("users", userId);
    if (user === null) {
      return [];
    }
    const favorites = user.poe2Favorites ?? [];
    if (favorites.length === 0) {
      return [];
    }

    const pairs = new Map<
      Id<"itemPairs2">,
      { itemAId: Id<"items2">; itemBId: Id<"items2"> }
    >();
    for (const favoriteId of favorites) {
      const asItemA = await ctx.db
        .query("itemPairs2")
        .withIndex("by_itemAId_and_itemBId", (q) => q.eq("itemAId", favoriteId))
        .collect();
      const asItemB = await ctx.db
        .query("itemPairs2")
        .withIndex("by_itemBId_and_itemAId", (q) => q.eq("itemBId", favoriteId))
        .collect();
      for (const pair of [...asItemA, ...asItemB]) {
        pairs.set(pair._id, { itemAId: pair.itemAId, itemBId: pair.itemBId });
      }
    }

    const quotes = [];
    for (const [pairId, pair] of pairs) {
      if (pair.itemAId === pair.itemBId) {
        continue;
      }
      const latest = await ctx.db
        .query("priceTick2")
        .withIndex("by_itemPairId_and_postTime", (q) =>
          q.eq("itemPairId", pairId),
        )
        .order("desc")
        .take(1);
      const tick = latest[0];
      if (tick === undefined) {
        continue;
      }
      quotes.push({
        itemAId: pair.itemAId,
        itemBId: pair.itemBId,
        amountA: tick.amountA,
        amountB: tick.amountB,
      });
    }
    return quotes;
  },
});
