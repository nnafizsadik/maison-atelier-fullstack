-- Migration: Add DB-level login brute force protection (account lockout)
-- 006_add_login_lockout.sql
-- 
-- Tracks failed login attempts per user in the database.
-- This is unbypassable via IP rotation because it is tied to the email/account.

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;
