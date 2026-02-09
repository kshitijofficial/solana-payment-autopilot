# Merchant Signup - Payment-Gated Registration

## 🎯 Overview

Self-service merchant onboarding with **pay-to-register** model:
- One-time fee: **0.1 SOL** (~$15)
- Autonomous account creation
- Instant activation

---

## 💰 How It Works

### Step 1: Merchant Fills Form
```
Business Name: Joe's Coffee Shop
Email: joe@coffeeshop.com
Website: https://coffeeshop.com (optional)
```

### Step 2: Pay Setup Fee
- Merchant pays 0.1 SOL to platform wallet
- QR code generated automatically
- Can scan with Phantom or send manually

### Step 3: Payment Detection
- System polls platform wallet every 5 seconds
- Detects 0.1 SOL payment
- Verifies amount (±1% tolerance)

### Step 4: Auto-Create Merchant
- Generates unique wallet for merchant
- Creates merchant account in database
- Adds wallet to payment monitor
- Sends welcome email with credentials

### Step 5: Success Page
- Shows merchant ID
- Shows wallet address
- Provides integration code
- Links to dashboard

---

## 🏦 Platform Wallet

**Address:** `ENS38RJ3AUJLsyUkEsbHKKnqQppkdsUowuSBui3QVFpb`

This wallet collects all merchant signup fees.

**⚠️ Important:**
- Keep private key secure (in `.env`)
- Fund with devnet SOL for testing
- Monitor for incoming signup payments

---

## 🚀 Usage

### Serve the Signup Page

```bash
cd signup
python -m http.server 8888
```

Open: **http://localhost:8888**

### Test the Flow

1. Fill in merchant details
2. Click "Continue to Payment"
3. Send 0.1 SOL to platform wallet
4. Wait 5-10 seconds
5. Redirected to success page
6. See new merchant in admin dashboard

---

## 🔄 Payment Detection Flow

```
Merchant submits form
  ↓
Frontend generates QR code (platform wallet + 0.1 SOL)
  ↓
Merchant scans & pays
  ↓
Frontend polls: POST /api/signup/check-payment every 5s
  ↓
Backend checks platform wallet for 0.1 SOL payment
  ↓
Payment found?
  ├─ Yes → Create merchant account → Return merchant_id
  └─ No → Return payment_confirmed: false
  ↓
Frontend redirects to success.html?merchant_id=xxx
  ↓
Success page shows credentials + integration guide
```

---

## 📧 Welcome Email

Automatically sent when merchant created:

**Subject:** 🎉 Welcome to Solana Payment Autopilot!

**Contains:**
- Merchant ID
- Wallet address
- Email
- Dashboard link
- Integration instructions

---

## 🎨 Success Page Features

After payment confirmed, merchants see:

1. **Credentials**
   - Merchant ID (copy button)
   - Wallet address (copy button)
   - Business name
   - Email

2. **Quick Links**
   - Merchant dashboard
   - View wallet on Solscan

3. **Integration Guide**
   - 3-step setup
   - Copy-paste code snippets
   - Pre-filled with their merchant ID

---

## 🔐 Security Features

### Duplicate Prevention
- Checks if email already registered
- Returns existing merchant ID if found
- Prevents double-charging

### Payment Verification
- Only accepts payments in last 5 minutes
- Verifies exact amount (±1% tolerance)
- Checks blockchain confirmations

### Rate Limiting
- Could add Cloudflare
- Could add CAPTCHA
- Could add IP rate limits

---

## 🛠️ Configuration

### Environment Variables (.env)

```bash
# Platform wallet (receives signup fees)
PLATFORM_WALLET_ADDRESS=ENS38RJ3AUJLsyUkEsbHKKnqQppkdsUowuSBui3QVFpb
PLATFORM_WALLET_PRIVATE_KEY=4DAsmdHkH5Y2Bf7DdH1ZMNQ5P5b7naAQyxSfykJixQ4bZoG5cTDMjCjdfchfLDotH5qidCpPXV8kFpsg9t1fFgKq

# Signup fee (in SOL)
MERCHANT_SIGNUP_FEE=0.1
```

### Frontend Constants (signup/index.html)

```javascript
const PLATFORM_WALLET = 'ENS38RJ3AUJLsyUkEsbHKKnqQppkdsUowuSBui3QVFpb';
const SIGNUP_FEE = 0.1;
const API_BASE = 'http://localhost:3000/api';
```

---

## 📊 Admin View

After merchant signs up, they appear in admin dashboard (port 3001):

1. Open http://localhost:3001
2. See new merchant in dropdown
3. Select merchant to view their account
4. See empty transaction list (no payments yet)

Merchant can then:
- Access merchant dashboard (port 5000)
- Integrate SDK on their website
- Start accepting payments

---

## 🚧 Production Improvements

### Phase 1: Current (Working)
- [x] Payment-gated signup
- [x] Auto merchant creation
- [x] Welcome email
- [x] Integration guide

### Phase 2: Add Authentication
- [ ] Password field on signup
- [ ] Hash passwords (bcrypt)
- [ ] Login page
- [ ] Session management
- [ ] Dashboard auto-login

### Phase 3: Better UX
- [ ] Email verification
- [ ] Password reset
- [ ] Resend welcome email
- [ ] Signup confirmation page
- [ ] Progress indicators

### Phase 4: Advanced
- [ ] Subscription billing (monthly)
- [ ] Usage-based pricing
- [ ] Referral program
- [ ] Affiliate dashboard

---

## 🎯 Why This Works

**Self-Service:**
- No manual intervention needed
- Instant account creation
- Scales automatically

**Revenue Model:**
- Clear pricing from day 1
- Filters out fake signups
- Proves payment system works

**Developer Experience:**
- Success page has everything
- Copy-paste integration code
- Pre-filled with credentials

**Business Model:**
- One-time fee covers setup
- Can add transaction fees later
- Can add premium features

---

## 🧪 Testing Checklist

- [ ] Fill signup form with test data
- [ ] Generate QR code
- [ ] Send 0.1 SOL from Phantom devnet
- [ ] Wait for payment detection (~5-10 seconds)
- [ ] Redirect to success page
- [ ] See merchant ID and wallet
- [ ] Copy integration code
- [ ] Check admin dashboard (port 3001)
- [ ] See new merchant in list
- [ ] Check merchant dashboard (port 5000)
- [ ] Configure with new merchant ID
- [ ] Verify welcome email sent

---

## 📁 Files

```
signup/
├── index.html          # Signup form + payment screen
├── success.html        # Success page with credentials
└── README.md          # This file
```

---

**This is how merchants onboard themselves!** 🚀

No manual work, no support tickets, just pay & start accepting payments.
