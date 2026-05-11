import { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import { FALLBACK_PRODUCTS } from "../lib/catalog";
import type { Product } from "../lib/types";

export function useProducts() {
  const api = useApi();
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [isRemote, setIsRemote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Product[]>("/api/products", { auth: false })
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setProducts(data);
        setIsRemote(true);
      })
      .catch(() => {
        // Fall back to local catalog (already set)
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { products, isRemote };
}

export function useProduct(slug: string | undefined) {
  const { products } = useProducts();
  return products.find((p) => p.slug === slug);
}
