import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (user === null || user.role !== "admin") {
    throw new ConvexError("Not authorized");
  }
  return userId;
}

const currentUser = v.object({
  name: v.union(v.string(), v.null()),
  displayName: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
  phone: v.union(v.string(), v.null()),
  poeAuthorized: v.boolean(),
  poeUsername: v.union(v.string(), v.null()),
  poe1Favorites: v.array(v.id("items1")),
  poe2Favorites: v.array(v.id("items2")),
  role: v.union(v.literal("user"), v.literal("admin"), v.literal("banned")),
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
      poeAuthorized: user.poeAccessToken !== undefined,
      poeUsername: user.poeUsername ?? null,
      poe1Favorites: user.poe1Favorites ?? [],
      poe2Favorites: user.poe2Favorites ?? [],
      role: user.role,
    };
  },
});

async function requireSignedInUser(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (user === null) {
    throw new ConvexError("Not authenticated");
  }
  if (user.role === "banned") {
    throw new ConvexError("Not authorized");
  }
  return user;
}

export const markPoe1Favorite = mutation({
  args: { itemId: v.id("items1") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireSignedInUser(ctx);
    const item = await ctx.db.get("items1", args.itemId);
    if (item === null) {
      throw new ConvexError("Item not found");
    }
    const favorites = user.poe1Favorites ?? [];
    await ctx.db.patch("users", user._id, {
      poe1Favorites: favorites.includes(args.itemId)
        ? favorites.filter((id) => id !== args.itemId)
        : [...favorites, args.itemId],
    });
    return null;
  },
});

export const markPoe2Favorite = mutation({
  args: { itemId: v.id("items2") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireSignedInUser(ctx);
    const item = await ctx.db.get("items2", args.itemId);
    if (item === null) {
      throw new ConvexError("Item not found");
    }
    const favorites = user.poe2Favorites ?? [];
    await ctx.db.patch("users", user._id, {
      poe2Favorites: favorites.includes(args.itemId)
        ? favorites.filter((id) => id !== args.itemId)
        : [...favorites, args.itemId],
    });
    return null;
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

export const savePoeCredentials = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.union(v.string(), v.null()),
    expiresAt: v.union(v.number(), v.null()),
    scope: v.string(),
    poeUsername: v.string(),
    poeSub: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    await ctx.db.patch("users", userId, {
      poeAccessToken: args.accessToken,
      poeScope: args.scope,
      poeUsername: args.poeUsername,
      poeSub: args.poeSub,
      ...(args.refreshToken === null
        ? {}
        : { poeRefreshToken: args.refreshToken }),
      ...(args.expiresAt === null ? {} : { poeTokenExpiresAt: args.expiresAt }),
    });
    return null;
  },
});
