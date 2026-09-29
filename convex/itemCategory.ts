import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireAdmin } from "./users";

const gameValidator = v.union(v.literal("poe1"), v.literal("poe2"));

type Game = "poe1" | "poe2";

const gameOrder: Record<Game, number> = { poe1: 0, poe2: 1 };

export async function currencyCategoryId(
  ctx: MutationCtx,
  game: Game,
): Promise<Id<"itemCategory">> {
  const existing = await ctx.db
    .query("itemCategory")
    .withIndex("by_game_and_name", (q) =>
      q.eq("game", game).eq("name", "Currency"),
    )
    .unique();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("itemCategory", { name: "Currency", game });
}

async function assertUniqueName(
  ctx: MutationCtx,
  game: Game,
  name: string,
  exceptId?: Id<"itemCategory">,
) {
  const matches = await ctx.db
    .query("itemCategory")
    .withIndex("by_game_and_name", (q) => q.eq("game", game).eq("name", name))
    .take(1);
  if (matches.some((row) => row._id !== exceptId)) {
    throw new ConvexError("Category name is already used");
  }
}

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("itemCategory"),
      name: v.string(),
      game: gameValidator,
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const rows = await ctx.db.query("itemCategory").take(100);
    return rows
      .map((row) => ({ _id: row._id, name: row.name, game: row.game }))
      .sort((left, right) => {
        const byGame = gameOrder[left.game] - gameOrder[right.game];
        if (byGame !== 0) {
          return byGame;
        }
        return left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
        });
      });
  },
});

export const add = mutation({
  args: { name: v.string(), game: gameValidator },
  returns: v.id("itemCategory"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    await assertUniqueName(ctx, args.game, name);
    return await ctx.db.insert("itemCategory", { name, game: args.game });
  },
});

export const update = mutation({
  args: {
    id: v.id("itemCategory"),
    name: v.string(),
    game: gameValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("itemCategory", args.id);
    if (existing === null) {
      throw new ConvexError("Category not found");
    }
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    await assertUniqueName(ctx, args.game, name, args.id);
    await ctx.db.patch("itemCategory", args.id, { name, game: args.game });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("itemCategory") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("itemCategory", args.id);
    if (existing === null) {
      throw new ConvexError("Category not found");
    }
    const usedByPoe1 = await ctx.db
      .query("items1")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .take(1);
    const usedByPoe2 = await ctx.db
      .query("items2")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .take(1);
    if (usedByPoe1.length > 0 || usedByPoe2.length > 0) {
      throw new ConvexError("Category is used by items");
    }
    await ctx.db.delete("itemCategory", args.id);
    return null;
  },
});
