# Day 1 - Final Testing Guide

## ✅ What's Complete

### Infrastructure
- ✅ Supabase database (5 tables: merchants, transactions, conversions, wallets, notifications)
- ✅ Database service layer with Supabase client
- ✅ API server with RESTful endpoints
- ✅ Payment monitor (polling every 15 seconds)
- ✅ QR code generation

### Tests Passed (6/6)
1. ✅ Database connection
2. ✅ Merchant creation
3. ✅ QR code generation
4. ✅ Payment monitor initialization
5. ✅ Transaction retrieval
6. ✅ Environment variables

---

## 🧪 Manual Testing Steps

### Test 1: API Server Health Check

```bash
# Terminal 1: Start API server
cd /root/.openclaw/workspace/solana-payment-autopilot
npm run api
```

Open browser: http://localhost:3000/api/health

**Expected:** `{"status":"ok","timestamp":"..."}`

---

### Test 2: Create Merchant via API

```bash
# Terminal 2
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Manual Test Shop",
    "email": "manual@test.com"
  }'
```

**Expected:**
- Merchant created with auto-generated wallet
- QR code data URL returned
- 200 OK response

**Save the wallet_address from response!**

---

### Test 3: Generate Payment QR Code

```bash
curl -X POST http://localhost:3000/api/payments/qr \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "amount": 0.05,
    "label": "Test Coffee"
  }'
```

**Expected:** QR code data URL + Solana Pay URL

---

### Test 4: Live Payment Detection

#### Option A: Using test-payment-flow.ts

```bash
# This creates a test merchant and monitors it
npx tsx test-payment-flow.ts
```

Follow the instructions to:
1. Get devnet SOL from faucet
2. Send to the generated wallet
3. Watch for payment detection

#### Option B: Using existing merchant

```bash
# Monitor specific wallet address
npx tsx -e "
import './src/modules/PaymentMonitor';
import { PaymentMonitor } from './src/modules/PaymentMonitor';
import * as dotenv from 'dotenv';
dotenv.config();

const monitor = new PaymentMonitor(
  process.env.SOLANA_RPC_URL!,
  process.env.HELIUS_API_KEY!
);

monitor.on('payment', (payment) => {
  console.log('💰 Payment received:', payment);
});

monitor.start(['YOUR_WALLET_ADDRESS']);
console.log('Monitoring...');
"
```

---

### Test 5: Verify Database Storage

After a payment is detected:

```bash
# Check transactions in database
curl http://localhost:3000/api/merchants/MERCHANT_ID/transactions
```

**Expected:** Transaction record with:
- Signature
- Amount
- Token (SOL)
- Status (confirmed)
- Timestamps

---

## 📊 Quick Status Check

Run all automated tests:
```bash
npx tsx day1-complete-test.ts
```

Should show: **6/6 tests passed**

---

## 🔗 Useful Links

- **Devnet Faucet:** https://faucet.solana.com
- **Solscan (devnet):** https://solscan.io/?cluster=devnet
- **API Docs:** http://localhost:3000 (when server running)

---

## 🐛 Troubleshooting

### Payment not detected?
1. Check wallet has devnet SOL: https://solscan.io/account/YOUR_WALLET?cluster=devnet
2. Verify transaction confirmed (32 confirmations)
3. Check logs in payment monitor terminal
4. Polling happens every 15 seconds (be patient)

### Database connection failed?
1. Check `.env` file has correct SUPABASE credentials
2. Verify password is URL-encoded (`@` → `%40`, `$` → `%24`, etc.)
3. Test with: `npx tsx test-supabase.ts`

### API server won't start?
1. Check port 3000 is available: `lsof -i :3000`
2. Kill existing process: `kill -9 $(lsof -t -i :3000)`
3. Check logs for detailed error

---

## ✅ Success Criteria (Day 1)

- [ ] API server responds on http://localhost:3000
- [ ] Can create merchant via API
- [ ] QR code generated successfully
- [ ] Payment monitor detects incoming devnet SOL
- [ ] Transaction saved to database with correct details
- [ ] Can retrieve transaction via API

---

## 📅 Next Steps (Day 2)

Tomorrow we'll add:
- Jupiter SOL→USDC auto-conversion
- Conversion error handling
- Swap signature storage
- Real-time conversion status updates

---

**Current test wallet (from automated tests):**
Address: `AvTvB1P1xjU6X9Cds9cB5aodYMHjMrUaDgmJH41HXdkk`

Send 0.05 SOL to this address to test payment detection!
