import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Cart = () => {
  const { cart, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your bag
          </p>
          <h1 className="mt-3 font-display text-4xl">Nothing in here yet.</h1>
          <p className="mt-3 max-w-sm text-muted-foreground">
            Browse the catalog and add a piece or two — we'll keep it warm for you.
          </p>
          <Button asChild className="mt-8 rounded-none">
            <Link to="/">Shop the edition</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-12">
        <div className="mb-8 border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your bag
          </p>
          <h1 className="mt-2 font-display text-4xl">
            {cart.items.length} {cart.items.length === 1 ? "piece" : "pieces"}
          </h1>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-border">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-6 py-6">
                <Link to={`/products/${item.product.slug}`} className="shrink-0">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    width={120}
                    height={150}
                    loading="lazy"
                    className="h-32 w-24 object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        {item.product.category}
                      </p>
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="mt-1 block font-display text-xl hover:text-accent"
                      >
                        {item.product.name}
                      </Link>
                    </div>
                    <button
                      aria-label="Remove"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="inline-flex items-center border border-border">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="px-3 py-2 text-muted-foreground hover:text-foreground"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="px-3 py-2 text-muted-foreground hover:text-foreground"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-mono text-sm">
                      {formatPrice(item.product.price_cents * item.quantity, item.product.currency)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="space-y-6 border border-border bg-secondary/40 p-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-2xl">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-mono">{formatPrice(cart.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-mono">
                  {cart.subtotal_cents >= 20000 ? "Free" : formatPrice(1200)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt>Total</dt>
                <dd className="font-mono">
                  {formatPrice(
                    cart.subtotal_cents + (cart.subtotal_cents >= 20000 ? 0 : 1200),
                  )}
                </dd>
              </div>
            </dl>
            {isAuthenticated ? (
              <Button
                className="w-full rounded-none"
                size="lg"
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </Button>
            ) : (
              <>
                <Button asChild className="w-full rounded-none" size="lg">
                  <Link to="/sign-in?redirect=/checkout">Sign in to checkout</Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Your bag is saved while you sign in.
                </p>
              </>
            )}
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
