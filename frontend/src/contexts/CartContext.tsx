import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/lib/api";
import type { Cart, CartItem, Product } from "@/lib/types";
import { toast } from "sonner";

type CartContextValue = {
  cart: Cart;
  isLoading: boolean;
  isRemote: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => void;
};

const STORAGE_KEY = "maison_atelier_cart_v1";

const emptyCart = (): Cart => ({
  id: "local",
  items: [],
  subtotal_cents: 0,
  currency: "USD",
});

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemote, setIsRemote] = useState(false);

  const computeSubtotal = useCallback((items: CartItem[] = []) => {
    return items.reduce((sum, i) => {
      const price = i?.product?.price_cents || 0;
      const qty = i?.quantity || 0;
      return sum + (price * qty);
    }, 0);
  }, []);

  // Hydrate guest cart from localStorage
  useEffect(() => {
    if (isAuthenticated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          const validItems = items.filter(i => i && i.product);
          setCart({
            id: "local",
            items: validItems,
            subtotal_cents: computeSubtotal(validItems),
            currency: "USD",
          });
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated, computeSubtotal]);

  // Fetch remote cart when signed in
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setIsLoading(true);
    api<Cart>("/cart")
      .then((data) => {
        if (cancelled) return;
        setCart(data);
        setIsRemote(true);
      })
      .catch(() => {
        setIsRemote(false);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, api]);

  const addItem = useCallback(
    async (product: Product, quantity = 1) => {
      if (isAuthenticated && isRemote) {
        try {
          const updated = await api<Cart>("/cart/add", {
            method: "POST",
            body: JSON.stringify({ product_id: product.id, quantity }),
          });
          setCart(updated);
          toast.success(`Added ${product.name} to bag`);
          return;
        } catch (e) {
          toast.error((e as Error).message);
          return;
        }
      }
      
      setCart((prev) => {
        const existing = prev.items.find((i) => i.product_id === product.id);
        const items = existing
          ? prev.items.map((i) =>
              i.product_id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            )
          : [
              ...prev.items,
              {
                id: `local_${product.id}`,
                product_id: product.id,
                quantity,
                product,
              },
            ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return {
          ...prev,
          items,
          subtotal_cents: computeSubtotal(items),
        };
      });
      toast.success(`Added ${product.name} to bag`);
    },
    [api, isRemote, isAuthenticated, computeSubtotal],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (isAuthenticated && isRemote) {
        const updated = await api<Cart>("/cart/update", {
          method: "PUT",
          body: JSON.stringify({ item_id: itemId, quantity }),
        });
        setCart(updated);
        return;
      }
      setCart((prev) => {
        const items = prev.items
          .map((i) => (i.id === itemId ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return { ...prev, items, subtotal_cents: computeSubtotal(items) };
      });
    },
    [api, isRemote, isAuthenticated, computeSubtotal],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (isAuthenticated && isRemote) {
        const updated = await api<Cart>(`/cart/remove?item_id=${itemId}`, {
          method: "DELETE",
        });
        setCart(updated);
        return;
      }
      setCart((prev) => {
        const items = prev.items.filter((i) => i.id !== itemId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return { ...prev, items, subtotal_cents: computeSubtotal(items) };
      });
    },
    [api, isRemote, isAuthenticated, computeSubtotal],
  );

  const clear = useCallback(() => {
    setCart(emptyCart());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ cart, isLoading, isRemote, addItem, updateItem, removeItem, clear }),
    [cart, isLoading, isRemote, addItem, updateItem, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
