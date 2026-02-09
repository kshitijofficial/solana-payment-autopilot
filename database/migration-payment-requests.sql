-- Migration: Add Payment Requests Table
-- Run this in your Supabase SQL Editor

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_merchant_id ON payment_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payment_id ON payment_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id ON payment_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_expires_at ON payment_requests(expires_at);

-- Updated_at trigger
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done!
-- You can verify the table was created with:
-- SELECT * FROM payment_requests LIMIT 1;
