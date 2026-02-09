# Payment Requests - Setup & Testing Guide

## What We Built

The **Payment Request System** allows merchants to create payment links/QR codes for specific orders. When customers pay, the system automatically matches the payment to the order and notifies the merchant via webhook.

This is the foundation for SDK integration and hosted checkout.

---

## Features

✅ **Create payment requests** with USD amounts (auto-converted to SOL)  
✅ **Generate QR codes** for Solana Pay  
✅ **Unique payment URLs** for each order  
✅ **Automatic payment matching** (by wallet + amount)  
✅ **Webhook notifications** to merchant's system  
✅ **Order tracking** with custom metadata  
✅ **Expiration** (default: 15 minutes)  

---

## Setup

### Step 1: Apply Database Migration

Run this in your Supabase SQL Editor:

```bash
# Copy the migration file content
cat database/migration-payment-requests.sql
```

Or directly in Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Paste contents of `database/migration-payment-requests.sql`
6. Click **Run**

Verify:
```sql
SELECT * FROM payment_requests LIMIT 1;
```

### Step 2: Install @solana/pay Dependency

```bash
npm install @solana/pay
```

### Step 3: Restart API Server

```bash
npm run api
```

---

## API Usage

### Create Payment Request

```bash
POST /api/payment-requests

{
  "merchant_id": "uuid-of-merchant",
  "amount_usd": 50,
  "order_id": "COURSE-123",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "description": "Blockchain Course Access",
  "callback_url": "https://your-site.com/webhooks/payment",
  "metadata": {
    "course_id": "blockchain-101",
    "student_id": "12345"
  },
  "expires_in_minutes": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "pr_abc123xyz",
    "payment_url": "http://localhost:3000/pay/pr_abc123xyz",
    "amount_usd": 50,
    "amount_sol": 0.333333333,
    "qr_code": "data:image/png;base64,...",
    "wallet_address": "merchant_wallet_address",
    "expires_at": "2026-02-09T03:00:00.000Z"
  }
}
```

### Get Payment Request Status

```bash
GET /api/payment-requests/:paymentId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payment_id": "pr_abc123xyz",
    "status": "paid",  // or "pending", "expired", "failed"
    "amount_usd": 50,
    "amount_sol": 0.333333333,
    "order_id": "COURSE-123",
    "paid_at": "2026-02-09T02:45:00.000Z",
    "transaction_id": "uuid-of-transaction",
    ...
  }
}
```

### List Merchant's Payment Requests

```bash
GET /api/merchants/:merchantId/payment-requests?limit=50
```

---

## Testing End-to-End

### Test Script

Create `test-payment-request.ts`:

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function test() {
  // 1. Get or create merchant
  const merchantRes = await axios.get(`${API_BASE}/merchants`);
  const merchant = merchantRes.data.data[0];
  
  if (!merchant) {
    console.error('No merchants found. Create one first.');
    return;
  }

  console.log('✅ Using merchant:', merchant.business_name);

  // 2. Create payment request
  const paymentReq = await axios.post(`${API_BASE}/payment-requests`, {
    merchant_id: merchant.id,
    amount_usd: 0.01, // Small amount for testing
    order_id: 'TEST-' + Date.now(),
    customer_email: 'test@example.com',
    description: 'Test Payment',
    callback_url: 'https://webhook.site/your-unique-url', // Get from webhook.site
    metadata: { test: true }
  });

  const payment = paymentReq.data.data;
  console.log('\n✅ Payment request created!');
  console.log('Payment ID:', payment.payment_id);
  console.log('Amount:', payment.amount_sol, 'SOL');
  console.log('Payment URL:', payment.payment_url);
  console.log('Merchant Wallet:', payment.wallet_address);
  console.log('\n📱 QR Code:', payment.qr_code.slice(0, 100) + '...');

  console.log('\n📝 Next steps:');
  console.log('1. Send', payment.amount_sol, 'SOL to:', payment.wallet_address);
  console.log('2. Wait 15-30 seconds for payment detection');
  console.log('3. Check status:', `${API_BASE}/payment-requests/${payment.payment_id}`);
  console.log('4. Check webhook.site for webhook delivery');
}

test().catch(console.error);
```

Run:
```bash
npx tsx test-payment-request.ts
```

### Manual Testing

1. **Create payment request** (use API above)
2. **Send devnet SOL** to merchant's wallet
   - Use Phantom wallet or `solana transfer` CLI
   - Send the exact amount from `amount_sol`
3. **Wait 15-30 seconds** for PaymentMonitorV2 to detect
4. **Check status**:
   ```bash
   curl http://localhost:3000/api/payment-requests/pr_abc123xyz
   ```
5. **Verify webhook** was sent (check webhook.site)

---

## Webhook Integration

### Receiving Webhooks

When a payment is confirmed, we POST to your `callback_url`:

```json
{
  "event_type": "payment.completed",
  "payment_id": "pr_abc123xyz",
  "order_id": "COURSE-123",
  "amount_usd": 50,
  "amount_sol": 0.333333333,
  "transaction_signature": "5Kj...",
  "status": "paid",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "metadata": {
    "course_id": "blockchain-101"
  },
  "paid_at": "2026-02-09T02:45:00.000Z"
}
```

**Headers:**
- `X-Webhook-Signature`: HMAC-SHA256 signature (verify with `WEBHOOK_SECRET`)
- `X-Payment-ID`: The payment ID
- `Content-Type`: application/json

### Verify Signature (Recommended)

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook endpoint:
app.post('/webhooks/payment', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process payment
  const { order_id, status } = req.body;
  console.log(`Order ${order_id} is ${status}`);
  
  // Grant course access, send confirmation email, etc.
  
  res.json({ received: true });
});
```

### Test Webhook Endpoint

Use **webhook.site** for testing:
1. Go to https://webhook.site
2. Copy your unique URL
3. Use it as `callback_url` in payment request
4. Watch real-time webhook deliveries

---

## Flow Diagram

```
┌─────────────┐
│   Merchant  │ Creates payment request
│   Website   │────────────────────┐
└─────────────┘                    │
                                   ▼
                           ┌───────────────┐
                           │  API Server   │
                           │ /payment-req  │
                           └───────┬───────┘
                                   │
                                   │ Returns payment URL + QR
                                   ▼
                           ┌───────────────┐
                           │   Customer    │ Scans QR / clicks link
                           │  (Wallet App) │
                           └───────┬───────┘
                                   │
                                   │ Sends SOL
                                   ▼
                           ┌───────────────┐
                           │Payment Monitor│ Detects payment (15s)
                           └───────┬───────┘
                                   │
                                   │ Matches to payment_request
                                   ▼
                           ┌───────────────┐
                           │ Webhook Service│ POST to callback_url
                           └───────┬────────┘
                                   │
                                   │ Webhook delivered
                                   ▼
                           ┌───────────────┐
                           │   Merchant    │ Grants access to customer
                           │    Backend    │
                           └───────────────┘
```

---

## Next Steps

✅ **Database schema** - Done  
✅ **API endpoints** - Done  
✅ **Payment matching** - Done  
✅ **Webhook system** - Done  

**Tomorrow (Day 2):**
- [ ] Build hosted checkout page (Next.js or simple HTML)
- [ ] JavaScript SDK for easy integration
- [ ] Demo merchant site showing full flow
- [ ] Polish and test end-to-end

---

## Troubleshooting

### Payment not matching

- Check SOL amount is exact (within 0.001 SOL tolerance)
- Verify payment sent to correct wallet address
- Check payment request hasn't expired
- Look at logs: `status: 'pending'` in payment_requests table

### Webhook not received

- Check `callback_url` is accessible from internet (use ngrok for localhost)
- Verify URL returns 200 status
- Check webhook logs in API server console
- Use webhook.site to test without setting up a real endpoint

### QR code not generating

- Make sure `@solana/pay` is installed: `npm install @solana/pay`
- Check merchant has valid wallet_address
- Look for errors in API logs

---

## Files Modified/Created

**Database:**
- `database/schema.sql` - Added payment_requests table
- `database/migration-payment-requests.sql` - Migration script

**Services:**
- `src/services/PaymentRequestService.ts` - NEW
- `src/services/WebhookService.ts` - NEW

**Database:**
- `src/database/supabase.ts` - Added PaymentRequest interface + methods

**API:**
- `src/api/routes.ts` - Added payment request endpoints

**Monitor:**
- `src/modules/PaymentMonitorV2.ts` - Added payment matching logic

**Config:**
- `.env` - Added WEBHOOK_SECRET
- `.env.example` - Added WEBHOOK_SECRET

---

**Status:** ✅ Payment Request System - Day 1 COMPLETE!

**Next:** Hosted checkout page + JavaScript SDK 🚀
