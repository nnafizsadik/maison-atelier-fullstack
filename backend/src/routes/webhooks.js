import express from "express";
import { Webhook } from "svix";
import { query } from "../db/pool.js";

const router = express.Router();

/**
 * Clerk Webhook Handler
 * POST /api/webhooks/clerk
 */
router.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }), // We need the raw body for signature verification
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error("▸ Webhook error: CLERK_WEBHOOK_SECRET is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Get the headers
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: "Missing svix headers" });
    }

    // Get the body
    const payload = req.body.toString();
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("▸ Webhook verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle the event
    const { id: clerk_id } = evt.data;
    const eventType = evt.type;

    console.log(`▸ Clerk Webhook: ${eventType} (${clerk_id})`);

    try {
      if (eventType === "user.created" || eventType === "user.updated") {
        const { email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses?.[0]?.email_address || null;
        const full_name = [first_name, last_name].filter(Boolean).join(" ") || null;

        await query(
          `INSERT INTO users (clerk_id, email, full_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (clerk_id) DO UPDATE SET
             email = EXCLUDED.email,
             full_name = EXCLUDED.full_name,
             updated_at = NOW()`,
          [clerk_id, email, full_name],
        );
        console.log(`  ✓ User ${clerk_id} synced to DB`);
      }

      if (eventType === "user.deleted") {
        await query("DELETE FROM users WHERE clerk_id = $1", [clerk_id]);
        console.log(`  ✓ User ${clerk_id} deleted from DB`);
      }

      return res.status(200).json({ success: true });
    } catch (dbErr) {
      console.error("▸ Webhook DB sync error:", dbErr.message);
      return res.status(500).json({ error: "Database sync failed" });
    }
  },
);

export { router as webhooksRouter };
