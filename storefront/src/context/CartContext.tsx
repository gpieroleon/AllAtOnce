"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { get } from "@/lib/api";
import type { Product } from "@/lib/types";
import {
  CartMap,
  cartCount,
  loadCart,
  loadWishlist,
  saveCart,
  saveWishlist,
} from "@/lib/storage";
import { useToast } from "./ToastContext";

export interface CartLine {
  id: number;
  qty: number;
  product?: Product;
}

interface CartCtx {
  cart: CartMap;
  lines: CartLine[];
  count: number;
  subtotal: number;
  catalog: Record<number, Product>;
  catalogReady: boolean;
  refreshCatalog: () => Promise<void>;
  add: (id: number, qty?: number, silent?: boolean) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  wishlist: number[];
  toggleWish: (id: number) => void;
  isWished: (id: number) => boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartMap>({});
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<Record<number, Product>>({});
  const [catalogReady, setCatalogReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setCart(loadCart());
    setWishlist(loadWishlist());
    loaded.current = true;
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const products = await get<Product[]>("/products?cat=all");
      const map: Record<number, Product> = {};
      for (const p of products) map[p.id] = p;
      setCatalog(map);
    } catch {
      /* API caída: el carrito sigue funcionando sin detalles */
    } finally {
      setCatalogReady(true);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const persist = (next: CartMap) => {
    setCart(next);
    saveCart(next);
  };

  const add = useCallback(
    (id: number, qty = 1, silent = false) => {
      setCart((prev) => {
        const next = { ...prev, [String(id)]: (prev[String(id)] || 0) + qty };
        saveCart(next);
        return next;
      });
      if (!silent) toast("Añadido al carrito");
    },
    [toast]
  );

  const setQty = useCallback((id: number, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[String(id)];
      else next[String(id)] = qty;
      saveCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persist({});
  }, []);

  const toggleWish = useCallback(
    (id: number) => {
      setWishlist((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        saveWishlist(next);
        return next;
      });
      toast("Favoritos actualizados");
    },
    [toast]
  );

  const isWished = useCallback((id: number) => wishlist.includes(id), [wishlist]);

  const lines = useMemo<CartLine[]>(
    () =>
      Object.entries(cart).map(([id, qty]) => ({
        id: Number(id),
        qty,
        product: catalog[Number(id)],
      })),
    [cart, catalog]
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.qty : 0), 0),
    [lines]
  );

  const value: CartCtx = {
    cart,
    lines,
    count: cartCount(cart),
    subtotal,
    catalog,
    catalogReady,
    refreshCatalog,
    add,
    setQty,
    remove,
    clear,
    wishlist,
    toggleWish,
    isWished,
    drawerOpen,
    setDrawerOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart fuera de CartProvider");
  return ctx;
}
