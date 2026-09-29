import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findOrCreateItemPair2 } from "./itemPairs";
import { simplifyAmounts } from "./priceAmounts";

const PAIRS_PER_FAVORITE = 50;

export const add = mutation({
  args: {
    itemAId: v.id("items2"),
    itemBId: v.id("items2"),
    gameLeagueId: v.id("gameLeague"),
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
    if (args.itemAId === args.itemBId) {
      throw new ConvexError("Choose two different items");
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
    const league = await ctx.db.get("gameLeague", args.gameLeagueId);
    if (league === null || league.game !== "poe2") {
      throw new ConvexError("League not found");
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
      gameLeagueId: args.gameLeagueId,
      amountA: amounts.amountA,
      amountB: amounts.amountB,
      postTime: Date.now(),
    });
  },
});

export const latestWithFavorites = query({
  args: {
    gameLeagueId: v.id("gameLeague"),
  },
  returns: v.array(
    v.object({
      itemAId: v.id("items2"),
      itemBId: v.id("items2"),
      amountA: v.number(),
      amountB: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
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
    const league = await ctx.db.get("gameLeague", args.gameLeagueId);
    if (league === null || league.game !== "poe2") {
      return [];
    }

    const seenPairIds = new Set<string>();
    const quotes = [];
    for (const favoriteId of favorites) {
      const pairsAsA = await ctx.db
        .query("itemPairs2")
        .withIndex("by_itemAId_and_itemBId", (q) => q.eq("itemAId", favoriteId))
        .take(PAIRS_PER_FAVORITE);
      const pairsAsB = await ctx.db
        .query("itemPairs2")
        .withIndex("by_itemBId_and_itemAId", (q) => q.eq("itemBId", favoriteId))
        .take(PAIRS_PER_FAVORITE);
      for (const pair of pairsAsA.concat(pairsAsB)) {
        if (seenPairIds.has(pair._id)) {
          continue;
        }
        seenPairIds.add(pair._id);
        const latest = await ctx.db
          .query("priceTick2")
          .withIndex("by_itemPairId_and_gameLeagueId_and_postTime", (q) =>
            q.eq("itemPairId", pair._id).eq("gameLeagueId", args.gameLeagueId),
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
    }
    return quotes;
  },
});
