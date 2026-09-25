"use client";

import { useEffect, useId, useRef, useState } from "react";

export function ItemMenu({
  showEdit,
  showComingSoon,
  onEdit,
}: {
  showEdit: boolean;
  showComingSoon: boolean;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  if (!showEdit && !showComingSoon) {
    return null;
  }

  return (
    <div className="relative ml-auto" ref={rootRef}>
      <button
        type="button"
        aria-label="Item actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="rounded-md px-2 py-1 text-lg leading-none text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({ top: rect.bottom + 4, left: rect.right });
          setOpen((value) => !value);
        }}
      >
        ···
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="fixed z-20 flex min-w-36 -translate-x-full flex-col rounded-md border border-neutral-700 bg-neutral-900 p-1 shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          {showEdit && (
            <button
              type="button"
              role="menuitem"
              className="rounded px-3 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-800"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              Edit
            </button>
          )}
          {showComingSoon && (
            <button
              type="button"
              role="menuitem"
              disabled
              className="cursor-not-allowed rounded px-3 py-2 text-left text-sm text-neutral-500"
            >
              Coming soon
            </button>
          )}
        </div>
      )}
    </div>
  );
}
