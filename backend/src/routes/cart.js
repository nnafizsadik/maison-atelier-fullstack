import { Router } from "express";
import { query, pool } from "../db/pool.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const cartRouter = Router();

const PRODUCT_COLS = `id, slug, name, description, price_cents, currency, image_url, category, in_stock`;

const getOrCreateCart = async (userId) => {
  let { rows } = await query("SELECT id FROM cart WHERE user_id = $1", [userId]);
  if (rows[0]) return rows[0].id;
  const ins = await query(
    "INSERT INTO cart (user_id) VALUES ($1) RETURNING id",
    [userId],
  );
  return ins.rows[0].id;
};

const loadCart = async (userId) => {
  const cartId = await getOrCreateCart(userId);
  const { rows } = await query(
    `SELECT ci.id, ci.product_id, ci.quantity,
            row_to_json(p) AS product
     FROM cart_items ci
     JOIN (SELECT ${PRODUCT_COLS} FROM products) p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId],
  );
  const items = rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    quantity: r.quantity,
    product: r.product,
  }));
  const subtotal = items.reduce(
    (s, i) => s + i.product.price_cents * i.quantity,
    0,
  );
  return {
    id: cartId,
    items,
    subtotal_cents: subtotal,
    currency: items[0]?.product.currency ?? "USD",
  };
};

cartRouter.get("/cart", requireAuth, async (req, res) => {
  res.json(await loadCart(req.user.id));
});

cartRouter.post("/cart/add", requireAuth, async (req, res) => {
  const { product_id, quantity = 1 } = req.body || {};
  if (!product_id || quantity < 1)
    return res.status(400).json({ error: "product_id and positive quantity required" });

  const cartId = await getOrCreateCart(req.user.id);
  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [cartId, product_id, quantity],
  );
  res.json(await loadCart(req.user.id));
});

cartRouter.put("/cart/update", requireAuth, async (req, res) => {
  const { item_id, quantity } = req.body || {};
  if (!item_id || typeof quantity !== "number")
    return res.status(400).json({ error: "item_id and quantity required" });

  if (quantity <= 0) {
    await query(
      `DELETE FROM cart_items ci USING cart c
       WHERE ci.id = $1 AND ci.cart_id = c.id AND c.user_id = $2`,
      [item_id, req.user.id],
    );
  } else {
    await query(
      `UPDATE cart_items ci SET quantity = $1
       FROM cart c
       WHERE ci.id = $2 AND ci.cart_id = c.id AND c.user_id = $3`,
      [quantity, item_id, req.user.id],
    );
  }
  res.json(await loadCart(req.user.id));
});

cartRouter.delete("/cart/remove", requireAuth, async (req, res) => {
  const itemId = req.query.item_id;
  if (!itemId) return res.status(400).json({ error: "item_id required" });
  await query(
    `DELETE FROM cart_items ci USING cart c
     WHERE ci.id = $1 AND ci.cart_id = c.id AND c.user_id = $2`,
    [itemId, req.user.id],
  );
  res.json(await loadCart(req.user.id));
});

export { loadCart };
