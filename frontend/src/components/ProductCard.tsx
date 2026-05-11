import { Link } from "react-router-dom";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export const ProductCard = ({ product }: { product: Product }) => (
  <Link
    to={`/products/${product.slug}`}
    className="group block"
  >
    <div className="aspect-[4/5] overflow-hidden bg-muted">
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        width={800}
        height={1000}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
    <div className="mt-4 flex items-baseline justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-1 font-display text-lg leading-tight">{product.name}</h3>
      </div>
      <p className="font-mono text-sm">{formatPrice(product.price_cents, product.currency)}</p>
    </div>
    {!product.in_stock && (
      <p className="mt-1 text-xs uppercase tracking-widest text-accent">Sold out</p>
    )}
  </Link>
);
