# Maison Atelier — Full-Stack E-Commerce (Custom Auth)

A high-end, secure e-commerce platform built with a fully custom authentication system, PostgreSQL, and React. No third-party auth providers — everything is engineered from scratch.

## Project Structure

```
├── backend/    → Node.js & Express API (JWT + OTP auth, rate limiting, PostgreSQL)
└── frontend/   → React + Vite frontend (premium UI, custom auth flow)
```

## Core Features

- **Custom Auth System** — JWT + Bcrypt.full control.
- **OTP Email Verification** — 6-digit codes with 10-minute expiry.
- **Dual-Layer Brute Force Protection** — IP rate limiting + DB-level account lockout.
- **Account Lockout** — Progressive penalties (15 min → 1 hr → 24 hr) after repeated failed logins.
- **OTP Attempt Tracking** — Codes are invalidated after 5 wrong attempts (stored in DB).
- **Resend Rate Limiting** — Max 2 OTP requests per 5 minutes per user.
- **Premium Design** — Modern, responsive UI with smooth transitions and glassmorphism.

## How to Run

### 1. Backend
```bash
cd backend
cp .env.example .env   # Fill in DATABASE_URL, SMTP details, JWT_SECRET
npm install
npm run migrate
npm run dev
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env   # Set VITE_API_BASE_URL=http://localhost:4000
npm install
npm run dev
```

## Security Overview

| Feature | Details |
|---|---|
| Password Hashing | Bcrypt with salt rounds = 10 |
| IP Rate Limiting | 5 requests / 15 min per IP (header spoofing bypass fixed) |
| Account Lockout | DB-persisted — immune to IP rotation and VPN bypass |
| OTP Brute Force | Codes invalidated after 5 wrong attempts |
| OTP Resend Abuse | Max 2 codes per 5 minutes per account |
| JWT Secret | 128-character cryptographically random hex |
| SQL Injection | 100% parameterized queries — injection impossible |
| HTTP Headers | Helmet package active against XSS, clickjacking, MIME sniffing |
| Secrets | All credentials in `.env` — never committed to git |

---

> **Developed by [Nafiz Sadik](https://nafizsadik.me/)**
