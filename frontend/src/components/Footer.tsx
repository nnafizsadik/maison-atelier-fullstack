export const Footer = () => (
  <footer className="mt-24 border-t border-border bg-secondary/50">
    <div className="container grid gap-8 py-12 md:grid-cols-4">
      <div className="md:col-span-2">
        <p className="font-display text-2xl font-semibold">Maison Atelier</p>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Considered goods made by independent ateliers. Built to age, designed
          to be used every day.
        </p>
      </div>
      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Shop</p>
        <ul className="space-y-2 text-sm">
          <li>Apparel</li>
          <li>Home</li>
          <li>Accessories</li>
          <li>Stationery</li>
        </ul>
      </div>
      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Company</p>
        <ul className="space-y-2 text-sm">
          <li>About</li>
          <li>Journal</li>
          <li>Contact</li>
          <li>Returns</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Maison Atelier — All rights reserved.</p>
        <p className="font-mono">Made with care · Shipped worldwide</p>
      </div>
    </div>
  </footer>
);
