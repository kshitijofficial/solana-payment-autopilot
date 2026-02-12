# Testing Guide - Payment Request System

Follow these steps to test the new payment request system.

---

## Prerequisites

✅ Node.js installed  
✅ Supabase project created  
✅ `.env` file configured with Supabase credentials  
✅ API dependencies installed (`npm install`)  

---

## Step 1: Check Database Tables

Run the database checker:

```bash
cd /root/.openclaw/workspace/solana-payment-autopilot
npx tsx check-database.ts
```

**Expected output:**
```
✅ merchants table exists
✅ transactions table exists
✅ conversions table exists
✅ payment_requests table exists
```

**If you see:** `❌ payment_requests table DOES NOT EXIST`

Then apply the migration:

### Apply Migration in Supabase

1. Open: https://supabase.com/dashboard
2. Select your project: `unghlsaqdxmjhfpyurkl`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy contents of `database/migration-payment-requests.sql`
6. Paste and click **Run**

You should see: `Success. No rows returned`

Now run `npx tsx check-database.ts` again to verify.

---

## Step 2: Start API Server

In one terminal:

```bash
npm run api
```

**Expected output:**
```
🚀 Starting payment monitor for 1 addresses
⏱️  Polling every 15 seconds
📧 Email service initialized with sender: onboarding@resend.dev
API Server running on http://localhost:3000
```

Leave this running and open a new terminal for testing.

---

## Step 3: Run Payment Request Test

In a new terminal:

```bash
cd /root/.openclaw/workspace/solana-payment-autopilot
npx tsx test-payment-request-system.ts
```

This will:
1. Get/create a test merchant
2. Create a payment request
3. Show payment details
4. Provide instructions for manual payment

**Expected output:**

```
✅ Using merchant: Test Store (wallet_address)
✅ Payment request created!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment ID:      pr_abc123xyz
Amount USD:      $0.01
Amount SOL:      0.000066667 SOL
Payment URL:     http://localhost:3000/pay/pr_abc123xyz
Merchant Wallet: 7xK...ABC
Expires At:      Feb 9, 2026, 3:25:00 AM
```

---

## Step 4: Manual Payment (Choose One)

### Option A: Using Solana CLI (Fastest)

If you have Solana CLI installed:

```bash
# Airdrop devnet SOL to your wallet first (if needed)
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet

# Send payment (use exact amount from test output)
solana transfer MERCHANT_WALLET_ADDRESS 0.000066667 --url devnet --allow-unfunded-recipient
```

### Option B: Using Phantom Wallet

1. Open Phantom wallet
2. Click settings → Change network → **Devnet**
3. Get devnet SOL: https://solfaucet.com
4. Send **exact amount** to merchant wallet address
5. Wait 15-30 seconds

### Option C: Using Solflare Wallet

1. Open Solflare
2. Switch to Devnet
3. Get devnet SOL: https://solfaucet.com
4. Send **exact amount** to merchant wallet

---

## Step 5: Check Payment Status

Wait 15-30 seconds after sending payment, then check:

### Using curl:

```bash
curl http://localhost:3000/api/payment-requests/pr_abc123xyz
```

### Using browser:

Open: http://localhost:3000/api/payment-requests/pr_abc123xyz

**Expected response (pending):**

```json
{
  "success": true,
  "data": {
    "payment_id": "pr_abc123xyz",
    "status": "pending",
    "amount_usd": 0.01,
    "amount_sol": 0.000066667,
    ...
  }
}
```

**Expected response (after payment):**

```json
{
  "success": true,
  "data": {
    "payment_id": "pr_abc123xyz",
    "status": "paid",
    "paid_at": "2026-02-09T02:55:00.000Z",
    "transaction_id": "uuid-here",
    ...
  }
}
```

---

## Step 6: Watch the Logs

In the API server terminal, you should see:

```
🔍 Checking wallet: 7xK...ABC
💰 New transaction: 5Kj... (0.000066667 SOL)
✅ Transaction saved to database
🎯 Matched payment to request: pr_abc123xyz
✅ Updated payment request status: paid
📤 Sending webhook (attempt 1/3)
✅ Webhook delivered successfully
📧 Email sent successfully to merchant@example.com
🔄 Triggering auto-conversion: 0.000066667 SOL → USDC
```

---

## Step 7: Check Database Records

### Check payment_requests table:

```sql
-- In Supabase SQL Editor
SELECT payment_id, status, amount_usd, amount_sol, paid_at, transaction_id
FROM payment_requests
ORDER BY created_at DESC
LIMIT 5;
```

### Check transactions table:

```sql
SELECT signature, amount, token, status, created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 5;
```

---

## Complete Test Script

If you want to automate everything:

```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Run tests
npx tsx check-database.ts         # Verify database
npx tsx test-payment-request-system.ts  # Create payment request

# Follow instructions to send payment

# Check status (replace with your payment ID)
curl http://localhost:3000/api/payment-requests/pr_abc123xyz | jq
```

---

## Testing Webhooks

### Setup webhook.site:

1. Go to https://webhook.site
2. Copy your unique URL (e.g., `https://webhook.site/abc-123`)
3. When creating payment request, set `callback_url` to your webhook.site URL

### Create payment with webhook:

```bash
curl -X POST http://localhost:3000/api/payment-requests \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "YOUR_MERCHANT_ID",
    "amount_usd": 0.01,
    "order_id": "TEST-123",
    "callback_url": "https://webhook.site/YOUR-UNIQUE-URL"
  }'
```

After payment is confirmed, check webhook.site - you should see the POST request with payment details.

---

## Troubleshooting

### Payment not detected

- ✅ Check API server is running
- ✅ Verify you sent exact SOL amount
- ✅ Wait 30 seconds (polling interval)
- ✅ Check API server logs for errors

### Payment not matching

- ✅ Verify amount matches exactly (within 0.001 SOL)
- ✅ Check payment request hasn't expired
- ✅ Verify correct merchant wallet address
- ✅ Check `status` is 'pending' in database

### Webhook not sent

- ✅ Verify `callback_url` is accessible
- ✅ Check API server logs for webhook errors
- ✅ Test with webhook.site first
- ✅ Verify WEBHOOK_SECRET is set in .env

### Database errors

- ✅ Check SUPABASE_URL in .env
- ✅ Check SUPABASE_PUBLISHABLE_KEY in .env
- ✅ Verify migration was applied
- ✅ Check Supabase project is active

---

## Quick Commands Reference

```bash
# Check database
npx tsx check-database.ts

# Start API
npm run api

# Test payment request
npx tsx test-payment-request-system.ts

# Check payment status
curl http://localhost:3000/api/payment-requests/pr_abc123xyz

# Get all merchants
curl http://localhost:3000/api/merchants

# Get merchant's payment requests
curl http://localhost:3000/api/merchants/MERCHANT_ID/payment-requests
```

---

## Success Criteria

✅ Payment request created with unique ID  
✅ QR code generated  
✅ Payment detected within 30 seconds  
✅ Status updated to "paid"  
✅ Webhook delivered (if configured)  
✅ Email notification sent  
✅ Auto-conversion triggered  

---

## Next Steps

Once testing is complete:
1. Build hosted checkout page
2. Create JavaScript SDK
3. Build demo merchant site
4. Record demo video

---

**Questions?** Check `PAYMENT_REQUESTS_GUIDE.md` for detailed API documentation.
