import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

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

const USER_AGENT = "nTrader/0.1 (local development; PoE1 item catalog)";
const IMAGE_ORIGIN = "https://web.poecdn.com";
const CATALOG_URLS = [
  "https://www.pathofexile.com/api/trade/data/static",
  "https://www.pathofexile.com/api/trade/data/items",
];

export const list = query({
  args: {},
  returns: v.array(item),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const items = await ctx.db
      .query("items1")
      .withIndex("by_name")
      .take(100);
    return items.map((row) => ({
      _id: row._id,
      name: row.name,
      image: row.image ?? null,
      internalId: row.internalId,
    }));
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
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
    return await ctx.db.insert("items1", { name, image, internalId });
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

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
