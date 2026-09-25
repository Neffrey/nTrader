import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const item = v.object({
  _id: v.id("items2"),
  name: v.string(),
  image: v.string(),
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
    }));
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    image: v.string(),
  },
  returns: v.id("items2"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const name = args.name.trim();
    const image = args.image.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (!image.startsWith("https://") && !image.startsWith("http://")) {
      throw new ConvexError("Image must be an http or https URL");
    }
    return await ctx.db.insert("items2", { name, image });
  },
});
