import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";

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
    return null;
  },
});
