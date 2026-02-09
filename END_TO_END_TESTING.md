# End-to-End Testing Guide

Complete testing guide for the full payment flow from customer checkout to order fulfillment.

---

## Prerequisites

✅ Database migration applied (`payment_requests` table exists)  
✅ `@solana/pay` installed: `npm install @solana/pay`  
✅ Merchant created in database  
✅ API server running: `npm run api`  

---

## Quick Start

### 1. Check Database

```bash
npx tsx check-database.ts
```

If migration needed, run in Supabase SQL Editor:
```sql
-- Copy/paste contents of database/migration-payment-requests.sql
```

### 2. Start API Server

```bash
npm run api
```

Expected output:
```
🚀 API server running on http://localhost:3000
✅ Payment monitor started
```

### 3. Get Merchant ID

```bash
curl http://localhost:3000/api/merchants | jq
```

Copy the `id` field from the first merchant.

---

## Test Flow 1: Hosted Checkout Page

### Step 1: Create Payment Request

```bash
curl -X POST http://localhost:3000/api/payment-requests \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "YOUR_MERCHANT_ID",
    "amount_usd": 0.01,
    "order_id": "TEST-001",
    "customer_email": "test@example.com",
    "description": "Test Payment",
    "expires_in_minutes": 30
  }' | jq
```

**Save the response:**
- `payment_id`: e.g., `pr_abc123xyz`
- `payment_url`: e.g., `http://localhost:3000/pay/pr_abc123xyz`
- `amount_sol`: e.g., `0.000066667`
- `wallet_address`: Merchant wallet

### Step 2: Open Checkout Page

Open the `payment_url` in your browser:

```
http://localhost:3000/pay/pr_abc123xyz
```

You should see:
- ✅ Beautiful payment page
- ✅ QR code
- ✅ Amount in USD and SOL
- ✅ Timer counting down
- ✅ Payment instructions

### Step 3: Send Payment

**Option A: Solana CLI**

```bash
solana transfer MERCHANT_WALLET AMOUNT_SOL --url devnet --allow-unfunded-recipient
```

**Option B: Phantom Wallet**

1. Switch to Devnet
2. Scan QR code from checkout page
3. Confirm transaction

### Step 4: Watch Real-Time Update

- Page polls every 3 seconds
- Status changes: "Waiting..." → "Paid! ✅"
- Success screen appears automatically

### Step 5: Verify in Database

```sql
-- In Supabase SQL Editor
SELECT payment_id, status, paid_at, transaction_id
FROM payment_requests
WHERE payment_id = 'pr_abc123xyz';
```

**Expected:** `status = 'paid'`, `paid_at` is set, `transaction_id` is linked

---

## Test Flow 2: Demo Merchant Site

### Step 1: Update Merchant ID

Edit `demo/index.html`:

```javascript
// Line 396
const MERCHANT_ID = 'YOUR_ACTUAL_MERCHANT_ID';
```

### Step 2: Open Demo Site

```
http://localhost:3000/demo
```

You should see:
- ✅ Beautiful course landing page
- ✅ "Pay with Crypto" button
- ✅ Price: $50
- ✅ Course details

### Step 3: Click "Pay with Crypto"

1. Click button
2. Enter email when prompted
3. Redirects to checkout page automatically
4. Complete payment flow (same as Test Flow 1)

### Step 4: Success Modal

After payment confirmed:
- Redirects back to demo site
- Success modal appears
- "Payment Successful!" message

---

## Test Flow 3: JavaScript SDK

### Create Test HTML File

Create `test-sdk.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>SDK Test</title>
</head>
<body>
    <h1>Test Solana Payment SDK</h1>
    <button id="payButton">Pay $10 with Crypto</button>

    <script src="http://localhost:3000/sdk/solana-autopilot.js"></script>
    <script>
        const autopilot = new SolanaAutopilot({
            merchantId: 'YOUR_MERCHANT_ID',
            apiBase: 'http://localhost:3000',
            onSuccess: (payment) => {
                alert('Payment successful! Order ID: ' + payment.order_id);
            },
            onError: (error) => {
                alert('Payment failed: ' + error.message);
            }
        });

        document.getElementById('payButton').addEventListener('click', () => {
            autopilot.createPayment({
                amount: 10,
                orderId: 'TEST-' + Date.now(),
                customerEmail: 'customer@example.com',
                description: 'SDK Test Payment'
            });
        });
    </script>
</body>
</html>
```

Open in browser and click button → Should redirect to checkout page.

---

## Test Flow 4: Webhook Integration

### Step 1: Setup Webhook.site

1. Go to https://webhook.site
2. Copy your unique URL
3. Keep the page open

### Step 2: Create Payment with Webhook

```bash
curl -X POST http://localhost:3000/api/payment-requests \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "YOUR_MERCHANT_ID",
    "amount_usd": 0.01,
    "order_id": "WEBHOOK-TEST",
    "callback_url": "https://webhook.site/YOUR-UNIQUE-ID"
  }' | jq
```

### Step 3: Complete Payment

Follow steps from Test Flow 1 to send payment.

### Step 4: Check Webhook.site

You should see POST request with:

```json
{
  "event_type": "payment.completed",
  "payment_id": "pr_abc123xyz",
  "order_id": "WEBHOOK-TEST",
  "amount_usd": 0.01,
  "amount_sol": 0.000066667,
  "transaction_signature": "5Kj...",
  "status": "paid",
  "paid_at": "2026-02-09T03:00:00Z"
}
```

Headers:
- `X-Webhook-Signature`: HMAC signature
- `X-Payment-ID`: Payment ID

---

## Test Flow 5: Email Notifications

### Already Tested! ✅

Email notifications are automatically sent:

1. **Payment Received** - Sent when payment detected
2. **Conversion Completed** - Sent when SOL→USDC conversion done

Check your email (set in merchant's `notification_email`).

---

## Complete Customer Journey Test

### Full E2E Flow

1. **Customer visits demo site**
   ```
   http://localhost:3000/demo
   ```

2. **Customer clicks "Pay with Crypto"**
   - Enters email: `student@example.com`
   - Redirects to checkout: `/pay/pr_abc123`

3. **Customer sees checkout page**
   - Beautiful UI with QR code
   - Amount: $50 = 0.333 SOL
   - Timer: 15 minutes remaining

4. **Customer pays with Phantom**
   - Scans QR code
   - Sends exact SOL amount
   - Transaction confirmed on blockchain

5. **System detects payment (15-30s)**
   - PaymentMonitorV2 polls blockchain
   - Finds matching transaction
   - Updates payment_request status → "paid"

6. **Webhook fires**
   - POST to merchant's callback_url
   - Merchant system grants course access

7. **Email sent**
   - Merchant receives "Payment Received" email
   - Customer receives confirmation (if configured)

8. **Auto-conversion** (optional)
   - SOL → USDC conversion
   - Merchant receives "Conversion Complete" email

9. **Customer sees success**
   - Checkout page updates: "Payment Successful! ✅"
   - Redirects back to demo site (or course)
   - Access granted automatically

**Total time:** ~30 seconds from payment to access ⚡

---

## Testing Checklist

### Basic Flow
- [ ] Checkout page loads correctly
- [ ] QR code displays
- [ ] Timer counts down
- [ ] Payment detection works (15-30s)
- [ ] Status updates in real-time
- [ ] Success screen shows

### SDK Integration
- [ ] SDK initializes without errors
- [ ] `createPayment()` redirects correctly
- [ ] `checkPaymentStatus()` works
- [ ] Callbacks fire correctly

### Demo Site
- [ ] Page loads and looks good
- [ ] "Pay with Crypto" button works
- [ ] Email prompt appears
- [ ] Redirects to checkout
- [ ] Success modal displays after payment

### Webhooks
- [ ] Webhook POST sent to callback_url
- [ ] Signature header included
- [ ] Payload contains all data
- [ ] Retries work (test by using invalid URL first)

### Email Notifications
- [ ] Payment received email sent
- [ ] Conversion completed email sent
- [ ] Emails look good in inbox

### Database
- [ ] payment_requests record created
- [ ] Status updates correctly (pending → paid)
- [ ] transaction_id linked
- [ ] paid_at timestamp set

---

## Troubleshooting

### Checkout page shows "Loading..."
- Check payment_id is correct
- Verify API server is running
- Check browser console for errors

### Payment not detected
- Wait 30 seconds (polling interval)
- Check API server logs
- Verify exact SOL amount sent
- Check payment hasn't expired

### QR code not showing
- Check `@solana/pay` is installed
- Verify merchant has valid wallet_address
- Check API logs for errors

### Webhook not received
- Use webhook.site for testing first
- Check callback_url is accessible
- Verify WEBHOOK_SECRET in .env
- Check API logs for webhook errors

### Demo site button doesn't work
- Check MERCHANT_ID is set correctly
- Open browser console for errors
- Verify SDK loaded: `window.SolanaAutopilot`

---

## Quick Commands

```bash
# Check database
npx tsx check-database.ts

# Test payment request
npx tsx test-payment-request-system.ts

# Start API
npm run api

# Get merchants
curl http://localhost:3000/api/merchants | jq

# Create payment
curl -X POST http://localhost:3000/api/payment-requests \
  -H "Content-Type: application/json" \
  -d '{"merchant_id":"ID","amount_usd":0.01}' | jq

# Check payment status
curl http://localhost:3000/api/payment-requests/pr_abc123 | jq

# View checkout page
open http://localhost:3000/pay/pr_abc123

# View demo site
open http://localhost:3000/demo
```

---

## Next Steps

Once all tests pass:
1. Record demo video showing complete flow
2. Test on mobile devices
3. Add error handling edge cases
4. Prepare for production deployment

---

## Success Criteria

✅ Checkout page is beautiful and functional  
✅ Payment detection works reliably  
✅ Real-time status updates work  
✅ SDK integrates easily  
✅ Demo site shows complete journey  
✅ Webhooks deliver reliably  
✅ Emails send correctly  
✅ Database records are accurate  

**When all criteria met → Ready for demo video! 🎥**
