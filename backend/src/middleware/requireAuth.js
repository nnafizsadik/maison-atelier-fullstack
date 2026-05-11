import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";

/**
 * requireAuth — verifies Bearer JWT, attaches:
 *   req.auth = { userId }
 *   req.user = { id, email, full_name, is_verified }
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    // 2. Verify JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("▸ JWT_SECRET is not set in .env");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 3. Fetch user from database
    const { rows } = await query(
      "SELECT id, email, full_name, is_verified FROM users WHERE id = $1",
      [userId]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    // 4. Attach to request
    req.auth = { userId };
    req.user = user;
    
    next();
  } catch (err) {
    console.error("▸ Auth middleware error:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
