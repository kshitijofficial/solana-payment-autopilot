# 🌐 Mainnet Support Implementation

## What Was Built

### 1. Database Migration ✅
**File:** `migrations/006_add_network_support.sql`

Adds `network` column to all tables:
- `merchants.network` (mainnet/devnet)
- `transactions.network`
- `conversions.network`
- `payment_requests.network`

**Run this in Supabase SQL Editor before testing**

### 2. Dual-Network Payment Monitor ✅
**File:** `src/modules/PaymentMonitorDual.ts`

- Monitors both mainnet AND devnet simultaneously
- Separate RPC connections for each network
- Tracks network for each transaction
- Real-time detection on both networks

### 3. Updated Data Models ✅
**File:** `src/database/supabase.ts`

All interfaces now include `network: 'mainnet' | 'devnet'`:
- Merchant
- Transaction
- Conversion
- PaymentRequest

### 4. Network Configuration
**Add to `.env`:**
```bash
# Mainnet RPC (Helius provides both)
SOLANA_MAINNET_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Devnet RPC (existing)
SOLANA_DEVNET_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Default network for new merchants
DEFAULT_NETWORK=devnet
```

---

## How Merchants Use It

### For New Merchants (Signup Flow)

**Option 1: Network Selector on Signup**
Add dropdown to `signup/index.html`:
```html
<select id="network" class="...">
  <option value="devnet">Devnet (Testing)</option>
  <option value="mainnet">Mainnet (Real Money ⚠️)</option>
</select>
```

Merchant chooses network during registration.

### For Existing Merchants (Dashboard Toggle)

**Add to Dashboard Header:**
```html
<div class="network-toggle">
  <button onclick="switchNetwork('devnet')" 
          class="network-btn" 
          id="btn-devnet">
    🧪 Devnet
  </button>
  <button onclick="switchNetwork('mainnet')" 
          class="network-btn"
          id="btn-mainnet">
    🌐 Mainnet
  </button>
</div>
```

Filters transactions by selected network in UI.

---

## Jupiter Conversion: Devnet vs Mainnet

### Current Implementation

**Devnet:** Simulated conversion (mock $150/SOL rate)
**Mainnet:** Real Jupiter swaps with actual tokens

### AgenticConversionService Logic

```typescript
if (transaction.network === 'mainnet') {
  // Real Jupiter swap
  await jupiterConverter.executeSwap(keypair, amount, slippage, false);
} else {
  // Simulation for devnet
  await jupiterConverter.simulateSwap(amount);
}
```

**Why?** Jupiter DEX only operates on mainnet. Devnet doesn't have liquidity pools.

---

## Safety Features

### 1. Network Warnings
Show clear warnings when merchant selects mainnet:
```
⚠️ MAINNET = REAL MONEY
Transactions use real SOL and USDC.
Test thoroughly on devnet first.
```

### 2. Separate Wallets
- Merchants get DIFFERENT wallets for mainnet vs devnet
- Prevents accidental mainnet spending during testing

### 3. Transaction History Filtering
Dashboard shows ONLY transactions for selected network:
```javascript
const filteredTxs = transactions.filter(tx => tx.network === selectedNetwork);
```

### 4. Network Badges
Every transaction shows its network:
```html
<span class="badge-mainnet">🌐 Mainnet</span>
<span class="badge-devnet">🧪 Devnet</span>
```

---

## Quick Setup (5 minutes)

### 1. Run Migration
Copy `migrations/006_add_network_support.sql` into Supabase SQL Editor → Run

### 2. Update Environment Variables
Add mainnet RPC URL to `.env`:
```bash
SOLANA_MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
```

(Or use Helius mainnet endpoint if you have API key)

### 3. Update API Server
Replace PaymentMonitorV2 import with PaymentMonitorDual:

**In `src/api/server-v2.ts`:**
```typescript
import { paymentMonitor } from '../modules/PaymentMonitorDual';

// Fetch merchants with their network
const merchants = await db.getMerchants();
const watchedAddresses = merchants.map(m => ({
  address: m.wallet_address,
  network: m.network || 'devnet',
  merchantId: m.id
}));

await paymentMonitor.start(watchedAddresses);
```

### 4. Add Network Toggle to Dashboard
Add network selector buttons to `merchant-dashboard/index.html` header.

### 5. Test
- Create merchant with network='mainnet'
- Send real SOL on mainnet
- Watch detection + real Jupiter conversion

---

## API Changes

### Create Merchant (POST /api/merchants)
**Request:**
```json
{
  "business_name": "Test Shop",
  "email": "test@example.com",
  "network": "mainnet"
}
```

### Get Transactions (GET /api/merchants/:id/transactions)
**Query param:**
```
?network=mainnet
```

Filters by network.

### Generate QR Code (POST /api/payments/qr)
**Request:**
```json
{
  "wallet_address": "...",
  "amount": 0.1,
  "network": "mainnet",
  "label": "Payment"
}
```

---

## Testing Checklist

### Devnet (Existing)
- [ ] Create merchant with network='devnet'
- [ ] Send devnet SOL
- [ ] Verify transaction detected
- [ ] Verify simulated conversion works
- [ ] Check dashboard shows devnet badge

### Mainnet (New)
- [ ] Create merchant with network='mainnet'
- [ ] Send REAL mainnet SOL (small amount!)
- [ ] Verify transaction detected
- [ ] Verify REAL Jupiter swap executes
- [ ] Check USDC received in wallet
- [ ] Check Solscan mainnet link works
- [ ] Verify dashboard shows mainnet badge

---

## Customer Demo Site

### Network Selector for Buyers

**Add to `demo/index.html`:**
```html
<div class="network-selector">
  <label>Network:</label>
  <select id="payment-network">
    <option value="devnet">Devnet (Test)</option>
    <option value="mainnet">Mainnet (Real)</option>
  </select>
</div>
```

When customer clicks "Buy Now":
1. Check selected network
2. Fetch merchant wallet for that network
3. Generate payment link with correct network
4. Show appropriate Phantom wallet prompt

---

## Next Steps

1. **Run migration** in Supabase
2. **Add network toggle UI** to dashboard header
3. **Update server** to use PaymentMonitorDual
4. **Add `.env` mainnet RPC URL**
5. **Test with small mainnet amount**
6. **Record demo video** showing both networks

---

## Advantages for Demo

### For Judges:
✅ Shows production-ready (mainnet support)
✅ Demonstrates real Jupiter integration
✅ Clear testing vs production separation
✅ Professional safety warnings

### For Merchants:
✅ Test risk-free on devnet
✅ Switch to mainnet when ready
✅ View both networks separately
✅ Clear visual distinction

---

## Files Changed

1. `migrations/006_add_network_support.sql` (new)
2. `src/database/supabase.ts` (updated interfaces)
3. `src/modules/PaymentMonitorDual.ts` (new)
4. `MAINNET_SUPPORT.md` (this file)

---

## Time Estimate

- Migration: 2 minutes
- UI updates: 20 minutes
- Server updates: 15 minutes
- Testing: 15 minutes

**Total: ~1 hour** for full mainnet support

---

**Status:** Core backend DONE. UI updates needed (20 min). Ready to integrate.
