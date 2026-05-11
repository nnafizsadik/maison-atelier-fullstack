import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { sendVerificationEmail } from "../lib/email.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

// Rate limiters for specific actions
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: "Too many authentication attempts from this IP. Please try again after 15 minutes."
});

const verifyLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // More attempts for verification since it's just a 6-digit code entry
  message: "Too many verification attempts. Please wait 5 minutes."
});

const router = express.Router();

/**
 * Helper: Validate reputable email domains
 */
const ALLOWED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "protonmail.com",
  "proton.me",
  "icloud.com",
  "me.com",
];

const isValidDomain = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

/**
 * Helper: Generate 6-digit OTP
 */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * SIGNUP
 * POST /api/auth/signup
 */
router.post("/signup", authLimiter, async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!isValidDomain(email)) {
    return res.status(400).json({
      error: "Please use a reputable email provider (Gmail, Yahoo, Outlook, etc.) to prevent fake accounts."
    });
  }

  try {
    // 1. Check if user already exists
    const { rows: existingUsers } = await query(
      "SELECT id, is_verified FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      if (user.is_verified) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // 1.1 Rate Limit Check: Max 2 codes per 5 minutes
      const { rows: recentCodes } = await query(
        "SELECT count(*) FROM verification_codes WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'",
        [user.id]
      );

      if (parseInt(recentCodes[0].count) >= 2) {
        return res.status(429).json({
          error: "Too many attempts. Please wait 5 minutes before requesting a new code."
        });
      }

      // 1.2 Update existing unverified user
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        "UPDATE users SET password_hash = $1, full_name = $2, phone = $3 WHERE id = $4",
        [passwordHash, full_name, phone, user.id]
      );
    } else {
      // 2. Hash password and Create new user
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const { rows: newUsers } = await query(
        `INSERT INTO users (email, password_hash, full_name, phone, is_verified)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id, email`,
        [email, passwordHash, full_name, phone]
      );
      user = newUsers[0];
    }

    // 4. Generate and save verification code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Cleanup any existing codes for this user first
    await query("DELETE FROM verification_codes WHERE user_id = $1", [user.id]);

    await query(
      `INSERT INTO verification_codes (user_id, code, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, code, expiresAt.toISOString()]
    );

    // 5. Send verification email
    // Only log OTP in development — never in production!
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Verification code for ${email}: ${code}`);
    }

    try {
      await sendVerificationEmail(email, code);
    } catch (emailErr) {
      console.warn("▸ Email sending failed, but user was created. Check console for code.");
    }

    res.status(201).json({
      message: "Signup successful. Please check your email for the verification code.",
      userId: user.id
    });
  } catch (err) {
    console.error("▸ Signup error:", err.message);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

/**
 * VERIFY EMAIL
 * POST /api/auth/verify
 */
router.post("/verify", verifyLimiter, async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  try {
    // 1. Find user
    const { rows: users } = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];

    // 2. Find the most recent verification code (regardless of whether it's correct)
    const now = new Date().toISOString();
    const { rows: existingCodes } = await query(
      `SELECT id, code, attempts FROM verification_codes 
       WHERE user_id = $1 AND expires_at > $2
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, now]
    );

    if (existingCodes.length === 0) {
      return res.status(400).json({ error: "No active verification code found or it has expired." });
    }

    const activeCode = existingCodes[0];
    const MAX_ATTEMPTS = 5;

    // 3. Increment attempts first
    const { rows: updatedRows } = await query(
      "UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts",
      [activeCode.id]
    );
    const currentAttempts = updatedRows[0].attempts;

    // 4. Check if code matches
    if (activeCode.code !== code) {
      if (currentAttempts >= MAX_ATTEMPTS) {
        // Too many failed attempts, delete the code
        await query("DELETE FROM verification_codes WHERE id = $1", [activeCode.id]);
        return res.status(429).json({ 
          error: "Too many failed attempts. This verification code has been invalidated for security. Please request a new code." 
        });
      }
      
      return res.status(400).json({ 
        error: `Invalid verification code. You have ${MAX_ATTEMPTS - currentAttempts} attempts remaining.` 
      });
    }

    // 5. Code is correct - double check attempts anyway (security)
    if (currentAttempts > MAX_ATTEMPTS) {
       await query("DELETE FROM verification_codes WHERE id = $1", [activeCode.id]);
       return res.status(429).json({ error: "This code was already invalidated due to too many attempts." });
    }

    // 6. Mark user as verified
    await query(
      "UPDATE users SET is_verified = TRUE WHERE id = $1",
      [user.id]
    );

    // 7. Cleanup used codes
    await query("DELETE FROM verification_codes WHERE user_id = $1", [user.id]);

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("▸ Verification error:", err.message);
    res.status(500).json({ error: "Verification failed. Please check your code and try again." });
  }
});

/**
 * LOGIN
 * POST /api/auth/login
 *
 * SECURITY — Dual-layer brute force protection:
 *   Layer 1: IP-based rate limit (authLimiter) — 5 req / 15 min per IP
 *   Layer 2: DB-level account lockout — tracks failed attempts per user.
 *            Cannot be bypassed via IP rotation, VPN, or proxy.
 *
 *   Lockout schedule (per account):
 *     >= 5  failed attempts → locked for 15 minutes
 *     >= 10 failed attempts → locked for 1 hour
 *     >= 20 failed attempts → locked for 24 hours
 */
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 1. Find user — also fetch lockout columns
    const { rows: users } = await query(
      `SELECT id, email, password_hash, is_verified, is_admin,
              failed_login_attempts, locked_until
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    const user = users[0];

    // Generic error — prevents email enumeration attacks
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 2. Account lockout check (DB-level — unbypassable via IP rotation)
    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      const waitMs = new Date(user.locked_until) - now;
      const waitMinutes = Math.ceil(waitMs / 60000);
      return res.status(429).json({
        error: `Account temporarily locked due to too many failed login attempts. Try again in ${waitMinutes} minute(s).`
      });
    }

    // 3. Check password (bcrypt — timing-safe)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      // Increment failed attempt counter
      const newAttempts = (user.failed_login_attempts || 0) + 1;

      // Progressive lockout: more attempts = longer ban
      let lockedUntil = null;
      if (newAttempts >= 20) {
        lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      } else if (newAttempts >= 10) {
        lockedUntil = new Date(Date.now() + 60 * 60 * 1000);      // 1 hour
      } else if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);      // 15 minutes
      }

      await query(
        "UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3",
        [newAttempts, lockedUntil, user.id]
      );

      console.warn(
        `[SECURITY] Failed login attempt #${newAttempts} for ${email}` +
        (lockedUntil ? ` — account locked until ${lockedUntil.toISOString()}` : "")
      );

      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 4. Check verification status
    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email before logging in" });
    }

    // 5. Successful login — reset lockout counters
    await query(
      "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1",
      [user.id]
    );

    // 6. Generate JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, is_admin: user.is_admin }
    });
  } catch (err) {
    console.error("▸ Login error:", err.message);
    res.status(500).json({ error: "Login failed. Please check your credentials." });
  }
});


/**
 * FORGOT PASSWORD - Request Code
 * POST /api/auth/forgot-password
 */
router.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const { rows: users } = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND is_verified = TRUE",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "No verified account found with this email." });
    }
    const user = users[0];

    // Rate Limit Check: Max 2 codes per 5 minutes
    const { rows: recentCodes } = await query(
      "SELECT count(*) FROM verification_codes WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'",
      [user.id]
    );

    if (parseInt(recentCodes[0].count) >= 2) {
      return res.status(429).json({
        error: "Too many attempts. Please wait 5 minutes before requesting a new code."
      });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await query("DELETE FROM verification_codes WHERE user_id = $1", [user.id]);
    await query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [user.id, code, expiresAt.toISOString()]
    );

    // Only log reset OTP in development — never in production!
    if (process.env.NODE_ENV !== "production") {
      console.log(`[RESET] Code for ${email}: ${code}`);
    }
    try {
      await sendVerificationEmail(email, code); // Reusing the same email template for simplicity
    } catch (e) { }

    res.json({ message: "Reset code sent to your email." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * RESET PASSWORD
 * POST /api/auth/reset-password
 */
router.post("/reset-password", authLimiter, async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code, and new password are required" });
  }

  try {
    const { rows: users } = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const user = users[0];

    const now = new Date().toISOString();
    
    // First, find the active code regardless of whether the provided code matches
    const { rows: existingCodes } = await query(
      `SELECT id, code, attempts FROM verification_codes 
       WHERE user_id = $1 AND expires_at > $2
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, now]
    );

    if (existingCodes.length === 0) {
      return res.status(400).json({ error: "No active verification code found or it has expired." });
    }

    const activeCode = existingCodes[0];
    const MAX_ATTEMPTS = 5;

    // Increment attempts first
    const { rows: updatedRows } = await query(
      "UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts",
      [activeCode.id]
    );
    const currentAttempts = updatedRows[0].attempts;

    // Check if code matches
    if (activeCode.code !== code) {
      if (currentAttempts >= MAX_ATTEMPTS) {
        // Too many failed attempts, delete the code
        await query("DELETE FROM verification_codes WHERE id = $1", [activeCode.id]);
        return res.status(429).json({ 
          error: "Too many failed attempts. This reset code has been invalidated for security. Please request a new code." 
        });
      }
      
      return res.status(400).json({ 
        error: `Invalid reset code. You have ${MAX_ATTEMPTS - currentAttempts} attempts remaining.` 
      });
    }

    // Code is correct - double check attempts anyway (security)
    if (currentAttempts > MAX_ATTEMPTS) {
       await query("DELETE FROM verification_codes WHERE id = $1", [activeCode.id]);
       return res.status(429).json({ error: "This code was already invalidated due to too many attempts." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Update password and reset any lockouts
    await query(
      "UPDATE users SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL WHERE id = $2", 
      [passwordHash, user.id]
    );
    await query("DELETE FROM verification_codes WHERE user_id = $1", [user.id]);

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as authRouter };
