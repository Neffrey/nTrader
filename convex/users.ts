import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const currentUser = v.object({
  name: v.union(v.string(), v.null()),
  displayName: v.union(v.string(), v.null()),
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
      displayName: user.displayName ?? user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      phone: user.phone ?? null,
    };
  },
});

export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const displayName = args.displayName.trim();
    if (displayName.length === 0) {
      throw new ConvexError("Display name cannot be empty");
    }
    if (displayName.length > 80) {
      throw new ConvexError("Display name must be 80 characters or fewer");
    }
    await ctx.db.patch("users", userId, { displayName });
    return displayName;
  },
});
