import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { findOrCreateItemPair1 } from "./itemPairs";

export const add = mutation({
  args: {
    itemAId: v.id("items1"),
    itemBId: v.id("items1"),
    price: v.number(),
    reversePrice: v.number(),
  },
  returns: v.object({
    priceTickId: v.id("priceTick1"),
    reversePriceTickId: v.id("priceTick1"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const user = await ctx.db.get("users", userId);
    if (user === null || user.role === "banned") {
      throw new ConvexError("Not authorized");
    }
    if (!Number.isFinite(args.price) || !Number.isFinite(args.reversePrice)) {
      throw new ConvexError("Price must be a number");
    }
    const itemA = await ctx.db.get("items1", args.itemAId);
    const itemB = await ctx.db.get("items1", args.itemBId);
    if (itemA === null || itemB === null) {
      throw new ConvexError("Item not found");
    }
    const postTime = Date.now();
    const itemPairId = await findOrCreateItemPair1(
      ctx,
      args.itemAId,
      args.itemBId,
    );
    const reversePairId = await findOrCreateItemPair1(
      ctx,
      args.itemBId,
      args.itemAId,
    );
    const priceTickId = await ctx.db.insert("priceTick1", {
      userId,
      itemPairId,
      price: args.price,
      postTime,
    });
    const reversePriceTickId = await ctx.db.insert("priceTick1", {
      userId,
      itemPairId: reversePairId,
      price: args.reversePrice,
      postTime,
    });
    return { priceTickId, reversePriceTickId };
  },
});
