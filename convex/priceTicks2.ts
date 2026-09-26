import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { findOrCreateItemPair2 } from "./itemPairs";

export const add = mutation({
  args: {
    itemAId: v.id("items2"),
    itemBId: v.id("items2"),
    price: v.number(),
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
    if (!Number.isFinite(args.price)) {
      throw new ConvexError("Price must be a number");
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
    return await ctx.db.insert("priceTick2", {
      userId,
      itemPairId,
      price: args.price,
      postTime: Date.now(),
    });
  },
});
