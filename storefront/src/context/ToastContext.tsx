"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface ToastItem {
  id: number;
  msg: string;
}

interface ToastCtx {
  toast: (msg: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((msg: string) => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, msg }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2400);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {items.map((t) => (
        <div key={t.id} className="toast is-show" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{t.msg}</span>
        </div>
      ))}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
