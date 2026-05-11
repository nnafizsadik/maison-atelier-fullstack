import "dotenv/config";
import { pool } from "./pool.js";

const products = [
  ["linen-henley",     "Linen Henley",            "A relaxed everyday shirt cut from washed European linen. Mother-of-pearl buttons, French seams.", 11800, "Apparel",    true],
  ["terracotta-mug",   "Terracotta Mug",          "Hand-thrown stoneware with a soft matte glaze. Holds 12 oz.",                                       3800,  "Home",       true],
  ["everyday-tote",    "Everyday Tote",           "Vegetable-tanned full-grain leather. Roomy enough for a laptop.",                                   24500, "Accessories",true],
  ["speckled-bowl",    "Speckled Bowl",           "A generous breakfast bowl with a tactile speckled glaze.",                                          4200,  "Home",       true],
  ["amber-candle",     "Amber Soy Candle",        "Soy wax with cedar, smoked vetiver and a whisper of orange peel. 60-hour burn.",                   3200,  "Home",       true],
  ["wool-throw",       "Heavyweight Wool Throw",  "Woven in Portugal from undyed merino with a single charcoal stripe.",                              18500, "Home",       true],
  ["leather-notebook", "Leather Pocket Notebook", "Refillable leather cover with a brass mechanical pencil.",                                          6800,  "Stationery", true],
  ["penny-loafers",    "Penny Loafers",           "Hand-lasted in Spain from full-grain calfskin. Leather sole, beeswax-finished.",                   32000, "Apparel",    false],
];

const run = async () => {
  for (const [slug, name, description, price_cents, category, in_stock] of products) {
    await pool.query(
      `INSERT INTO products (slug, name, description, price_cents, category, in_stock, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price_cents = EXCLUDED.price_cents,
         category = EXCLUDED.category,
         in_stock = EXCLUDED.in_stock`,
      [slug, name, description, price_cents, category, in_stock, `https://placehold.co/800x1000?text=${encodeURIComponent(name)}`],
    );
    console.log(`▸ seeded ${slug}`);
  }
  await pool.end();
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
