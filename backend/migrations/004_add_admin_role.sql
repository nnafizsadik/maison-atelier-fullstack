-- Migration: Add is_admin column to users
-- 004_add_admin_role.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Tip: To make yourself an admin, run this in your DB:
-- UPDATE users SET is_admin = TRUE WHERE email = 'your-email@gmail.com';
