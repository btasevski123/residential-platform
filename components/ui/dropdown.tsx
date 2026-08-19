"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Dropdown({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-card-muted"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div className={cn("absolute right-0 z-20 mt-2 min-w-44 rounded-lg border border-border bg-card p-1 shadow-sm")}>
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-card-muted"
      {...props}
    >
      {children}
    </button>
  );
}
