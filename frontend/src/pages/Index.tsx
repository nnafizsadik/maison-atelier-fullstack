import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { Link } from "react-router-dom";
import hero from "@/assets/hero.jpg";

const Index = () => {
  const { products } = useProducts();

  return (
    <Layout>
      {/* Hero */}
      <section className="container grid gap-10 pt-12 pb-20 md:grid-cols-2 md:items-center md:pt-20">
        <div className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            Spring Edition · 2026
          </p>
          <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Considered goods,<br />
            <span className="italic text-accent">made to last.</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground md:text-lg">
            A small, deliberate catalog from independent ateliers across Europe.
            No seasonal churn — just objects we believe in.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg" className="rounded-none">
              <Link to="#shop">Shop the edition</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none">
              <Link to="/about">Our story</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <img
            src={hero}
            alt="Linen draped over a wooden stool with a ceramic vase"
            width={1600}
            height={1200}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute -bottom-4 -left-4 hidden bg-background px-4 py-3 font-mono text-xs uppercase tracking-widest md:block">
            №1 — The Atelier Set
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="shop" className="container py-16">
        <div className="mb-10 flex items-end justify-between border-b border-border pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              The Catalog
            </p>
            <h2 className="mt-2 font-display text-4xl">All goods</h2>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            {products.length} pieces · Free shipping over $200
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Values strip */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container grid gap-8 py-16 md:grid-cols-3">
          {[
            { t: "Small batches", d: "Made in runs of fifty or fewer, by makers we know personally." },
            { t: "Repair, don't replace", d: "Free repairs on any leather or wool good, for the life of the object." },
            { t: "Honest pricing", d: "We list cost-of-goods on every product page. No magic markups." },
          ].map((v) => (
            <div key={v.t}>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                ··
              </p>
              <h3 className="mt-3 font-display text-2xl">{v.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
