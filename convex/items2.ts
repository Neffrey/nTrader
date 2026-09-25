import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";

const item = v.object({
  _id: v.id("items2"),
  name: v.string(),
  image: v.string(),
  internalId: v.union(v.string(), v.null()),
});

export const list = query({
  args: {},
  returns: v.array(item),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const items = await ctx.db.query("items2").withIndex("by_name").take(2000);
    return items.map((row) => ({
      _id: row._id,
      name: row.name,
      image: row.image,
      internalId: row.internalId ?? null,
    }));
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    image: v.string(),
    internalId: v.optional(v.string()),
  },
  returns: v.id("items2"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    const image = args.image.trim();
    const internalId = args.internalId?.trim() ?? "";
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (!image.startsWith("https://") && !image.startsWith("http://")) {
      throw new ConvexError("Image must be an http or https URL");
    }
    return await ctx.db.insert("items2", {
      name,
      image,
      ...(internalId.length === 0 ? {} : { internalId }),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("items2"),
    name: v.string(),
    image: v.string(),
    internalId: v.optional(v.string()),
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
    const internalId = args.internalId?.trim() ?? "";
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (!image.startsWith("https://") && !image.startsWith("http://")) {
      throw new ConvexError("Image must be an http or https URL");
    }
    await ctx.db.replace("items2", args.id, {
      name,
      image,
      ...(internalId.length === 0 ? {} : { internalId }),
    });
    return null;
  },
});
