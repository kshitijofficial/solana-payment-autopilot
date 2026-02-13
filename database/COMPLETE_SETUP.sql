-- ========================================================================
-- SOLANA PAYMENT AUTOPILOT - COMPLETE DATABASE SETUP
-- ========================================================================
-- Copy-paste this ENTIRE file into Supabase SQL Editor and click "RUN"
-- This will create all tables, indexes, and triggers needed for the platform
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================
-- CORE TABLES
-- ========================================================================

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    notification_email VARCHAR(255),
    auto_convert_enabled BOOLEAN DEFAULT true,
    risk_profile TEXT DEFAULT 'conservative' CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
    network VARCHAR(10) DEFAULT 'devnet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_merchant_network CHECK (network IN ('mainnet', 'devnet'))
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    signature VARCHAR(88) NOT NULL UNIQUE,
    from_address VARCHAR(44) NOT NULL,
    to_address VARCHAR(44) NOT NULL,
    amount DECIMAL(20, 9) NOT NULL,
    token VARCHAR(10) NOT NULL, -- 'SOL', 'USDC', etc.
    usd_value DECIMAL(12, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
    confirmations INTEGER DEFAULT 0,
    block_time TIMESTAMP WITH TIME ZONE,
    network VARCHAR(10) DEFAULT 'devnet' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_transaction_network CHECK (network IN ('mainnet', 'devnet'))
);

-- Conversions table (for SOL -> USDC swaps)
CREATE TABLE IF NOT EXISTS conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    from_token VARCHAR(10) NOT NULL,
    to_token VARCHAR(10) NOT NULL,
    from_amount DECIMAL(20, 9) NOT NULL,
    to_amount DECIMAL(20, 9) NOT NULL,
    swap_signature VARCHAR(88) NOT NULL UNIQUE,
    jupiter_route_plan JSONB,
    slippage_bps INTEGER DEFAULT 100,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
    error_message TEXT,
    network VARCHAR(10) DEFAULT 'devnet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_conversion_network CHECK (network IN ('mainnet', 'devnet'))
);

-- Wallets table (encrypted storage for merchant keys)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    public_key VARCHAR(44) NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    encryption_method VARCHAR(50) DEFAULT 'aes-256-gcm',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (log of sent notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'payment_received', 'conversion_completed', etc.
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'webhook'
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Requests table (for hosted checkout and SDK integration)
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_id VARCHAR(50) NOT NULL UNIQUE, -- pr_abc123 (human-readable ID)
    amount_usd DECIMAL(12, 2) NOT NULL,
    amount_sol DECIMAL(20, 9) NOT NULL, -- Calculated at creation time
    order_id VARCHAR(255), -- Merchant's order reference
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    description TEXT,
    callback_url TEXT, -- Webhook URL to notify merchant
    metadata JSONB, -- Flexible field for merchant's custom data
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, expired, failed
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL, -- Linked when paid
    payment_url TEXT, -- Full URL to hosted checkout page
    qr_code_data TEXT, -- Base64 QR code image
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Default: 15 minutes from creation
    paid_at TIMESTAMP WITH TIME ZONE,
    network VARCHAR(10) DEFAULT 'devnet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_payment_request_network CHECK (network IN ('mainnet', 'devnet'))
);

-- ========================================================================
-- AI AGENT TABLES
-- ========================================================================

-- Agent Decisions Table (tracks all AI agent decisions for audit trail)
CREATE TABLE IF NOT EXISTS agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL, -- 'conversion_timing', 'fraud_detection', 'pricing_strategy', etc.
    decision TEXT NOT NULL, -- 'convert_now', 'wait', 'monitor', etc.
    confidence DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00 (percentage)
    reasoning TEXT NOT NULL,
    context JSONB, -- Full context used for decision
    wait_duration INTEGER, -- minutes (if applicable)
    target_price DECIMAL(10, 2), -- USD (if applicable)
    estimated_usd_value DECIMAL(10, 2),
    actual_usd_value DECIMAL(10, 2), -- Filled in after conversion
    outcome TEXT, -- 'success', 'suboptimal', 'poor' (for learning)
    outcome_reasoning TEXT, -- Why outcome was classified as such
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE -- When decision was actually executed
);

-- Agent Learning Table (stores insights learned from past decisions)
CREATE TABLE IF NOT EXISTS agent_learnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_type TEXT NOT NULL, -- 'conversion_timing', 'risk_assessment', etc.
    insight TEXT NOT NULL, -- What the agent learned
    confidence DECIMAL(5, 2) NOT NULL, -- How confident in this learning (0.00 to 100.00)
    supporting_decisions UUID[], -- Array of decision IDs that support this
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL, -- If learning is merchant-specific
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated TIMESTAMP WITH TIME ZONE, -- When this learning was last confirmed
    times_applied INTEGER DEFAULT 0, -- How many times this learning has been used
    success_rate DECIMAL(5, 2) -- Success rate when applied (0.00 to 100.00)
);

-- ========================================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================================

-- Merchants indexes
CREATE INDEX IF NOT EXISTS idx_merchants_network ON merchants(network);
CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_signature ON transactions(signature);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Conversions indexes
CREATE INDEX IF NOT EXISTS idx_conversions_transaction_id ON conversions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_network ON conversions(network);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_merchant_id ON wallets(merchant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_public_key ON wallets(public_key);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_merchant_id ON notifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Payment requests indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_merchant_id ON payment_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payment_id ON payment_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id ON payment_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_expires_at ON payment_requests(expires_at);

-- Agent decisions indexes
CREATE INDEX IF NOT EXISTS idx_agent_decisions_transaction ON agent_decisions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_merchant ON agent_decisions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_type ON agent_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON agent_decisions(created_at DESC);

-- Agent learnings indexes
CREATE INDEX IF NOT EXISTS idx_agent_learnings_type ON agent_learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_merchant ON agent_learnings(merchant_id);

-- ========================================================================
-- AUTO-UPDATE TRIGGERS
-- ========================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversions_updated_at ON conversions;
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- COMMENTS (Documentation)
-- ========================================================================

COMMENT ON TABLE merchants IS 'Merchants using the payment autopilot platform';
COMMENT ON TABLE transactions IS 'All incoming payments from customers';
COMMENT ON TABLE conversions IS 'SOL→USDC conversions executed by the AI agent';
COMMENT ON TABLE wallets IS 'Encrypted merchant wallet keys (merchant-controlled)';
COMMENT ON TABLE notifications IS 'Email/SMS/webhook notifications sent to merchants';
COMMENT ON TABLE payment_requests IS 'Payment links for hosted checkout and e-commerce integration';
COMMENT ON TABLE agent_decisions IS 'Audit trail of all AI agent decisions for transparency and learning';
COMMENT ON TABLE agent_learnings IS 'Accumulated knowledge from past agent decisions';

COMMENT ON COLUMN merchants.risk_profile IS 'Merchant risk tolerance for AI agent decision-making: conservative (minimize volatility), moderate (balanced), aggressive (maximize gains)';

-- ========================================================================
-- VERIFICATION
-- ========================================================================

-- Check that all tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'merchants',
        'transactions',
        'conversions',
        'wallets',
        'notifications',
        'payment_requests',
        'agent_decisions',
        'agent_learnings'
    );
    
    IF table_count = 8 THEN
        RAISE NOTICE '✅ SUCCESS! All 8 tables created successfully.';
        RAISE NOTICE '✅ Database is ready to use!';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Tables created:';
        RAISE NOTICE '  • merchants (with risk_profile: conservative/moderate/aggressive)';
        RAISE NOTICE '  • transactions (payment records)';
        RAISE NOTICE '  • conversions (SOL→USDC swaps)';
        RAISE NOTICE '  • wallets (encrypted keys)';
        RAISE NOTICE '  • notifications (email/SMS logs)';
        RAISE NOTICE '  • payment_requests (hosted checkout)';
        RAISE NOTICE '  • agent_decisions (AI audit trail)';
        RAISE NOTICE '  • agent_learnings (AI knowledge base)';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Next steps:';
        RAISE NOTICE '  1. Copy your Supabase URL to .env';
        RAISE NOTICE '  2. Copy your Supabase anon key to .env';
        RAISE NOTICE '  3. Run: npm install';
        RAISE NOTICE '  4. Run: npm run api';
    ELSE
        RAISE WARNING '⚠️ Only % of 8 tables were created. Check for errors above.', table_count;
    END IF;
END $$;
