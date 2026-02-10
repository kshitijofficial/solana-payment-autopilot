-- Add risk_profile column to merchants table

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS risk_profile TEXT DEFAULT 'conservative' CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive'));

COMMENT ON COLUMN merchants.risk_profile IS 'Merchant risk tolerance for AI agent decision-making: conservative (minimize volatility), moderate (balanced), aggressive (maximize gains)';

-- Update existing merchants to have explicit risk profile
UPDATE merchants 
SET risk_profile = 'conservative' 
WHERE risk_profile IS NULL;
