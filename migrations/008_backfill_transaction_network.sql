-- Backfill null network values to devnet
UPDATE transactions
SET network = 'devnet'
WHERE network IS NULL;

-- Ensure network is never null going forward
ALTER TABLE transactions 
ALTER COLUMN network SET DEFAULT 'devnet';

ALTER TABLE transactions 
ALTER COLUMN network SET NOT NULL;
