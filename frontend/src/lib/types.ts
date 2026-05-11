export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string;
  category: string;
  in_stock: boolean;
};

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  items: CartItem[];
  subtotal_cents: number;
  currency: string;
};

export type Order = {
  id: string;
  total_cents: number;
  currency: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  created_at: string;
  items: Array<{
    id: string;
    product_id: string;
    name: string;
    quantity: number;
    unit_price_cents: number;
  }>;
};

export type Me = {
  id: string;
  email: string | null;
  full_name: string | null;
};
