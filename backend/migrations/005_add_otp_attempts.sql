-- Migration: Add attempts counter to verification_codes to prevent brute force
-- 005_add_otp_attempts.sql

ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
