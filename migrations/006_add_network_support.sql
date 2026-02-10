-- Add network support for mainnet/devnet
-- Run this in Supabase SQL Editor

-- Add network column to merchants (default devnet for existing)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

-- Add network column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

-- Add network column to conversions
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

-- Add network column to payment_requests
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

-- Create indexes for network filtering
CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);
CREATE INDEX IF NOT EXISTS idx_merchants_network ON merchants(network);
CREATE INDEX IF NOT EXISTS idx_conversions_network ON conversions(network);

-- Update existing data to devnet
UPDATE merchants SET network = 'devnet' WHERE network IS NULL;
UPDATE transactions SET network = 'devnet' WHERE network IS NULL;
UPDATE conversions SET network = 'devnet' WHERE network IS NULL;
UPDATE payment_requests SET network = 'devnet' WHERE network IS NULL;

-- Add check constraint for valid networks
ALTER TABLE merchants ADD CONSTRAINT check_merchant_network CHECK (network IN ('mainnet', 'devnet'));
ALTER TABLE transactions ADD CONSTRAINT check_transaction_network CHECK (network IN ('mainnet', 'devnet'));
ALTER TABLE conversions ADD CONSTRAINT check_conversion_network CHECK (network IN ('mainnet', 'devnet'));
ALTER TABLE payment_requests ADD CONSTRAINT check_payment_request_network CHECK (network IN ('mainnet', 'devnet'));
