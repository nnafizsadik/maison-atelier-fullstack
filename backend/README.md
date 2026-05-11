# Maison Atelier — Backend

Node.js + Express + PostgreSQL backend for the Maison Atelier storefront with a fully custom authentication system.

## Key Features

- **Custom Auth System** — JWT + Bcrypt (no third-party auth providers like Clerk).
- **OTP Email Verification** — Secure 6-digit codes with 10-minute expiry.
- **Dual-Layer Brute Force Protection**
  - **Layer 1 — IP Rate Limiting:** 5 requests per 15 minutes per IP.
  - **Layer 2 — DB Account Lockout:** Tracks failed login attempts per user in the database. Immune to IP rotation, VPN, and proxy bypass since it is tied to the account/email.
- **Progressive Lockout Schedule:**
  - ≥ 5 failed attempts → locked for **15 minutes**
  - ≥ 10 failed attempts → locked for **1 hour**
  - ≥ 20 failed attempts → locked for **24 hours**
- **OTP Attempt Tracking** — Verification codes are invalidated after 5 wrong guesses.
- **OTP Resend Rate Limiting** — Max 2 code requests per 5 minutes per account (DB-tracked).
- **Header Spoofing Fix** — `x-forwarded-for` fallback removed from rate limiter; `req.ip` is used exclusively (safe with `trust proxy: 1`).
- **Strong JWT Secret** — 128-character cryptographically random hex key.
- **SQL Injection Proof** — 100% parameterized queries throughout.

## Architecture

```
Frontend (Vite)  ──► Express API ──► PostgreSQL
                          ▲
                          │
                  Custom JWT Auth
                  IP Rate Limiter
                  DB Account Lockout
```

## Auth Endpoints

| Method | Path | Rate Limited | Description |
|--------|------|-------------|-------------|
| POST | `/api/auth/signup` | Yes: IP (5/15min) | Create user & send OTP |
| POST | `/api/auth/verify` | Yes: IP (10/5min) + DB (5 attempts) | Verify email with OTP |
| POST | `/api/auth/login` | Yes: IP (5/15min) + DB lockout | Authenticate & get JWT |
| POST | `/api/auth/forgot-password` | Yes: IP (5/15min) + DB (2/5min) | Request password reset code |
| POST | `/api/auth/reset-password` | Yes: IP (5/15min) | Reset password with code |
| GET  | `/api/me` | Yes: JWT required | Get current user profile |

## Shop Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | no | Health check |
| GET | `/api/products` | no | List all products |
| GET | `/api/products/:id` | no | Get product details |
| GET | `/api/cart` | yes | Get user's cart |
| POST | `/api/cart/add` | yes | Add to cart |
| POST | `/api/orders` | yes | Place order |

## Run Locally

```bash
cp .env.example .env   # Fill in DATABASE_URL, SMTP credentials, JWT_SECRET
npm install
npm run migrate        # Apply all database migrations
npm run seed           # (Optional) Seed demo products
npm run dev
```

Server runs on `http://localhost:4000`.  
Set `VITE_API_BASE_URL=http://localhost:4000` in the frontend `.env`.

## Database Migrations

| File | Description |
|------|-------------|
| `001_init.sql` | Base schema (users, products, orders, cart) |
| `002_custom_auth.sql` | OTP verification_codes table |
| `003_add_phone_and_reset.sql` | Phone & password reset support |
| `004_add_admin_role.sql` | Admin role column |
| `005_add_otp_attempts.sql` | OTP attempt counter |
| `006_add_login_lockout.sql` | DB-level login brute force lockout |

## Security Checklist

- [x] Passwords hashed with Bcrypt (saltRounds: 10)
- [x] JWT signed with 128-char random secret
- [x] `.env` excluded from git — never committed
- [x] Dual-layer brute force protection on login
- [x] OTP invalidated after 5 wrong attempts
- [x] OTP resend capped at 2 per 5 minutes
- [x] `x-forwarded-for` spoofing bypass closed
- [x] SQL injection impossible (parameterized queries)
- [x] CORS whitelist configured
- [x] Helmet HTTP headers (anti-XSS, clickjacking) added
- [x] Debug endpoints dev-only (`/db-test`)

---

> **Developed by [Nafiz Sadik](https://nafizsadik.me/)**
