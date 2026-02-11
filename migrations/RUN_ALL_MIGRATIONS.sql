-- ========================================
-- COMBINED MIGRATIONS 006 + 007 + 008
-- Run this ONCE in Supabase SQL Editor
-- ========================================

-- MIGRATION 006: Add network support
-- ------------------------------------
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);
CREATE INDEX IF NOT EXISTS idx_merchants_network ON merchants(network);
CREATE INDEX IF NOT EXISTS idx_conversions_network ON conversions(network);

UPDATE merchants SET network = 'devnet' WHERE network IS NULL;
UPDATE transactions SET network = 'devnet' WHERE network IS NULL;
UPDATE conversions SET network = 'devnet' WHERE network IS NULL;
UPDATE payment_requests SET network = 'devnet' WHERE network IS NULL;

-- Add check constraints (will fail silently if already exist)
DO $$ 
BEGIN
    ALTER TABLE merchants ADD CONSTRAINT check_merchant_network CHECK (network IN ('mainnet', 'devnet'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE transactions ADD CONSTRAINT check_transaction_network CHECK (network IN ('mainnet', 'devnet'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE conversions ADD CONSTRAINT check_conversion_network CHECK (network IN ('mainnet', 'devnet'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE payment_requests ADD CONSTRAINT check_payment_request_network CHECK (network IN ('mainnet', 'devnet'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- MIGRATION 007: Fix agent_decisions FK constraint
-- --------------------------------------------------
ALTER TABLE agent_decisions DROP CONSTRAINT IF EXISTS agent_decisions_transaction_id_fkey;

-- Change column type to UUID (will fail if already UUID - that's ok)
DO $$
BEGIN
    ALTER TABLE agent_decisions ALTER COLUMN transaction_id TYPE UUID USING transaction_id::uuid;
EXCEPTION WHEN OTHERS THEN
    -- Already UUID, skip
    NULL;
END $$;

-- Add correct FK constraint
ALTER TABLE agent_decisions 
ADD CONSTRAINT agent_decisions_transaction_id_fkey 
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;

-- MIGRATION 008: Ensure network is always set
-- --------------------------------------------
ALTER TABLE transactions ALTER COLUMN network SET DEFAULT 'devnet';
ALTER TABLE transactions ALTER COLUMN network SET NOT NULL;

-- ========================================
-- DONE! All migrations applied.
-- ========================================
