import { query } from "../db/pool.js";

export const requireAdmin = async (req, res, next) => {
  // 1. Check if user is authenticated (passed through requireAuth)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 2. Check is_admin status in database
    const { rows } = await query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (rows.length === 0 || !rows[0].is_admin) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
