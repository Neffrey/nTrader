import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireAdmin } from "./users";

async function assertUniqueInternalId(ctx: MutationCtx, internalId: string) {
  const matches = await ctx.db
    .query("gameLeague")
    .withIndex("by_internalId", (q) => q.eq("internalId", internalId))
    .take(1);
  if (matches.length > 0) {
    throw new ConvexError("Internal id is already used");
  }
}

export const listByGame = query({
  args: {
    game: v.union(v.literal("poe1"), v.literal("poe2")),
  },
  returns: v.array(
    v.object({
      _id: v.id("gameLeague"),
      name: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const rows = await ctx.db
      .query("gameLeague")
      .withIndex("by_game", (q) => q.eq("game", args.game))
      .take(100);
    return rows
      .map((row) => ({ _id: row._id, name: row.name }))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      );
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    internalId: v.string(),
    game: v.union(v.literal("poe1"), v.literal("poe2")),
  },
  returns: v.id("gameLeague"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    const internalId = args.internalId.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (internalId.length === 0) {
      throw new ConvexError("Internal id cannot be empty");
    }
    await assertUniqueInternalId(ctx, internalId);
    return await ctx.db.insert("gameLeague", {
      name,
      internalId,
      game: args.game,
    });
  },
});
