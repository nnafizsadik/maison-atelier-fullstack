import { Header } from "./Header";
import { Footer } from "./Footer";
import type { ReactNode } from "react";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
