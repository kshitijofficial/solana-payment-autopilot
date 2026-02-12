# Merchant Onboarding Guide

## 🎯 How Merchants Join Solana Payment Autopilot

Complete step-by-step guide for new merchants.

---

## 📋 Overview

**What you get:**
- Instant merchant account
- Auto-generated payment wallet
- Real-time transaction dashboard
- Auto-conversion to stablecoin (USDC)
- Email notifications
- CSV export for accounting

**Cost:**
- **One-time setup fee:** 0.1 SOL (~$15)
- **No monthly fees**
- **No transaction fees** (for now)

---

## 🚀 Step-by-Step Process

### Step 1: Visit Signup Page

Navigate to: **http://localhost:8888** (or your hosted URL)

You'll see:
- Welcome message
- Feature highlights
- Pricing information
- Signup form

---

### Step 2: Fill in Business Details

**Required fields:**
- **Business Name** - Your store/company name
- **Email Address** - Where we send credentials

**Optional:**
- **Website** - Your business website URL

**Example:**
```
Business Name: Joe's Coffee Shop
Email: joe@coffeeshop.com
Website: https://coffeeshop.com
```

---

### Step 3: Pay Setup Fee

After clicking **"Continue to Payment"**, you'll see:

1. **QR Code** - Scan with Phantom wallet app
2. **Payment Amount** - 0.1 SOL
3. **Platform Address** - Manual send option
4. **Business Summary** - Confirm your details

**Two ways to pay:**

#### Option A: Scan QR Code (Recommended)
1. Open Phantom wallet on mobile
2. Tap scan QR code
3. Confirm payment (0.1 SOL)
4. Wait ~10 seconds

#### Option B: Send Manually
1. Copy platform address: `ENS38RJ3AUJLsyUkEsbHKKnqQppkdsUowuSBui3QVFpb`
2. Open Phantom wallet
3. Send 0.1 SOL to that address
4. Wait ~10 seconds

---

### Step 4: Automatic Account Creation

**What happens after payment:**

1. ✅ Payment detected by autonomous agent (~5-10 seconds)
2. ✅ Merchant account created automatically
3. ✅ Unique payment wallet generated
4. ✅ Added to payment monitoring system
5. ✅ Welcome email sent to your address

**You don't do anything - it's fully autonomous!**

---

### Step 5: Success Page

After payment confirms, you'll see:

**Your Credentials:**
- **Merchant ID** - Unique identifier (copy this!)
- **Payment Wallet** - Where customers send payments
- **Business Name** - As registered
- **Email** - Your contact email

**Quick Links:**
- 📊 **Merchant Dashboard** - View transactions
- 🔗 **View on Solscan** - Check wallet on blockchain

**Integration Guide:**
- 3-step setup instructions
- Copy-paste code snippets
- Pre-filled with YOUR merchant ID

---

### Step 6: Check Your Email

You'll receive: **"🎉 Welcome to Solana Payment Autopilot!"**

**Email contains:**
- Your merchant ID
- Payment wallet address
- Dashboard link
- Next steps

**⚠️ Save this email!** It has all your credentials.

---

## 💻 Integrate on Your Website

### Quick Integration (3 Steps)

#### Step 1: Include SDK
```html
<script src="https://cdn.solanaautopilot.com/sdk.js"></script>
```

#### Step 2: Initialize
```html
<script>
  const autopilot = new SolanaAutopilot({
    merchantId: 'YOUR_MERCHANT_ID_HERE',
    apiBase: 'http://localhost:3000',
    onSuccess: (payment) => {
      console.log('Payment successful!', payment);
      // Grant access to product/service
    }
  });
</script>
```

#### Step 3: Add Payment Button
```html
<button onclick="checkout()">Pay with Crypto</button>

<script>
  async function checkout() {
    await autopilot.createPayment({
      amount: 10,  // USD amount
      orderId: 'ORDER-' + Date.now(),
      customerEmail: 'customer@example.com',
      description: 'Your Product Name'
    });
  }
</script>
```

**That's it!** Payments will be detected automatically.

---

## 📊 Access Your Dashboard

### Merchant Dashboard (Port 5000)

**URL:** http://localhost:5000

**What you see:**
- 💰 **Total Received** - All SOL payments
- 📊 **Transaction Count** - Number of payments
- 📈 **Converted to USDC** - Auto-converted amounts
- 🔐 **Wallet Address** - Your payment wallet
- 📝 **Transaction History** - All customer payments
- 📥 **CSV Export** - Download for accounting

**Auto-refresh:** Updates every 15 seconds

---

## 🎯 How Payments Work

### Customer Pays
1. Customer clicks "Pay with Crypto" on your site
2. Redirected to checkout page
3. Scans QR code with Phantom wallet
4. Confirms payment

### Agent Detects Payment
1. Autonomous agent monitors your wallet 24/7
2. Detects payment in ~15 seconds
3. Records transaction in database
4. Sends you email notification

### Auto-Conversion
1. Agent automatically converts SOL → USDC
2. Protects you from price volatility
3. Shows conversion in dashboard
4. Sends conversion confirmation email

### You Get Notified
1. **Payment email** - "💰 Payment Received: X SOL"
2. **Conversion email** - "🔄 Conversion Complete: X SOL → X USDC"

### View in Dashboard
1. Transaction appears instantly
2. See customer address
3. View blockchain signature
4. Export to CSV for accounting

---

## 💡 Best Practices

### For Physical Stores

**Use QR code generator in dashboard:**
1. Open merchant dashboard
2. Go to "Generate Payment QR Code"
3. Enter amount (e.g., 0.05 SOL)
4. Generate QR code
5. Print or display at register
6. Customer scans to pay

### For Online Stores

**Integrate SDK on website:**
1. Add SDK script tag
2. Initialize with your merchant ID
3. Add "Pay with Crypto" button
4. Customer redirects to checkout
5. Payment confirmed → grant access

### For Services

**Create payment links:**
1. Generate unique payment request
2. Send link to customer
3. Customer pays via link
4. Get notified automatically

---

## 📧 Email Notifications

### What You Receive

**Payment Received:**
- Subject: "💰 Payment Received: X SOL"
- Amount in SOL
- Transaction signature
- Link to blockchain

**Conversion Complete:**
- Subject: "🔄 Conversion Complete: X SOL → X USDC"
- Original amount
- Converted amount
- Conversion rate

**⚠️ Note:** On free tier, emails only go to verified addresses.

---

## 🛠️ Technical Details

### Your Merchant Wallet
- **Type:** Solana SPL wallet
- **Network:** Devnet (testing) → Mainnet (production)
- **Custody:** Self-custodial (you control it)
- **Visibility:** Public on blockchain

### Payment Detection
- **Method:** Autonomous agent polling
- **Frequency:** Every 15 seconds
- **Confirmations:** 32 (Solana finality)
- **Latency:** ~15-30 seconds

### Auto-Conversion
- **From:** SOL (volatile)
- **To:** USDC (stablecoin)
- **When:** Immediately after payment
- **Route:** Jupiter DEX aggregator
- **Slippage:** 0.5% max

---

## 💰 Pricing & Fees

### Current Model (Hackathon)
- **Setup Fee:** 0.1 SOL one-time (~$15)
- **Monthly Fee:** $0
- **Transaction Fee:** 0%
- **Conversion Fee:** Network fees only

### Future Production Model
Options being considered:
- Transaction fee: 0.5% per payment
- Monthly subscription: $20/month
- Tiered pricing based on volume

---

## 🆘 Troubleshooting

### "Payment not detected"
- **Wait:** Can take up to 30 seconds
- **Check amount:** Must be exactly 0.1 SOL
- **Verify network:** Using devnet SOL
- **Check wallet:** Sent to correct address

### "Email not received"
- **Check spam folder**
- **Verify email address** entered correctly
- **Note:** Free tier has email restrictions

### "Dashboard shows no transactions"
- **Refresh page** (auto-refresh every 15s)
- **Check merchant ID** is configured correctly
- **Verify wallet address** in dashboard

### "Integration not working"
- **Check merchant ID** in SDK code
- **Verify API URL** is correct
- **Open browser console** for errors
- **Test with demo amount** first

---

## 📱 Support

### Need Help?

**Documentation:**
- SDK Guide: `SDK_DOCUMENTATION.md`
- API Reference: `API_DOCUMENTATION.md`
- FAQ: `FAQ.md`

**Contact:**
- Email: support@solanaautopilot.com
- Discord: discord.gg/solanaautopilot
- GitHub: github.com/solana-autopilot

**Response Time:**
- Email: 24 hours
- Discord: Real-time
- GitHub Issues: 48 hours

---

## 🎯 Next Steps

**After signup:**
1. ✅ Check your email for credentials
2. ✅ Bookmark merchant dashboard
3. ✅ Integrate SDK on your website
4. ✅ Test with small payment
5. ✅ Go live and accept payments!

**Start accepting crypto in under 10 minutes!** ⚡

---

## 🚀 Success Stories

> "Set up in 5 minutes. First payment came through in 2 hours. The autonomous agent just works!" 
> — *Joe's Coffee Shop*

> "Finally, a crypto payment solution that doesn't require a PhD in blockchain. Love it!"
> — *Sarah's Online Course Platform*

> "The auto-conversion to USDC means I don't worry about price volatility. Perfect for small business."
> — *Mike's Electronics Store*

---

## 📊 What Makes This Different

### Traditional Crypto Payments
- ❌ Complex setup
- ❌ Manage private keys
- ❌ Manual transaction tracking
- ❌ Price volatility risk
- ❌ Technical knowledge required

### Solana Payment Autopilot
- ✅ 5-minute setup
- ✅ Wallet generated automatically
- ✅ Autonomous 24/7 monitoring
- ✅ Auto-convert to stablecoin
- ✅ Zero technical knowledge needed

**We make crypto payments as easy as credit cards!** 💳

---

**Ready to start? Visit the signup page and get started in minutes!** 🚀
