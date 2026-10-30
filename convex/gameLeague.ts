import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./users";

const gameValidator = v.union(v.literal("poe1"), v.literal("poe2"));

async function assertUniqueInternalId(
  ctx: MutationCtx,
  internalId: string,
  exceptId?: Id<"gameLeague">,
) {
  const matches = await ctx.db
    .query("gameLeague")
    .withIndex("by_internalId", (q) => q.eq("internalId", internalId))
    .take(2);
  if (matches.some((row) => row._id !== exceptId)) {
    throw new ConvexError("Internal id is already used");
  }
}

async function leagueIsInUse(ctx: MutationCtx, id: Id<"gameLeague">) {
  const usedInTicks1 = await ctx.db
    .query("priceTick1")
    .filter((q) => q.eq(q.field("gameLeagueId"), id))
    .take(1);
  if (usedInTicks1.length > 0) {
    return true;
  }
  const usedInTicks2 = await ctx.db
    .query("priceTick2")
    .filter((q) => q.eq(q.field("gameLeagueId"), id))
    .take(1);
  return usedInTicks2.length > 0;
}

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("gameLeague"),
      name: v.string(),
      internalId: v.string(),
      game: gameValidator,
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const rows = await ctx.db.query("gameLeague").take(100);
    return rows
      .map((row) => ({
        _id: row._id,
        name: row.name,
        internalId: row.internalId,
        game: row.game,
      }))
      .sort((left, right) => {
        const byGame = left.game.localeCompare(right.game);
        if (byGame !== 0) {
          return byGame;
        }
        return left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
        });
      });
  },
});

export const listByGame = query({
  args: {
    game: gameValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("gameLeague"),
      _creationTime: v.number(),
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
      .map((row) => ({
        _id: row._id,
        _creationTime: row._creationTime,
        name: row.name,
      }))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      );
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    internalId: v.string(),
    game: gameValidator,
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

/** Idempotent league upsert for destin→prod sync scripts. */
export const ensure = internalMutation({
  args: {
    name: v.string(),
    internalId: v.string(),
    game: gameValidator,
  },
  returns: v.id("gameLeague"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const internalId = args.internalId.trim();
    if (name.length === 0 || internalId.length === 0) {
      throw new ConvexError("Name and internal id are required");
    }
    const byInternal = await ctx.db
      .query("gameLeague")
      .withIndex("by_internalId", (q) => q.eq("internalId", internalId))
      .take(1);
    const existing = byInternal[0];
    if (existing !== undefined) {
      if (existing.name !== name || existing.game !== args.game) {
        await ctx.db.patch("gameLeague", existing._id, {
          name,
          game: args.game,
        });
      }
      return existing._id;
    }
    return await ctx.db.insert("gameLeague", {
      name,
      internalId,
      game: args.game,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("gameLeague"),
    name: v.string(),
    internalId: v.string(),
    game: gameValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("gameLeague", args.id);
    if (existing === null) {
      throw new ConvexError("League not found");
    }
    const name = args.name.trim();
    const internalId = args.internalId.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (internalId.length === 0) {
      throw new ConvexError("Internal id cannot be empty");
    }
    await assertUniqueInternalId(ctx, internalId, args.id);
    await ctx.db.patch("gameLeague", args.id, {
      name,
      internalId,
      game: args.game,
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("gameLeague") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("gameLeague", args.id);
    if (existing === null) {
      throw new ConvexError("League not found");
    }
    if (await leagueIsInUse(ctx, args.id)) {
      throw new ConvexError("League is used by price ticks");
    }
    await ctx.db.delete("gameLeague", args.id);
    return null;
  },
});
