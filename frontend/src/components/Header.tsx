import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { cart } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-sm tracking-wide uppercase transition-colors hover:text-accent",
      isActive ? "text-foreground" : "text-muted-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight">
          Maison <span className="text-accent">Atelier</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          <NavLink to="/" end className={navClass}>Shop</NavLink>
          <NavLink to="/about" className={navClass}>About</NavLink>
          <NavLink to="/orders" className={navClass}>Orders</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/sign-in">Sign in</Link>
            </Button>
          ) : (
            <Button onClick={logout} variant="ghost" size="sm">
              Sign out
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
