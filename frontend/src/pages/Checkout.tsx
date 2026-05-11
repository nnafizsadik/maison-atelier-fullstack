import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

const Checkout = () => {
  const { cart, clear } = useCart();
  const api = useApi();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create order
      const order = await api<{ id: string; total_cents: number }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        }),
      });

      // 2. Initiate payment (stub)
      const payment = await api<{ payment_id: string }>("/api/payment/initiate", {
        method: "POST",
        body: JSON.stringify({ order_id: order.id }),
      });

      // 3. Verify payment (stub — in real flow this happens after gateway redirect)
      await api("/api/payment/verify", {
        method: "POST",
        body: JSON.stringify({
          payment_id: payment.payment_id,
          order_id: order.id,
        }),
      });

      toast.success("Order placed");
      clear();
      navigate("/orders");
    } catch (err) {
      toast.error((err as Error).message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="container py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Step 02
        </p>
        <h1 className="mt-2 font-display text-4xl">Checkout</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-8">
            <fieldset className="space-y-4">
              <legend className="font-display text-2xl">Contact</legend>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required className="rounded-none" />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-display text-2xl">Shipping</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first">First name</Label>
                  <Input id="first" required className="rounded-none" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last">Last name</Label>
                  <Input id="last" required className="rounded-none" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" required className="rounded-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required className="rounded-none" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input id="zip" required className="rounded-none" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" required defaultValue="USA" className="rounded-none" />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-display text-2xl">Payment</legend>
              <p className="text-sm text-muted-foreground">
                Payment is stubbed in this build — the backend creates a pending
                payment, then immediately verifies it. Plug in Stripe/Razorpay
                in <code className="font-mono text-xs">/payment/initiate</code>.
              </p>
            </fieldset>
          </div>

          <aside className="space-y-6 border border-border bg-secondary/40 p-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-2xl">Order</h2>
            <ul className="space-y-3 text-sm">
              {cart.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {i.product.name} × {i.quantity}
                  </span>
                  <span className="font-mono">
                    {formatPrice(i.product.price_cents * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border pt-3 font-mono">
              <span>Total</span>
              <span>{formatPrice(cart.subtotal_cents)}</span>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitting || cart.items.length === 0}
              className="w-full rounded-none"
            >
              {submitting ? "Placing…" : "Place order"}
            </Button>
          </aside>
        </form>
      </section>
    </Layout>
  );
};

export default Checkout;
