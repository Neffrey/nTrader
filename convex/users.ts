import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const currentUser = v.object({
  name: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
  phone: v.union(v.string(), v.null()),
});

export const current = query({
  args: {},
  returns: v.union(currentUser, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get("users", userId);
    if (user === null) {
      return null;
    }
    return {
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      phone: user.phone ?? null,
    };
  },
});

export const updateName = mutation({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (name.length > 80) {
      throw new ConvexError("Name must be 80 characters or fewer");
    }
    await ctx.db.patch("users", userId, { name });
    return name;
  },
});
