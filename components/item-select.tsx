"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

export type ItemOption = {
  _id: string;
  name: string;
  image: string | null;
};

function ItemIcon({ image }: { image: string | null }) {
  if (!image) {
    return <span className="h-6 w-6 shrink-0" />;
  }
  return (
    <Image
      src={image}
      alt=""
      width={24}
      height={24}
      unoptimized
      className="h-6 w-6 shrink-0 rounded object-cover"
    />
  );
}

export function ItemSelect({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: ItemOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelId = `${listId}-label`;
  const selected = items.find((item) => item._id === value) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className={`relative flex flex-col gap-1 text-sm text-neutral-400 ${className ?? ""}`}
      ref={rootRef}
    >
      <span id={labelId}>{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        className="flex w-full items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-left text-sm outline-none focus:border-neutral-500"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        {selected ? <ItemIcon image={selected.image} /> : null}
        <span
          className={
            selected
              ? "min-w-0 flex-1 truncate text-neutral-100"
              : "min-w-0 flex-1 truncate text-neutral-500"
          }
        >
          {selected?.name ?? "Select an item"}
        </span>
        <span aria-hidden="true" className="text-neutral-500">
          ▾
        </span>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg"
        >
          {items.map((item) => {
            const active = item._id === value;
            return (
              <li key={item._id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={
                    active
                      ? "flex w-full items-center gap-2 bg-neutral-800 px-3 py-1.5 text-left text-sm text-neutral-100"
                      : "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-100 hover:bg-neutral-800"
                  }
                  onClick={() => {
                    onChange(item._id);
                    setOpen(false);
                  }}
                >
                  <ItemIcon image={item.image} />
                  <span className="min-w-0 truncate">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
