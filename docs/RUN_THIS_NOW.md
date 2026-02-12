# 🚨 RUN THIS NOW TO FIX AGENT DECISIONS

## Go to Supabase SQL Editor:
**https://supabase.com/dashboard/project/unghlsaqdxmjhfpyurkl/sql/new**

## Copy and paste this entire SQL block:

```sql
-- Add network column to all tables
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

-- Backfill existing rows
UPDATE merchants SET network = 'devnet' WHERE network IS NULL;
UPDATE transactions SET network = 'devnet' WHERE network IS NULL;
UPDATE conversions SET network = 'devnet' WHERE network IS NULL;
UPDATE payment_requests SET network = 'devnet' WHERE network IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);
CREATE INDEX IF NOT EXISTS idx_merchants_network ON merchants(network);
CREATE INDEX IF NOT EXISTS idx_conversions_network ON conversions(network);

-- Fix agent_decisions FK constraint
ALTER TABLE agent_decisions DROP CONSTRAINT IF EXISTS agent_decisions_transaction_id_fkey;
ALTER TABLE agent_decisions ALTER COLUMN transaction_id TYPE UUID USING transaction_id::uuid;
ALTER TABLE agent_decisions ADD CONSTRAINT agent_decisions_transaction_id_fkey 
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;

-- Make network required going forward
ALTER TABLE transactions ALTER COLUMN network SET DEFAULT 'devnet';
ALTER TABLE transactions ALTER COLUMN network SET NOT NULL;
```

## Click "Run" button

## Then refresh your merchant dashboard

Agent Intelligence should now show decisions > 0! 🎉
