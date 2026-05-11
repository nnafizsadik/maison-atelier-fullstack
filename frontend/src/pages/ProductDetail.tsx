import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams();
  const { product } = useProduct(slug);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!product) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <p className="font-mono text-sm text-muted-foreground">Product not found</p>
          <Button asChild variant="link" className="mt-4">
            <Link to="/">Back to shop</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart",
      });
      navigate("/sign-in");
      return;
    }
    addItem(product);
  };

  return (
    <Layout>
      <div className="container py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
      </div>
      <section className="container grid gap-12 pb-20 md:grid-cols-2">
        <div className="bg-muted">
          <img
            src={product.image_url}
            alt={product.name}
            width={800}
            height={1000}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div className="md:pt-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            {product.category}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 font-mono text-lg">
            {formatPrice(product.price_cents, product.currency)}
          </p>
          <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-10 space-y-3">
            <Button
              size="lg"
              disabled={!product.in_stock}
              onClick={handleAddToCart}
              className="w-full rounded-none md:w-72"
            >
              {product.in_stock ? "Add to bag" : "Sold out"}
            </Button>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Ships in 2–4 business days · Free over $200
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-4 border-t border-border pt-8 text-sm">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Origin</dt>
              <dd className="mt-1">Europe</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Care</dt>
              <dd className="mt-1">Wash cold, line dry</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Returns</dt>
              <dd className="mt-1">Free within 30 days</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Warranty</dt>
              <dd className="mt-1">Lifetime repairs</dd>
            </div>
          </dl>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
