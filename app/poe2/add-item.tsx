"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";

export function AddItem() {
  const items = useQuery(api.items2.list);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2 text-left">
      <p className="text-sm text-neutral-400">{items.length} items</p>
      <ul className="flex max-h-[32rem] flex-col divide-y divide-neutral-800 overflow-y-auto">
        {items.map((item) => (
          <li key={item._id} className="flex items-center gap-3 py-3">
            <Image
              src={item.image}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-md object-cover"
            />
            <span className="text-sm text-neutral-100">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
