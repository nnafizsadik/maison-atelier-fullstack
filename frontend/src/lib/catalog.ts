import shirt from "@/assets/p-shirt.jpg";
import mug from "@/assets/p-mug.jpg";
import tote from "@/assets/p-tote.jpg";
import bowl from "@/assets/p-bowl.jpg";
import candle from "@/assets/p-candle.jpg";
import throwBlanket from "@/assets/p-throw.jpg";
import notebook from "@/assets/p-notebook.jpg";
import loafers from "@/assets/p-loafers.jpg";
import type { Product } from "./types";

// Local fallback catalog. The backend `/products` endpoint should return the
// canonical list — this is used only when the API is unreachable so the UI
// remains explorable in development.
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "p_shirt",
    slug: "linen-henley",
    name: "Linen Henley",
    description:
      "A relaxed everyday shirt cut from washed European linen. Mother-of-pearl buttons, French seams, garment-dyed in small batches.",
    price_cents: 11800,
    currency: "USD",
    image_url: shirt,
    category: "Apparel",
    in_stock: true,
  },
  {
    id: "p_mug",
    slug: "terracotta-mug",
    name: "Terracotta Mug",
    description:
      "Hand-thrown stoneware with a soft matte glaze. Holds 12 oz. Each piece is unique — small variations are part of the craft.",
    price_cents: 3800,
    currency: "USD",
    image_url: mug,
    category: "Home",
    in_stock: true,
  },
  {
    id: "p_tote",
    slug: "everyday-tote",
    name: "Everyday Tote",
    description:
      "Vegetable-tanned full-grain leather. Roomy enough for a laptop, soft enough to mold to your shoulder over time.",
    price_cents: 24500,
    currency: "USD",
    image_url: tote,
    category: "Accessories",
    in_stock: true,
  },
  {
    id: "p_bowl",
    slug: "speckled-bowl",
    name: "Speckled Bowl",
    description:
      "A generous breakfast bowl with a tactile speckled glaze. Dishwasher and microwave safe.",
    price_cents: 4200,
    currency: "USD",
    image_url: bowl,
    category: "Home",
    in_stock: true,
  },
  {
    id: "p_candle",
    slug: "amber-candle",
    name: "Amber Soy Candle",
    description:
      "Soy wax with cedar, smoked vetiver and a whisper of orange peel. 60-hour burn in a refillable amber jar.",
    price_cents: 3200,
    currency: "USD",
    image_url: candle,
    category: "Home",
    in_stock: true,
  },
  {
    id: "p_throw",
    slug: "wool-throw",
    name: "Heavyweight Wool Throw",
    description:
      "Woven in Portugal from undyed merino with a single charcoal stripe. Substantial enough for a winter sofa.",
    price_cents: 18500,
    currency: "USD",
    image_url: throwBlanket,
    category: "Home",
    in_stock: true,
  },
  {
    id: "p_notebook",
    slug: "leather-notebook",
    name: "Leather Pocket Notebook",
    description:
      "Refillable leather cover with a brass mechanical pencil. Patinas beautifully with daily use.",
    price_cents: 6800,
    currency: "USD",
    image_url: notebook,
    category: "Stationery",
    in_stock: true,
  },
  {
    id: "p_loafers",
    slug: "penny-loafers",
    name: "Penny Loafers",
    description:
      "Hand-lasted in Spain from full-grain calfskin. Leather sole, beeswax-finished. True to size.",
    price_cents: 32000,
    currency: "USD",
    image_url: loafers,
    category: "Apparel",
    in_stock: false,
  },
];
