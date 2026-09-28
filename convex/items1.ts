import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAdmin } from "./users";

async function assertUniqueInternalId(
  ctx: MutationCtx,
  internalId: string,
  exceptId?: Id<"items1">,
) {
  const matches = await ctx.db
    .query("items1")
    .withIndex("by_internalId", (q) => q.eq("internalId", internalId))
    .take(2);
  if (matches.some((row) => row._id !== exceptId)) {
    throw new ConvexError("Internal id is already used");
  }
}

const item = v.object({
  _id: v.id("items1"),
  name: v.string(),
  image: v.union(v.string(), v.null()),
  internalId: v.string(),
});

const catalogItem = v.object({
  name: v.string(),
  image: v.union(v.string(), v.null()),
  internalId: v.string(),
});

const ITEM_LIST_LIMIT = 2000;
const TICK_DELETE_BATCH = 50;

const USER_AGENT = "nTrader/0.1 (local development; PoE1 item catalog)";
const IMAGE_ORIGIN = "https://web.poecdn.com";
const CATALOG_URLS = [
  "https://www.pathofexile.com/api/trade/data/static",
  "https://www.pathofexile.com/api/trade/data/items",
];

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
      .query("items1")
      .withIndex("by_name")
      .take(ITEM_LIST_LIMIT + 1);
    const truncated = rows.length > ITEM_LIST_LIMIT;
    const items = truncated ? rows.slice(0, ITEM_LIST_LIMIT) : rows;
    return {
      truncated,
      items: items.map((row) => ({
        _id: row._id,
        name: row.name,
        image: row.image ?? null,
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
  returns: v.id("items1"),
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
    return await ctx.db.insert("items1", {
      name,
      image,
      internalId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("items1"),
    name: v.string(),
    image: v.string(),
    internalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("items1", args.id);
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
    if (
      image.length > 0 &&
      !image.startsWith("https://") &&
      !image.startsWith("http://")
    ) {
      throw new ConvexError("Image must be an http or https URL");
    }
    await assertUniqueInternalId(ctx, internalId, args.id);
    await ctx.db.replace("items1", args.id, {
      name,
      internalId,
      ...(image.length === 0 ? {} : { image }),
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("items1") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("items1", args.id);
    if (existing === null) {
      throw new ConvexError("Item not found");
    }
    await ctx.db.delete("items1", args.id);
    await ctx.scheduler.runAfter(0, internal.items1.cleanupRemovedItem, {
      itemId: args.id,
      phase: "pairsAsA",
      pairId: null,
      cursor: null,
    });
    return null;
  },
});

export const assertAdmin = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return null;
  },
});

export const cleanupRemovedItem = internalMutation({
  args: {
    itemId: v.id("items1"),
    phase: v.union(
      v.literal("pairsAsA"),
      v.literal("pairsAsB"),
      v.literal("favorites"),
    ),
    pairId: v.union(v.id("itemPairs1"), v.null()),
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
        const favorites = user.poe1Favorites ?? [];
        if (!favorites.includes(args.itemId)) {
          continue;
        }
        await ctx.db.patch("users", user._id, {
          poe1Favorites: favorites.filter((id) => id !== args.itemId),
        });
      }
      if (!page.isDone) {
        await ctx.scheduler.runAfter(0, internal.items1.cleanupRemovedItem, {
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
        .query("priceTick1")
        .withIndex("by_itemPairId_and_postTime", (q) =>
          q.eq("itemPairId", activePairId),
        )
        .take(TICK_DELETE_BATCH);
      for (const tick of ticks) {
        await ctx.db.delete("priceTick1", tick._id);
      }
      if (ticks.length === TICK_DELETE_BATCH) {
        await ctx.scheduler.runAfter(0, internal.items1.cleanupRemovedItem, args);
        return null;
      }
      const pair = await ctx.db.get("itemPairs1", activePairId);
      if (pair !== null) {
        await ctx.db.delete("itemPairs1", activePairId);
      }
      await ctx.scheduler.runAfter(0, internal.items1.cleanupRemovedItem, {
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
            .query("itemPairs1")
            .withIndex("by_itemAId_and_itemBId", (q) =>
              q.eq("itemAId", args.itemId),
            )
            .take(1)
        : await ctx.db
            .query("itemPairs1")
            .withIndex("by_itemBId_and_itemAId", (q) =>
              q.eq("itemBId", args.itemId),
            )
            .take(1);
    const pair = nextPair[0];
    if (pair !== undefined) {
      await ctx.scheduler.runAfter(0, internal.items1.cleanupRemovedItem, {
        itemId: args.itemId,
        phase: args.phase,
        pairId: pair._id,
        cursor: null,
      });
      return null;
    }

    await ctx.scheduler.runAfter(0, internal.items1.cleanupRemovedItem, {
      itemId: args.itemId,
      phase: args.phase === "pairsAsA" ? "pairsAsB" : "favorites",
      pairId: null,
      cursor: null,
    });
    return null;
  },
});

export const upsertBatch = internalMutation({
  args: { items: v.array(catalogItem) },
  returns: v.number(),
  handler: async (ctx, args) => {
    let written = 0;
    for (const item of args.items) {
      const existing = await ctx.db
        .query("items1")
        .withIndex("by_name", (q) => q.eq("name", item.name))
        .take(1);
      const current = existing[0];
      if (current === undefined) {
        await assertUniqueInternalId(ctx, item.internalId);
        await ctx.db.insert("items1", {
          name: item.name,
          internalId: item.internalId,
          ...(item.image === null ? {} : { image: item.image }),
        });
        written += 1;
        continue;
      }
      const patch: { image?: string; internalId?: string } = {};
      if (item.image !== null && current.image !== item.image) {
        patch.image = item.image;
      }
      if (current.internalId !== item.internalId) {
        await assertUniqueInternalId(ctx, item.internalId, current._id);
        patch.internalId = item.internalId;
      }
      if (patch.image !== undefined || patch.internalId !== undefined) {
        await ctx.db.patch("items1", current._id, patch);
        written += 1;
      }
    }
    return written;
  },
});

export const fetchAll = action({
  args: {},
  returns: v.object({
    count: v.number(),
  }),
  handler: async (ctx) => {
    const adminCheck: null = await ctx.runQuery(internal.items1.assertAdmin, {});
    void adminCheck;

    const lists = await Promise.all(CATALOG_URLS.map(loadCatalog));
    const items = mergeCatalogs(lists.flat());
    const batchSize = 200;
    for (let index = 0; index < items.length; index += batchSize) {
      const written: number = await ctx.runMutation(internal.items1.upsertBatch, {
        items: items.slice(index, index + batchSize),
      });
      void written;
    }
    return { count: items.length };
  },
});

async function loadCatalog(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new ConvexError(`Item catalog request failed (${response.status})`);
  }
  return readCatalog(await response.json());
}

function mergeCatalogs(
  items: Array<{ name: string; image: string | null; internalId: string }>,
) {
  const byName = new Map<
    string,
    { name: string; image: string | null; internalId: string }
  >();
  for (const item of items) {
    const current = byName.get(item.name);
    if (current === undefined || (current.image === null && item.image !== null)) {
      byName.set(item.name, {
        name: item.name,
        image: item.image ?? current?.image ?? null,
        internalId: item.internalId,
      });
    }
  }
  return [...byName.values()];
}

function readCatalog(data: unknown) {
  if (typeof data !== "object" || data === null || !("result" in data)) {
    throw new ConvexError("Item catalog response was not recognized");
  }
  const result = data.result;
  if (!Array.isArray(result)) {
    throw new ConvexError("Item catalog response was not recognized");
  }

  const items: Array<{
    name: string;
    image: string | null;
    internalId: string;
  }> = [];
  for (const category of result) {
    if (
      typeof category !== "object" ||
      category === null ||
      !("id" in category) ||
      typeof category.id !== "string" ||
      (category.id.toLowerCase() !== "currency" &&
        category.id.toLowerCase() !== "fragments") ||
      !("entries" in category) ||
      !Array.isArray(category.entries)
    ) {
      continue;
    }
    for (const entry of category.entries) {
      if (typeof entry !== "object" || entry === null) {
        continue;
      }
      const record = entry as Record<string, unknown>;
      const name = pickName(record);
      if (name === null) {
        continue;
      }
      const image =
        typeof record.image === "string" && record.image.startsWith("/")
          ? `${IMAGE_ORIGIN}${record.image}`
          : null;
      if (typeof record.id !== "string" || record.id.trim().length === 0 || record.id === "sep") {
        continue;
      }
      items.push({ name, image, internalId: record.id.trim() });
    }
  }
  return items;
}

function pickName(record: Record<string, unknown>) {
  for (const value of [record.name, record.text, record.type]) {
    if (typeof value !== "string") {
      continue;
    }
    const name = value.trim();
    if (name.length === 0 || /^\d+$/.test(name)) {
      continue;
    }
    return name;
  }
  return null;
}
