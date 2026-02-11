-- Fix agent_decisions FK constraint
-- Change from transactions(signature) to transactions(id)

-- Drop old constraint
ALTER TABLE agent_decisions 
DROP CONSTRAINT IF EXISTS agent_decisions_transaction_id_fkey;

-- Change column type to UUID to match transactions.id
ALTER TABLE agent_decisions 
ALTER COLUMN transaction_id TYPE UUID USING transaction_id::uuid;

-- Add correct FK constraint
ALTER TABLE agent_decisions 
ADD CONSTRAINT agent_decisions_transaction_id_fkey 
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;

-- Add comment
COMMENT ON COLUMN agent_decisions.transaction_id IS 'References transactions.id (UUID), not signature';
