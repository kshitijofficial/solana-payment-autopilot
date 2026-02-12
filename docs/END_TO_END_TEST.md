# End-to-End Testing Guide - JavaScript SDK

## Overview
Test the complete merchant integration flow:
1. ✅ Demo merchant website with SDK
2. ✅ Student pays with crypto
3. ✅ Transaction appears in Merchant Dashboard

---

## Prerequisites

Make sure you have:
- ✅ API server running on port 3000
- ✅ Dashboard running on port 3001
- ✅ Payment monitor running (watching for transactions)
- ✅ Merchant ID configured

---

## Step 1: Configure Demo Site

### Update Merchant ID

Edit `demo/index.html` and replace the merchant ID:

```javascript
// Line ~257
const MERCHANT_ID = 'be87c918-36a4-4d59-9566-cad574c4e370';  // Your merchant ID
```

**Your Merchant:**
- **Business:** check
- **ID:** `be87c918-36a4-4d59-9566-cad574c4e370`
- **Wallet:** `GFpZSWUjLdPwnvewNTJrrZZFWx115EzvRFGZC2J1AXDi`
- **Auto-convert:** ON

---

## Step 2: Serve Demo Site

### Option A: Using Python (Easiest)
```bash
cd C:\Projects\hackathon\solana-payment-autopilot\demo
python -m http.server 8080
```
Open: **http://localhost:8080**

### Option B: Using Node.js
```bash
cd C:\Projects\hackathon\solana-payment-autopilot\demo
npx http-server -p 8080
```
Open: **http://localhost:8080**

### Option C: Using VS Code
1. Install "Live Server" extension
2. Right-click `demo/index.html`
3. Select "Open with Live Server"

---

## Step 3: Complete Test Flow

### 1. Open Demo Site
Navigate to **http://localhost:8080** (or your Live Server URL)

You should see:
- 🎓 Beautiful course landing page
- 💰 Price: $1 (or pay with SOL)
- ☄️ "Pay with Crypto" button

### 2. Start Payment
1. Click **"Pay with Crypto"** button
2. Enter customer email when prompted (e.g., `student@example.com`)
3. SDK creates payment request via API
4. Redirects to **hosted checkout page** (port 8080)

### 3. Hosted Checkout Page
You'll see:
- 📱 QR code for Phantom wallet
- 💰 Payment amount in SOL
- ⏱️ Payment status (Waiting for payment...)
- 📧 Customer email field

### 4. Make Payment
**Using Phantom Wallet:**
1. Open Phantom mobile app
2. Scan the QR code
3. Confirm the payment
4. Wait ~15 seconds for confirmation

**Or copy wallet address and send manually via Phantom browser extension**

### 5. Payment Detected
After ~15-30 seconds:
- ✅ Checkout page shows "Payment Confirmed!"
- ✅ Customer receives email (if email verified in Resend)
- ✅ Merchant receives payment notification email
- 🔄 Auto-conversion triggers (SOL → USDC)
- ✅ Merchant receives conversion complete email

### 6. Verify in Dashboard
Open **http://localhost:3001** (Merchant Dashboard)

You should see:
- 📊 **New transaction** in transaction list
- 💰 Amount, status, signature
- 🔄 **Conversion record** (SOL → USDC)
- 🎯 **Payment request** marked as "paid"
- 📧 Email notifications logged

---

## Step 4: SDK Integration Example

Here's what merchants will use (already in `demo/index.html`):

```html
<!-- Include SDK -->
<script src="https://cdn.yoursite.com/solana-autopilot.js"></script>

<script>
// Initialize SDK
const autopilot = new SolanaAutopilot({
  merchantId: 'YOUR_MERCHANT_ID',
  apiBase: 'https://api.yoursite.com',
  onSuccess: (payment) => {
    console.log('Payment successful!', payment);
    // Grant access to course/product
  },
  onError: (error) => {
    console.error('Payment failed:', error);
  }
});

// Create payment when button clicked
async function checkout() {
  await autopilot.createPayment({
    amount: 1,  // USD amount
    orderId: 'ORDER-' + Date.now(),
    customerEmail: 'customer@example.com',
    description: 'Product Name',
    callbackUrl: 'https://yoursite.com/webhook'  // Optional
  });
}
</script>

<!-- Payment Button -->
<button onclick="checkout()">Pay with Crypto</button>
```

---

## Expected Results

### ✅ Customer Experience
1. Clicks "Pay with Crypto" on merchant site
2. Redirects to beautiful checkout page
3. Scans QR code with Phantom
4. Sees "Payment Confirmed!" after ~15s
5. Receives email confirmation
6. Gets instant access to product

### ✅ Merchant Experience
1. Transaction appears in dashboard immediately
2. Receives email: "Payment Received: X SOL"
3. Auto-conversion happens in background
4. Receives email: "Conversion Complete: X SOL → X USDC"
5. Can export transactions to CSV for accounting

### ✅ Developer Experience
1. Copy-paste 3 lines of JavaScript
2. No backend code needed
3. No wallet management
4. No blockchain complexity
5. Just works™

---

## Troubleshooting

### Payment not detected?
- Check API server is running (port 3000)
- Check payment monitor is running (`npm run dev` or monitor script)
- Verify merchant wallet address matches
- Check logs in `logs/combined.log`

### Checkout page not loading?
- Verify demo site is served on HTTP server (not `file://`)
- Check browser console for errors
- Verify merchant ID is correct

### Emails not arriving?
- Merchant email works (verified in Resend)
- Customer email needs verification (see `VERIFY_CUSTOMER_EMAIL.md`)
- Or upgrade Resend to paid plan

### Dashboard not showing transaction?
- Refresh the page
- Check database: `npx tsx check-database.ts`
- Check API server logs

---

## Demo Video Script

**Perfect for hackathon submission:**

1. **Show merchant site** (demo/index.html)
   - "Any merchant can add this 3-line SDK..."
   
2. **Click Pay with Crypto**
   - "Customer is redirected to our hosted checkout..."
   
3. **Show QR code**
   - "Scan with any Solana wallet..."
   
4. **Make payment on phone**
   - "Phantom confirms in seconds..."
   
5. **Show success screen**
   - "Payment detected automatically..."
   
6. **Switch to dashboard**
   - "Merchant sees transaction in real-time..."
   
7. **Show conversion**
   - "AI agent auto-converts SOL to USDC..."
   
8. **Show emails**
   - "Both customer and merchant get notifications..."
   
9. **Show CSV export**
   - "Export to QuickBooks for accounting..."

**Total demo time:** ~2 minutes

---

## Files Involved

- **demo/index.html** - Merchant website (course landing page)
- **sdk/solana-autopilot.js** - JavaScript SDK
- **checkout/index.html** - Hosted checkout page
- **src/api/server-v2.ts** - API server
- **src/modules/PaymentMonitorV2.ts** - Payment detection
- **dashboard/** - Merchant dashboard

---

## Next Steps After Testing

1. ✅ Record demo video
2. ✅ Update README with SDK docs
3. ✅ Deploy to production (Vercel/Railway)
4. ✅ Submit to hackathon
5. 🚀 Launch to merchants!

---

**Ready to test? Start with Step 1 and follow the flow!** 🚀
