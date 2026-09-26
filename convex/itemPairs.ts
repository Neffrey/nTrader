import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export async function findOrCreateItemPair1(
  ctx: MutationCtx,
  itemAId: Id<"items1">,
  itemBId: Id<"items1">,
) {
  const existing = await ctx.db
    .query("itemPairs1")
    .withIndex("by_itemAId_and_itemBId", (q) =>
      q.eq("itemAId", itemAId).eq("itemBId", itemBId),
    )
    .unique();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("itemPairs1", { itemAId, itemBId });
}

export async function findOrCreateItemPair2(
  ctx: MutationCtx,
  itemAId: Id<"items2">,
  itemBId: Id<"items2">,
) {
  const existing = await ctx.db
    .query("itemPairs2")
    .withIndex("by_itemAId_and_itemBId", (q) =>
      q.eq("itemAId", itemAId).eq("itemBId", itemBId),
    )
    .unique();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("itemPairs2", { itemAId, itemBId });
}
