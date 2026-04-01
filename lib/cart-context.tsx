"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api, { readApiErrorMessage } from "@/app/services/appi";
import {
  isCartApiSuccess,
  mapCartLinesToUiItems,
  type CartApiSuccess,
} from "@/lib/cart-api";

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
  lineItemId?: string;
  productId?: string;
}

function cartKey(item: { slug: string; size: string; color: string }) {
  return `${item.slug}__${item.size}__${item.color}`;
}

export type AddItemPayload = Omit<CartItem, "quantity" | "lineItemId"> & {
  quantity?: number;
};

interface CartContextValue {
  items: CartItem[];
  cartLoading: boolean;
  cartError: string | null;
  addItem: (
    item: AddItemPayload,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeItem: (item: CartItem) => Promise<void>;
  updateQuantity: (item: CartItem, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tshirts4u_cart";

function readUserIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { _id?: string; id?: string };
    if (!parsed || typeof parsed !== "object") return null;
    const id = parsed._id ?? parsed.id;
    return id != null && String(id).length > 0 ? String(id) : null;
  } catch {
    return null;
  }
}

function loadGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — ignore */
  }
}

function applySuccessToState(data: CartApiSuccess): {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
} {
  const mapped = mapCartLinesToUiItems(data.cart.items);
  const items: CartItem[] = mapped.map((row) => ({
    slug: row.slug,
    name: row.name,
    price: row.price,
    size: row.size,
    color: row.color,
    image: row.image,
    quantity: row.quantity,
    lineItemId: row.lineItemId,
    productId: row.productId,
  }));
  return {
    items,
    itemCount: data.itemCount,
    subtotal: data.subtotal,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [serverTotals, setServerTotals] = useState<{
    itemCount: number;
    subtotal: number;
  } | null>(null);

  const loadServerCart = useCallback(async (uid: string) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const res = await api.get(`/api/users/${encodeURIComponent(uid)}/cart`);
      if (res.status >= 400 || !isCartApiSuccess(res.data)) {
        setCartError(
          readApiErrorMessage(res.data) ?? "Could not load cart.",
        );
        setItems([]);
        setServerTotals(null);
        return;
      }
      const next = applySuccessToState(res.data);
      setCartError(null);
      setItems(next.items);
      setServerTotals({
        itemCount: next.itemCount,
        subtotal: next.subtotal,
      });
    } finally {
      setCartLoading(false);
    }
  }, []);

  const syncUserAndCart = useCallback(async () => {
    const uid = readUserIdFromStorage();
    setUserId(uid);
    if (uid) {
      await loadServerCart(uid);
    } else {
      setCartLoading(false);
      setCartError(null);
      setServerTotals(null);
      setItems(loadGuestCart());
    }
  }, [loadServerCart]);

  useEffect(() => {
    void (async () => {
      await syncUserAndCart();
      setHydrated(true);
    })();
  }, [syncUserAndCart]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") void syncUserAndCart();
    };
    const onUserUpdated = () => void syncUserAndCart();
    window.addEventListener("storage", onStorage);
    window.addEventListener("tshirts4u-auth-changed", onUserUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tshirts4u-auth-changed", onUserUpdated);
    };
  }, [syncUserAndCart]);

  useEffect(() => {
    if (!hydrated || userId) return;
    saveGuestCart(items);
  }, [items, hydrated, userId]);

  const addItem = useCallback(
    async (
      incoming: AddItemPayload,
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const uid = readUserIdFromStorage();
      const qty = incoming.quantity ?? 1;
      if (uid) {
        if (!incoming.productId?.trim()) {
          return { ok: false, error: "Missing product id." };
        }
        const res = await api.post(`/api/users/${encodeURIComponent(uid)}/cart/items`, {
          productId: incoming.productId,
          quantity: qty,
          size: incoming.size,
          color: incoming.color,
        });
        if (res.status >= 400 || !isCartApiSuccess(res.data)) {
          return {
            ok: false,
            error: readApiErrorMessage(res.data) ?? "Could not add to cart.",
          };
        }
        const next = applySuccessToState(res.data);
        setCartError(null);
        setItems(next.items);
        setServerTotals({
          itemCount: next.itemCount,
          subtotal: next.subtotal,
        });
        return { ok: true };
      }

      setItems((prev) => {
        const base = {
          slug: incoming.slug,
          name: incoming.name,
          price: incoming.price,
          size: incoming.size,
          color: incoming.color,
          image: incoming.image,
          productId: incoming.productId,
        };
        const key = cartKey(base);
        const idx = prev.findIndex((i) => cartKey(i) === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + qty,
          };
          return next;
        }
        return [...prev, { ...base, quantity: qty }];
      });
      return { ok: true };
    },
    [],
  );

  const removeItem = useCallback(async (item: CartItem) => {
    const uid = readUserIdFromStorage();
    if (uid && item.lineItemId) {
      const res = await api.delete(
        `/api/users/${encodeURIComponent(uid)}/cart/items/${encodeURIComponent(item.lineItemId)}`,
      );
      if (res.status >= 400 || !isCartApiSuccess(res.data)) {
        setCartError(readApiErrorMessage(res.data) ?? "Could not remove item.");
        return;
      }
      const next = applySuccessToState(res.data);
      setCartError(null);
      setItems(next.items);
      setServerTotals({
        itemCount: next.itemCount,
        subtotal: next.subtotal,
      });
      return;
    }
    setItems((prev) =>
      prev.filter((i) => cartKey(i) !== cartKey(item)),
    );
  }, []);

  const updateQuantity = useCallback(async (item: CartItem, quantity: number) => {
    const uid = readUserIdFromStorage();
    if (uid && item.lineItemId) {
      if (quantity < 1) {
        await removeItem(item);
        return;
      }
      const res = await api.patch(
        `/api/users/${encodeURIComponent(uid)}/cart/items/${encodeURIComponent(item.lineItemId)}`,
        { quantity },
      );
      if (res.status >= 400 || !isCartApiSuccess(res.data)) {
        setCartError(
          readApiErrorMessage(res.data) ?? "Could not update quantity.",
        );
        return;
      }
      const next = applySuccessToState(res.data);
      setCartError(null);
      setItems(next.items);
      setServerTotals({
        itemCount: next.itemCount,
        subtotal: next.subtotal,
      });
      return;
    }
    if (quantity < 1) {
      setItems((prev) =>
        prev.filter((i) => cartKey(i) !== cartKey(item)),
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        cartKey(i) === cartKey(item) ? { ...i, quantity } : i,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    const uid = readUserIdFromStorage();
    if (uid) {
      const res = await api.delete(`/api/users/${encodeURIComponent(uid)}/cart`);
      if (res.status >= 400 || !isCartApiSuccess(res.data)) {
        setCartError(readApiErrorMessage(res.data) ?? "Could not clear cart.");
        return;
      }
      const next = applySuccessToState(res.data);
      setCartError(null);
      setItems(next.items);
      setServerTotals({
        itemCount: next.itemCount,
        subtotal: next.subtotal,
      });
      return;
    }
    setItems([]);
  }, []);

  const refreshCart = useCallback(async () => {
    await syncUserAndCart();
  }, [syncUserAndCart]);

  const totalItems = useMemo(() => {
    if (userId && serverTotals) return serverTotals.itemCount;
    return items.reduce((s, i) => s + i.quantity, 0);
  }, [userId, serverTotals, items]);

  const totalPrice = useMemo(() => {
    if (userId && serverTotals) return serverTotals.subtotal;
    return items.reduce((s, i) => s + i.price * i.quantity, 0);
  }, [userId, serverTotals, items]);

  const value = useMemo(
    () => ({
      items,
      cartLoading,
      cartError,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart,
      totalItems,
      totalPrice,
    }),
    [
      items,
      cartLoading,
      cartError,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart,
      totalItems,
      totalPrice,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
