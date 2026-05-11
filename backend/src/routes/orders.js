import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const ordersRouter = Router();

/**
 * USER: Get my own orders
 * GET /orders
 */
ordersRouter.get("/orders", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT o.id, o.status, o.total_cents, o.currency, o.created_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'name', p.name,
                    'quantity', oi.quantity,
                    'price_cents', oi.price_cents
                  )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: Get all orders
 * GET /admin/orders
 */
ordersRouter.get("/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT o.id, o.status, o.total_cents, o.currency, o.created_at,
             u.email, u.full_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'name', p.name,
                   'quantity', oi.quantity,
                   'price_cents', oi.price_cents
                 )
               ) FILTER (WHERE oi.id IS NOT NULL),
               '[]'
             ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id, u.email, u.full_name
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: Update order status
 * PUT /admin/orders/:id/status
 */
ordersRouter.put("/admin/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
