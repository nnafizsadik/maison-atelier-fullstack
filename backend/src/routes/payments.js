import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const paymentsRouter = Router();

/**
 * STUB IMPLEMENTATION
 * In production, replace `/payment/initiate` with a call to Stripe / Razorpay
 * to create a PaymentIntent / Order, return its client_secret / order_id, and
 * then `/payment/verify` should validate the gateway's webhook or signature.
 */

paymentsRouter.post("/payment/initiate", requireAuth, async (req, res) => {
  const { order_id } = req.body || {};
  if (!order_id) return res.status(400).json({ error: "order_id required" });

  const { rows: orderRows } = await query(
    `SELECT id, total_cents, currency FROM orders
     WHERE id = $1 AND user_id = $2`,
    [order_id, req.user.id],
  );
  const order = orderRows[0];
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { rows } = await query(
    `INSERT INTO payments (order_id, user_id, provider, amount_cents, currency, status)
     VALUES ($1, $2, 'stub', $3, $4, 'pending')
     RETURNING id`,
    [order.id, req.user.id, order.total_cents, order.currency],
  );

  res.json({
    payment_id: rows[0].id,
    // In real Stripe flow you'd return: client_secret, publishable_key, etc.
    provider: "stub",
    amount_cents: order.total_cents,
    currency: order.currency,
  });
});

paymentsRouter.post("/payment/verify", requireAuth, async (req, res) => {
  const { payment_id, order_id } = req.body || {};
  if (!payment_id || !order_id)
    return res.status(400).json({ error: "payment_id and order_id required" });

  // STUB: in real flow, verify signature/webhook from gateway here.
  await query(
    `UPDATE payments SET status = 'succeeded', provider_ref = $1
     WHERE id = $2 AND user_id = $3`,
    [`stub_${Date.now()}`, payment_id, req.user.id],
  );
  await query(
    `UPDATE orders SET status = 'paid'
     WHERE id = $1 AND user_id = $2`,
    [order_id, req.user.id],
  );

  res.json({ ok: true, order_id, payment_id, status: "paid" });
});
