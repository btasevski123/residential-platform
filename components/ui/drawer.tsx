"use client";

import { cn } from "@/lib/utils";

export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-foreground/30"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl">{title}</h2>
          <button type="button" className="min-h-11 text-sm text-muted" onClick={onClose}>
            Close
          </button>
        </div>
        <div className={cn("flex-1 overflow-y-auto")}>{children}</div>
      </aside>
    </div>
  );
}
