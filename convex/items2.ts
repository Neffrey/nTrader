import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./users";

const ITEM_LIST_LIMIT = 2000;
const TICK_DELETE_BATCH = 50;

async function assertUniqueInternalId(
  ctx: MutationCtx,
  internalId: string,
  exceptId?: Id<"items2">,
) {
  const matches = await ctx.db
    .query("items2")
    .withIndex("by_internalId", (q) => q.eq("internalId", internalId))
    .take(2);
  if (matches.some((row) => row._id !== exceptId)) {
    throw new ConvexError("Internal id is already used");
  }
}

const item = v.object({
  _id: v.id("items2"),
  name: v.string(),
  image: v.string(),
  internalId: v.string(),
});

export const list = query({
  args: {},
  returns: v.object({
    items: v.array(item),
    truncated: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { items: [], truncated: false };
    }
    const rows = await ctx.db
      .query("items2")
      .withIndex("by_name")
      .take(ITEM_LIST_LIMIT + 1);
    const truncated = rows.length > ITEM_LIST_LIMIT;
    const items = truncated ? rows.slice(0, ITEM_LIST_LIMIT) : rows;
    return {
      truncated,
      items: items.map((row) => ({
        _id: row._id,
        name: row.name,
        image: row.image,
        internalId: row.internalId,
      })),
    };
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    image: v.string(),
    internalId: v.string(),
  },
  returns: v.id("items2"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    const image = args.image.trim();
    const internalId = args.internalId.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (internalId.length === 0) {
      throw new ConvexError("Internal id cannot be empty");
    }
    if (!image.startsWith("https://") && !image.startsWith("http://")) {
      throw new ConvexError("Image must be an http or https URL");
    }
    await assertUniqueInternalId(ctx, internalId);
    return await ctx.db.insert("items2", {
      name,
      image,
      internalId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("items2"),
    name: v.string(),
    image: v.string(),
    internalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("items2", args.id);
    if (existing === null) {
      throw new ConvexError("Item not found");
    }
    const name = args.name.trim();
    const image = args.image.trim();
    const internalId = args.internalId.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (internalId.length === 0) {
      throw new ConvexError("Internal id cannot be empty");
    }
    if (!image.startsWith("https://") && !image.startsWith("http://")) {
      throw new ConvexError("Image must be an http or https URL");
    }
    await assertUniqueInternalId(ctx, internalId, args.id);
    await ctx.db.replace("items2", args.id, {
      name,
      image,
      internalId,
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("items2") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("items2", args.id);
    if (existing === null) {
      throw new ConvexError("Item not found");
    }
    await ctx.db.delete("items2", args.id);
    await ctx.scheduler.runAfter(0, internal.items2.cleanupRemovedItem, {
      itemId: args.id,
      phase: "pairsAsA",
      pairId: null,
      cursor: null,
    });
    return null;
  },
});

export const cleanupRemovedItem = internalMutation({
  args: {
    itemId: v.id("items2"),
    phase: v.union(
      v.literal("pairsAsA"),
      v.literal("pairsAsB"),
      v.literal("favorites"),
    ),
    pairId: v.union(v.id("itemPairs2"), v.null()),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.phase === "favorites") {
      const page = await ctx.db.query("users").paginate({
        numItems: 25,
        cursor: args.cursor,
      });
      for (const user of page.page) {
        const favorites = user.poe2Favorites ?? [];
        if (!favorites.includes(args.itemId)) {
          continue;
        }
        await ctx.db.patch("users", user._id, {
          poe2Favorites: favorites.filter((id) => id !== args.itemId),
        });
      }
      if (!page.isDone) {
        await ctx.scheduler.runAfter(0, internal.items2.cleanupRemovedItem, {
          itemId: args.itemId,
          phase: "favorites",
          pairId: null,
          cursor: page.continueCursor,
        });
      }
      return null;
    }

    const activePairId = args.pairId;
    if (activePairId !== null) {
      const ticks = await ctx.db
        .query("priceTick2")
        .withIndex("by_itemPairId_and_postTime", (q) =>
          q.eq("itemPairId", activePairId),
        )
        .take(TICK_DELETE_BATCH);
      for (const tick of ticks) {
        await ctx.db.delete("priceTick2", tick._id);
      }
      if (ticks.length === TICK_DELETE_BATCH) {
        await ctx.scheduler.runAfter(0, internal.items2.cleanupRemovedItem, args);
        return null;
      }
      const pair = await ctx.db.get("itemPairs2", activePairId);
      if (pair !== null) {
        await ctx.db.delete("itemPairs2", activePairId);
      }
      await ctx.scheduler.runAfter(0, internal.items2.cleanupRemovedItem, {
        itemId: args.itemId,
        phase: args.phase,
        pairId: null,
        cursor: null,
      });
      return null;
    }

    const nextPair =
      args.phase === "pairsAsA"
        ? await ctx.db
            .query("itemPairs2")
            .withIndex("by_itemAId_and_itemBId", (q) =>
              q.eq("itemAId", args.itemId),
            )
            .take(1)
        : await ctx.db
            .query("itemPairs2")
            .withIndex("by_itemBId_and_itemAId", (q) =>
              q.eq("itemBId", args.itemId),
            )
            .take(1);
    const pair = nextPair[0];
    if (pair !== undefined) {
      await ctx.scheduler.runAfter(0, internal.items2.cleanupRemovedItem, {
        itemId: args.itemId,
        phase: args.phase,
        pairId: pair._id,
        cursor: null,
      });
      return null;
    }

    await ctx.scheduler.runAfter(0, internal.items2.cleanupRemovedItem, {
      itemId: args.itemId,
      phase: args.phase === "pairsAsA" ? "pairsAsB" : "favorites",
      pairId: null,
      cursor: null,
    });
    return null;
  },
});
