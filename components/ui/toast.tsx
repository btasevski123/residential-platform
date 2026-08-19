"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Toast = { id: string; message: string };

const ToastContext = createContext<{ push: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sequence = useRef(0);

  const push = useCallback((message: string) => {
    const id = `${Date.now()}-${sequence.current++}`;

    setToasts((current) => {
      if (current.some((toast) => toast.message === message)) {
        return current;
      }

      return [...current, { id, message }];
    });

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function Toast() {
  return null;
}
