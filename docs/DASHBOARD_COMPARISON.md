# Dashboard Comparison - What to Use When

## 🎯 Two Dashboards, Two Purposes

Your project now has **TWO dashboards** for different users:

---

## 1️⃣ Merchant Dashboard (Port 5000) ⭐ **USE THIS FOR DEMO**

### Location:
`merchant-dashboard/index.html`

### Serve:
```bash
cd merchant-dashboard
python -m http.server 5000
```

### Open:
http://localhost:5000

### Purpose:
**What small business owners see and use daily**

### Features:
- ✅ Single merchant view (no confusion!)
- ✅ Clean stats dashboard
- ✅ Wallet address with copy button
- ✅ QR code generator
- ✅ Transaction history
- ✅ CSV export for accounting
- ✅ Auto-refresh (15 seconds)
- ✅ Mobile responsive

### Who uses it:
- 🛍️ Small business owners
- 👨‍💼 Merchants accepting payments
- 📱 Non-technical users

### Perfect for:
- **Hackathon demo** (shows merchant value!)
- Daily payment tracking
- In-person payment QR codes
- Accounting/bookkeeping

---

## 2️⃣ Admin Dashboard (Port 3001)

### Location:
`dashboard/` (React app)

### Serve:
```bash
cd dashboard
npm run dev
```

### Open:
http://localhost:3001

### Purpose:
**Platform operator managing multiple merchants**

### Features:
- ✅ View all merchants (dropdown)
- ✅ Create new merchants
- ✅ Switch between accounts
- ✅ Platform-level stats
- ✅ Merchant management

### Who uses it:
- 👨‍💻 Platform operators (you)
- 🏢 Platform administrators
- 🔧 Technical staff

### Perfect for:
- Testing multiple merchants
- Platform development
- Merchant onboarding
- Support/troubleshooting

---

## 🎥 Hackathon Demo Flow

### Show All Three Components:

#### 1. Customer Experience (Port 8080)
```bash
cd demo
python -m http.server 8080
```
**Show:** Customer website → Pay with Crypto → Checkout → Payment

#### 2. Merchant Experience (Port 5000) ⭐ **HIGHLIGHT THIS**
```bash
cd merchant-dashboard
python -m http.server 5000
```
**Show:** 
- Payment appears instantly
- Auto-conversion: SOL → USDC
- CSV export for accounting
- QR code generation

**Say:** *"This is what merchants see - clean, simple, no technical knowledge needed!"*

#### 3. Platform View (Port 3001)
```bash
cd dashboard
npm run dev
```
**Show:**
- Multiple merchants managed
- Platform scalability
- Admin tools

**Say:** *"As a platform, we can manage multiple merchants..."*

---

## 🚀 Quick Start - All Servers

Open 4 terminals:

### Terminal 1: API Server
```bash
cd C:\Projects\hackathon\solana-payment-autopilot
npm run api
```
✅ Port 3000 - Backend API

### Terminal 2: Merchant Dashboard (MAIN DEMO)
```bash
cd C:\Projects\hackathon\solana-payment-autopilot\merchant-dashboard
python -m http.server 5000
```
✅ Port 5000 - **Merchant-facing UI**

### Terminal 3: Demo Customer Site
```bash
cd C:\Projects\hackathon\solana-payment-autopilot\demo
python -m http.server 8080
```
✅ Port 8080 - Customer checkout

### Terminal 4: Admin Dashboard (Optional)
```bash
cd C:\Projects\hackathon\solana-payment-autopilot
npm run dashboard
```
✅ Port 3001 - Platform admin

---

## 📊 Feature Comparison

| Feature | Merchant (5000) | Admin (3001) |
|---------|-----------------|--------------|
| Single merchant view | ✅ | ❌ (dropdown) |
| Multiple merchants | ❌ | ✅ |
| Create merchants | ❌ | ✅ |
| Transaction list | ✅ | ✅ |
| QR code generator | ✅ | ✅ |
| CSV export | ✅ | ✅ |
| Auto-refresh | ✅ (15s) | ✅ (10s) |
| Mobile responsive | ✅ | ✅ |
| Non-technical UI | ✅ | ❌ |
| Authentication | ❌ (future) | ❌ (future) |

---

## 💡 Why Two Dashboards?

### Bad UX (Before):
Merchant logs in → Sees dropdown with 11 merchants → "Why can I see other businesses??" → Confused 😕

### Good UX (Now):
Merchant logs in → Sees ONLY their business → Clear stats → Easy to use → Happy! 😊

---

## 🎯 Recommendation

**For your hackathon submission:**

### Primary Focus: Merchant Dashboard (Port 5000)
This is your **value proposition** - making merchants' lives easier!

### Secondary: Show Admin Dashboard (Port 3001)
Proves you can scale to multiple merchants

### Demo Script:
1. **Customer pays** (Port 8080) - 30 seconds
2. **Merchant sees payment** (Port 5000) - 1 minute ⭐ **MAIN FOCUS**
3. **Platform scalability** (Port 3001) - 30 seconds

Total: 2 minutes, merchant-focused!

---

## 🚧 Production Roadmap

### Phase 1: Authentication (Week 1)
- Merchant signup/login
- Session management
- Merchant-specific dashboards

### Phase 2: Self-Service (Week 2)
- Merchant onboarding flow
- Email verification
- Payment settings

### Phase 3: Advanced (Week 3-4)
- Team members/permissions
- API key management
- Webhooks configuration
- Mobile app

---

## 🎖️ What Wins Hackathons

❌ **Not:** "We accept crypto payments" (boring, everyone does this)

✅ **Yes:** "We make crypto payments EASY for small businesses" (valuable!)

**Show the merchant dashboard (Port 5000) - that's your innovation!** 🏆

---

## Quick Reference

```bash
# Merchant Dashboard (MAIN DEMO)
cd merchant-dashboard && python -m http.server 5000
# → http://localhost:5000

# Admin Dashboard (Optional)
cd dashboard && npm run dev  
# → http://localhost:3001

# Customer Demo Site
cd demo && python -m http.server 8080
# → http://localhost:8080

# API Server (Required for all)
npm run api
# → http://localhost:3000
```

---

**Focus on the merchant dashboard - that's what makes your project special!** 🚀
