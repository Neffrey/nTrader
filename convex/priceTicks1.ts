import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { findOrCreateItemPair1 } from "./itemPairs";
import { simplifyAmounts } from "./priceAmounts";

const PAIRS_PER_FAVORITE = 50;

const historicTick = v.object({
  itemAId: v.id("items1"),
  itemBId: v.id("items1"),
  amountA: v.number(),
  amountB: v.number(),
  postTime: v.number(),
});

/**
 * Bulk-insert historic PoE1 price ticks (e.g. past-league CSV import).
 * Skips rows where the pair+league+postTime tick already exists.
 */
export const importHistoricBatch = internalMutation({
  args: {
    userId: v.id("users"),
    gameLeagueId: v.id("gameLeague"),
    ticks: v.array(historicTick),
  },
  returns: v.object({
    written: v.number(),
    skippedExisting: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (user === null || user.role === "banned") {
      throw new ConvexError("Import user not authorized");
    }
    const league = await ctx.db.get("gameLeague", args.gameLeagueId);
    if (league === null || league.game !== "poe1") {
      throw new ConvexError("League not found");
    }

    let written = 0;
    let skippedExisting = 0;
    for (const tick of args.ticks) {
      if (tick.itemAId === tick.itemBId) {
        continue;
      }
      if (!Number.isFinite(tick.amountA) || tick.amountA <= 0) {
        continue;
      }
      if (!Number.isFinite(tick.amountB) || tick.amountB <= 0) {
        continue;
      }
      const itemA = await ctx.db.get("items1", tick.itemAId);
      const itemB = await ctx.db.get("items1", tick.itemBId);
      if (itemA === null || itemB === null) {
        continue;
      }
      const itemPairId = await findOrCreateItemPair1(
        ctx,
        tick.itemAId,
        tick.itemBId,
      );
      const existing = await ctx.db
        .query("priceTick1")
        .withIndex("by_itemPairId_and_gameLeagueId_and_postTime", (q) =>
          q
            .eq("itemPairId", itemPairId)
            .eq("gameLeagueId", args.gameLeagueId)
            .eq("postTime", tick.postTime),
        )
        .take(1);
      if (existing.length > 0) {
        skippedExisting += 1;
        continue;
      }
      const amounts = simplifyAmounts(tick.amountA, tick.amountB);
      await ctx.db.insert("priceTick1", {
        userId: args.userId,
        itemPairId,
        gameLeagueId: args.gameLeagueId,
        amountA: amounts.amountA,
        amountB: amounts.amountB,
        postTime: tick.postTime,
      });
      written += 1;
    }
    return { written, skippedExisting };
  },
});

export const add = mutation({
  args: {
    itemAId: v.id("items1"),
    itemBId: v.id("items1"),
    gameLeagueId: v.id("gameLeague"),
    amountA: v.number(),
    amountB: v.number(),
  },
  returns: v.id("priceTick1"),
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
    const itemA = await ctx.db.get("items1", args.itemAId);
    const itemB = await ctx.db.get("items1", args.itemBId);
    if (itemA === null || itemB === null) {
      throw new ConvexError("Item not found");
    }
    const league = await ctx.db.get("gameLeague", args.gameLeagueId);
    if (league === null || league.game !== "poe1") {
      throw new ConvexError("League not found");
    }
    const itemPairId = await findOrCreateItemPair1(
      ctx,
      args.itemAId,
      args.itemBId,
    );
    const amounts = simplifyAmounts(args.amountA, args.amountB);
    return await ctx.db.insert("priceTick1", {
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
      itemAId: v.id("items1"),
      itemBId: v.id("items1"),
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
    const favorites = user.poe1Favorites ?? [];
    if (favorites.length === 0) {
      return [];
    }
    const league = await ctx.db.get("gameLeague", args.gameLeagueId);
    if (league === null || league.game !== "poe1") {
      return [];
    }

    const seenPairIds = new Set<string>();
    const quotes = [];
    for (const favoriteId of favorites) {
      const pairsAsA = await ctx.db
        .query("itemPairs1")
        .withIndex("by_itemAId_and_itemBId", (q) => q.eq("itemAId", favoriteId))
        .take(PAIRS_PER_FAVORITE);
      const pairsAsB = await ctx.db
        .query("itemPairs1")
        .withIndex("by_itemBId_and_itemAId", (q) => q.eq("itemBId", favoriteId))
        .take(PAIRS_PER_FAVORITE);
      for (const pair of pairsAsA.concat(pairsAsB)) {
        if (seenPairIds.has(pair._id)) {
          continue;
        }
        seenPairIds.add(pair._id);
        const latest = await ctx.db
          .query("priceTick1")
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

const HISTORY_LIMIT = 500;

async function findItemByName(ctx: QueryCtx, name: string) {
  const rows = await ctx.db
    .query("items1")
    .withIndex("by_name", (q) => q.eq("name", name))
    .take(1);
  return rows[0] ?? null;
}

/**
 * Historic ticks for one item vs a quote currency (Chaos Orb, or Divine when
 * the subject is Chaos). Value is quote-per-1-subject.
 */
export const historyForItem = query({
  args: {
    itemId: v.id("items1"),
    gameLeagueId: v.id("gameLeague"),
    quoteItemId: v.optional(v.id("items1")),
  },
  returns: v.union(
    v.null(),
    v.object({
      item: v.object({
        _id: v.id("items1"),
        name: v.string(),
        image: v.union(v.string(), v.null()),
      }),
      quote: v.object({
        _id: v.id("items1"),
        name: v.string(),
        image: v.union(v.string(), v.null()),
      }),
      points: v.array(
        v.object({
          postTime: v.number(),
          value: v.number(),
          amountSubject: v.number(),
          amountQuote: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const league = await ctx.db.get("gameLeague", args.gameLeagueId);
    if (league === null || league.game !== "poe1") {
      return null;
    }
    const item = await ctx.db.get("items1", args.itemId);
    if (item === null) {
      return null;
    }

    let quote =
      args.quoteItemId !== undefined
        ? await ctx.db.get("items1", args.quoteItemId)
        : null;
    if (quote === null) {
      const preferredName =
        item.name === "Chaos Orb" ? "Divine Orb" : "Chaos Orb";
      quote = await findItemByName(ctx, preferredName);
    }
    if (quote === null || quote._id === item._id) {
      return null;
    }

    const quoteItem = quote;
    const pairAsA = await ctx.db
      .query("itemPairs1")
      .withIndex("by_itemAId_and_itemBId", (q) =>
        q.eq("itemAId", item._id).eq("itemBId", quoteItem._id),
      )
      .unique();
    const pairAsB =
      pairAsA === null
        ? await ctx.db
            .query("itemPairs1")
            .withIndex("by_itemAId_and_itemBId", (q) =>
              q.eq("itemAId", quoteItem._id).eq("itemBId", item._id),
            )
            .unique()
        : null;
    const pair = pairAsA ?? pairAsB;
    if (pair === null) {
      return {
        item: {
          _id: item._id,
          name: item.name,
          image: item.image ?? null,
        },
        quote: {
          _id: quoteItem._id,
          name: quoteItem.name,
          image: quoteItem.image ?? null,
        },
        points: [],
      };
    }

    const ticks = await ctx.db
      .query("priceTick1")
      .withIndex("by_itemPairId_and_gameLeagueId_and_postTime", (q) =>
        q.eq("itemPairId", pair._id).eq("gameLeagueId", args.gameLeagueId),
      )
      .order("asc")
      .take(HISTORY_LIMIT);

    const subjectIsA = pair.itemAId === item._id;
    const points = ticks.flatMap((tick) => {
      const amountSubject = subjectIsA ? tick.amountA : tick.amountB;
      const amountQuote = subjectIsA ? tick.amountB : tick.amountA;
      if (amountSubject <= 0 || amountQuote <= 0) {
        return [];
      }
      return [
        {
          postTime: tick.postTime,
          value: amountQuote / amountSubject,
          amountSubject,
          amountQuote,
        },
      ];
    });

    return {
      item: {
        _id: item._id,
        name: item.name,
        image: item.image ?? null,
      },
      quote: {
        _id: quoteItem._id,
        name: quoteItem.name,
        image: quoteItem.image ?? null,
      },
      points,
    };
  },
});
