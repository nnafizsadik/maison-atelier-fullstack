import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api<Order[]>("/api/orders")
      .then(setOrders)
      .catch((e) => setError((e as Error).message));
  }, [api, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h1 className="font-display text-4xl">Sign in to view your orders</h1>
          <Button asChild className="mt-6 rounded-none">
            <Link to="/sign-in?redirect=/orders">Sign in</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <h1 className="mt-2 font-display text-4xl">Order history</h1>

        {error && (
          <p className="mt-8 border border-border bg-secondary/40 p-6 text-sm text-muted-foreground">
            Couldn't reach the backend ({error}). Once your Express API is running on{" "}
            <code className="font-mono text-xs">VITE_API_BASE_URL</code>, your orders will
            appear here.
          </p>
        )}

        {orders && orders.length === 0 && (
          <p className="mt-8 text-muted-foreground">No orders yet.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="mt-10 divide-y divide-border border-y border-border">
            {orders.map((o) => (
              <li key={o.id} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Order #{o.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-sm">
                    {new Date(o.created_at).toLocaleDateString()} ·{" "}
                    {o.items.length} {o.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <span className="inline-flex items-center justify-center bg-secondary px-3 py-1 font-mono text-[11px] uppercase tracking-widest">
                  {o.status}
                </span>
                <p className="font-mono text-sm sm:text-right">
                  {formatPrice(o.total_cents, o.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
};

export default Orders;
