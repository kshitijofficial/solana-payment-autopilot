# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     MERCHANT DASHBOARD                      │
│          (React - merchant.solanapayautopilot.app)          │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API SERVER (Express)                   │
│  /onboard  /payments  /exports  /settings  /webhooks        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS AGENT CORE                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Wallet     │  │   Payment    │  │  Conversion  │     │
│  │   Manager    │  │   Monitor    │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Accounting  │  │ Notification │  │   E-commerce │     │
│  │   Module     │  │   Service    │  │  Integration │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │Solana Network│  │   Jupiter    │
│  (merchant   │  │  (Helius WS) │  │   Aggregator │
│    data)     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Component Details

### 1. Wallet Manager
**Responsibility**: Create and manage merchant wallets

**Operations**:
- Generate new Solana keypairs for merchants
- Create PDAs for payment tracking
- Store encrypted private keys (merchant-controlled)
- Derive payment addresses per order

**Storage**:
```
merchants table:
  - id (uuid)
  - business_name
  - wallet_address (public key)
  - encrypted_private_key
  - pda_address
  - created_at
```

---

### 2. Payment Monitor
**Responsibility**: Detect incoming payments in real-time

**Implementation**:
- Connect to Helius WebSocket for transaction updates
- Filter for transactions to merchant addresses
- Verify payment amount matches expected
- Emit events for confirmed payments

**Flow**:
```
Helius WS → Transaction event → Parse → Match to order → 
Confirm → Trigger conversion → Update status
```

---

### 3. Conversion Engine
**Responsibility**: Swap incoming tokens to USDC

**Jupiter Integration**:
```typescript
async convertToUSDC(inputToken: string, amount: number) {
  // Get quote from Jupiter
  const quote = await jupiter.getQuote({
    inputMint: inputToken,      // e.g., SOL
    outputMint: USDC_MINT,
    amount: amount,
    slippageBps: 100            // 1% slippage
  })
  
  // Execute swap
  const swap = await jupiter.swap(quote)
  return swap.signature
}
```

**Supported inputs**: SOL, USDT, BONK, any SPL token

---

### 4. Accounting Module
**Responsibility**: Generate merchant-friendly reports

**Exports**:
- CSV format (QuickBooks/Excel compatible)
- Columns: Date, Order ID, Amount (crypto), Amount (USD), Fee, Net, Status
- Downloadable from dashboard

**Schema**:
```
transactions table:
  - id
  - merchant_id
  - order_id
  - amount_in (SOL/token)
  - amount_out (USDC)
  - usd_value
  - fee
  - tx_signature
  - status (pending/confirmed/failed)
  - timestamp
```

---

### 5. Notification Service
**Responsibility**: Alert merchants of new payments

**Channels**:
- Email (SendGrid)
- SMS (Twilio)
- Webhook (for e-commerce integrations)

**Template**:
```
Subject: Payment Received - $14.50 USDC
Body: 
  Customer paid 0.1 SOL for Order #1234
  Converted to 14.50 USDC
  View details: [dashboard link]
```

---

### 6. E-commerce Integration
**Responsibility**: Connect to Shopify/WooCommerce

**Shopify Webhook**:
```javascript
POST /webhooks/shopify/order
{
  "order_id": "123",
  "total": "15.00",
  "currency": "USD",
  "customer": {...}
}

Agent Response:
- Generate Solana Pay QR with amount
- Return payment URL to customer
- Monitor for payment
- Mark order as paid when confirmed
```

**WooCommerce**: Similar webhook flow

---

## Data Flow Example

### Happy Path: Coffee Shop Purchase

1. **Customer orders latte ($5)**
   - Merchant enters amount in dashboard
   - Agent generates Solana Pay URL: `solana:MERCHANT_ADDRESS?amount=0.03&label=Latte`

2. **Customer scans QR, pays 0.03 SOL**
   - Transaction hits Solana network
   - Helius WebSocket notifies agent within 400ms

3. **Agent detects payment**
   - Verifies amount matches expected
   - Confirms transaction (wait for finality)

4. **Auto-conversion**
   - Agent calls Jupiter: swap 0.03 SOL → USDC
   - Gets ~$5.10 USDC (after fees)

5. **Post-processing**
   - Store transaction in database
   - Send email: "Payment received - $5.10 USDC"
   - Update accounting export

6. **Merchant checks dashboard**
   - Sees transaction in real-time
   - Downloads daily report at end of day

**Total time**: ~5 seconds (customer payment → USDC in merchant wallet)

---

## Security Considerations

### Private Key Management
- **Merchant-controlled**: Private keys encrypted with merchant password
- **Agent access**: Read-only for monitoring, write-access only for swaps (via signed transactions)
- **No custody**: Agent never holds funds, only facilitates conversion

### Transaction Verification
- Always confirm payment on-chain before proceeding
- Match signature, amount, and destination
- Reject transactions with insufficient confirmations

### API Security
- Rate limiting on all endpoints
- JWT authentication for dashboard
- Webhook signature verification (Shopify HMAC)

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Payment detection latency | < 1s | TBD |
| Conversion execution | < 5s | TBD |
| Dashboard load time | < 2s | TBD |
| API response time | < 200ms | TBD |
| Uptime | 99.9% | TBD |

---

## Deployment Architecture

### Development
- Local PostgreSQL
- Solana devnet
- Test Jupiter swaps with devnet tokens

### Production
- Railway/Render for API server
- Vercel for dashboard frontend
- Supabase for PostgreSQL
- Solana mainnet
- Helius RPC for reliability

---

## Future Enhancements

### Phase 2
- Multi-currency support (EUR, GBP stablecoins)
- Recurring billing (subscriptions)
- Refund automation

### Phase 3
- Point-of-sale (POS) integration
- Hardware payment terminal
- Loyalty rewards in SPL tokens

### Phase 4
- AI-powered fraud detection
- Dynamic pricing (adjust for volatility)
- Cross-chain support (Ethereum, Base)

---

**Next Steps**: Implement core wallet manager + payment monitor modules
