# ✅ Network Toggle UI - Complete

## What Was Added

### 1. Merchant Dashboard (merchant-dashboard/index.html)

**Network Toggle Buttons** (top-right header):
- 🧪 Devnet button (blue when active)
- 🌐 Mainnet button (purple when active)
- Persists selection in localStorage
- Automatically refreshes data on switch

**Transaction Filtering**:
- Shows only transactions for selected network
- Stats update based on filtered transactions
- Clear empty state messages per network

**Network Badges**:
- 🧪 Devnet badge (blue) on devnet transactions
- 🌐 Mainnet badge (purple) on mainnet transactions
- Solscan links use correct cluster

**Features**:
- Filter transactions by network in real-time
- Network-specific empty state (with devnet faucet link)
- Maintains network selection across page refreshes

---

### 2. Customer Demo Site (demo/index.html)

**Network Selector**:
- Dropdown above payment buttons
- Options: Devnet (Test) or Mainnet (Real Money)
- Mainnet shows warning popup before payment

**Safety Warning**:
```
⚠️ MAINNET WARNING

You are about to make a payment with REAL MONEY.

Test thoroughly on Devnet first!

Continue?
```

---

## How to Test

### 1. Start Servers

```bash
cd /root/.openclaw/workspace/solana-payment-autopilot

# In separate terminals:
npm run api          # Port 3000
cd merchant-dashboard && python3 -m http.server 5000
cd demo && python3 -m http.server 8080
```

### 2. Test Dashboard Network Toggle

1. Open: http://localhost:5000/login.html
2. Login with merchant ID
3. **Click network toggle** (top-right)
4. Notice:
   - Button highlights switch
   - Transactions filter instantly
   - Stats update for selected network
   - Network badges show on each transaction

### 3. Test Customer Network Selection

1. Open: http://localhost:8080
2. **Select network** from dropdown
3. Click "Pay with Crypto"
4. If mainnet → Warning popup appears
5. If devnet → Normal flow

---

## Before Full Testing - REQUIRED

### Step 1: Run Database Migration

**Copy this into Supabase SQL Editor:**

```sql
-- migrations/006_add_network_support.sql

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS network VARCHAR(10) DEFAULT 'devnet';

CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);
CREATE INDEX IF NOT EXISTS idx_merchants_network ON merchants(network);

UPDATE merchants SET network = 'devnet' WHERE network IS NULL;
UPDATE transactions SET network = 'devnet' WHERE network IS NULL;
UPDATE conversions SET network = 'devnet' WHERE network IS NULL;
UPDATE payment_requests SET network = 'devnet' WHERE network IS NULL;

ALTER TABLE merchants ADD CONSTRAINT check_merchant_network CHECK (network IN ('mainnet', 'devnet'));
ALTER TABLE transactions ADD CONSTRAINT check_transaction_network CHECK (network IN ('mainnet', 'devnet'));
```

**Run this now** → Click "Run" in Supabase

---

### Step 2: Add Mainnet RPC to .env

```bash
# Add to /root/.openclaw/workspace/solana-payment-autopilot/.env

SOLANA_MAINNET_RPC_URL=https://api.mainnet-beta.solana.com

# Or use Helius mainnet (faster):
# SOLANA_MAINNET_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

### Step 3: Update API Server (Next Step)

**File:** `src/api/server-v2.ts`

Replace PaymentMonitorV2 with PaymentMonitorDual:

```typescript
import { paymentMonitor } from '../modules/PaymentMonitorDual';

// ... in startServer function:

const merchants = await db.getClient()
  .from('merchants')
  .select('*');

if (merchants.data) {
  const watchedAddresses = merchants.data.map(m => ({
    address: m.wallet_address,
    network: m.network || 'devnet',
    merchantId: m.id
  }));
  
  await paymentMonitor.start(watchedAddresses);
}
```

---

## Current Status

✅ UI complete (dashboard + demo site)  
✅ Database schema ready (migration file)  
✅ Dual-network monitor code written  
⏳ Database migration needs to be run  
⏳ Server needs PaymentMonitorDual integration  
⏳ Testing with real transactions  

---

## What Works Now

- Network toggle UI (switches state, saves selection)
- Transaction filtering by network
- Network badges on transactions
- Solscan links (correct cluster)
- Mainnet warning popup

## What Needs Backend Integration

- Actually creating merchants with specific network
- Monitoring both networks simultaneously
- Filtering API responses by network
- Real Jupiter swaps on mainnet (simulated on devnet)

---

## Next Steps

1. **Run migration** in Supabase (5 min)
2. **Update server** to use PaymentMonitorDual (10 min)
3. **Test devnet** → Create merchant, send payment (5 min)
4. **Test mainnet** → Create merchant, send SMALL real SOL (10 min)
5. **Record demo** showing both networks (10 min)

**Total time:** ~40 minutes to full mainnet support

---

## Demo Video Script

1. Show dashboard with Devnet selected
2. Show devnet transactions (with blue badges)
3. Click Mainnet toggle
4. Show "No mainnet transactions yet"
5. Go to demo site
6. Select Mainnet from dropdown
7. Click "Pay with Crypto" → Warning popup
8. Switch back to Devnet
9. Complete devnet payment
10. Return to dashboard → Transaction appears with Devnet badge

---

**Status:** UI layer complete. Backend integration ready to wire up. Migration + server update = 15 min.
