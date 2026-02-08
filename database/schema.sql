-- Solana Payment Autopilot Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    notification_email VARCHAR(255),
    auto_convert_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Indexes for performance
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_signature ON transactions(signature);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX idx_conversions_transaction_id ON conversions(transaction_id);
CREATE INDEX idx_conversions_status ON conversions(status);

CREATE INDEX idx_wallets_merchant_id ON wallets(merchant_id);
CREATE INDEX idx_wallets_public_key ON wallets(public_key);

CREATE INDEX idx_notifications_merchant_id ON notifications(merchant_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample merchant for testing (optional - comment out for production)
INSERT INTO merchants (business_name, email, wallet_address, notification_email)
VALUES (
    'Joe''s Coffee Shop',
    'joe@coffeeshop.demo',
    'DEMO_WALLET_ADDRESS_REPLACE_ME',
    'joe@coffeeshop.demo'
) ON CONFLICT (email) DO NOTHING;
