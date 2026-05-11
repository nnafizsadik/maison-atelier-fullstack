-- Migration: Add phone column and password reset support
-- 003_add_phone_and_reset.sql

-- 1. Add phone column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Add reset_token and reset_expires to users for forgot password flow
-- We can reuse the verification_codes table for OTPs, 
-- but adding a dedicated reset column is often cleaner.
-- However, to keep it simple, we will use verification_codes for both.
