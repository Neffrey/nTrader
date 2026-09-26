import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireAdmin } from "./users";

async function assertUniqueInternalId(ctx: MutationCtx, internalId: string) {
  const matches = await ctx.db
    .query("gameLeague")
    .withIndex("by_internalId", (q) => q.eq("internalId", internalId))
    .take(1);
  if (matches.length > 0) {
    throw new ConvexError("Internal id is already used");
  }
}

export const add = mutation({
  args: {
    name: v.string(),
    internalId: v.string(),
  },
  returns: v.id("gameLeague"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    const internalId = args.internalId.trim();
    if (name.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }
    if (internalId.length === 0) {
      throw new ConvexError("Internal id cannot be empty");
    }
    await assertUniqueInternalId(ctx, internalId);
    return await ctx.db.insert("gameLeague", { name, internalId });
  },
});
