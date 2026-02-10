-- Agent Decisions Table
-- Tracks all AI agent decisions for learning and audit trail

CREATE TABLE IF NOT EXISTS agent_decisions (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  decision_type TEXT NOT NULL, -- 'conversion_timing', 'fraud_detection', 'pricing_strategy', etc.
  decision TEXT NOT NULL, -- 'convert_now', 'wait', 'monitor', etc.
  confidence DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
  reasoning TEXT NOT NULL,
  context JSONB, -- Full context used for decision
  wait_duration INTEGER, -- minutes (if applicable)
  target_price DECIMAL(10, 2), -- USD (if applicable)
  estimated_usd_value DECIMAL(10, 2),
  actual_usd_value DECIMAL(10, 2), -- Filled in after conversion
  outcome TEXT, -- 'success', 'suboptimal', 'poor' (for learning)
  outcome_reasoning TEXT, -- Why outcome was classified as such
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP, -- When decision was actually executed
  
  -- Foreign keys
  FOREIGN KEY (transaction_id) REFERENCES transactions(signature) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_decisions_transaction ON agent_decisions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_merchant ON agent_decisions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_type ON agent_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON agent_decisions(created_at DESC);

-- Agent Learning Table
-- Stores insights learned from past decisions
CREATE TABLE IF NOT EXISTS agent_learnings (
  id SERIAL PRIMARY KEY,
  learning_type TEXT NOT NULL, -- 'conversion_timing', 'risk_assessment', etc.
  insight TEXT NOT NULL, -- What the agent learned
  confidence DECIMAL(3, 2) NOT NULL, -- How confident in this learning
  supporting_decisions INTEGER[], -- Array of decision IDs that support this
  merchant_id TEXT, -- If learning is merchant-specific
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_validated TIMESTAMP, -- When this learning was last confirmed
  times_applied INTEGER DEFAULT 0, -- How many times this learning has been used
  success_rate DECIMAL(3, 2) -- Success rate when applied (0.00 to 1.00)
);

CREATE INDEX IF NOT EXISTS idx_agent_learnings_type ON agent_learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_merchant ON agent_learnings(merchant_id);

COMMENT ON TABLE agent_decisions IS 'Audit trail of all AI agent decisions for transparency and learning';
COMMENT ON TABLE agent_learnings IS 'Accumulated knowledge from past agent decisions';
