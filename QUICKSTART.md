# Quick Start Guide ⚡

**Get the demo running in 5 minutes**

---

## 🎯 Prerequisites

- Node.js 18+ installed
- Git installed
- (Optional) Solana CLI for testing

---

## ⚠️ Important: Devnet Demo Mode

This demo runs on **Solana devnet** with **simulated conversions**.

**What's real:**
- ✅ Payment detection (actual blockchain monitoring)
- ✅ Wallet generation (real Solana keypairs)
- ✅ Email notifications (real emails via Resend)
- ✅ AI agent decisions (Claude AI)

**What's simulated:**
- ⚠️ **SOL→USDC conversion** (Jupiter API doesn't support devnet swaps)
- Uses fixed rate: ~$150/SOL
- Real conversion code exists, ready for mainnet

**To use real conversions:** Set `SOLANA_NETWORK=mainnet` in `.env`

---

## 🚀 Installation

### 1. Clone & Install
```bash
git clone https://github.com/kshitijofficial/solana-payment-autopilot.git
cd solana-payment-autopilot
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

**Edit `.env` with your keys:**
```env
# Required for demo
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
HELIUS_API_KEY=your_helius_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Optional (for full features)
RESEND_API_KEY=your_resend_key
ANTHROPIC_API_KEY=your_claude_key
```

**Get free API keys:**
- **Helius**: https://helius.dev (1M requests/month free)
- **Supabase**: https://supabase.com (free tier)
- **Resend**: https://resend.com (3k emails/month free)
- **Anthropic**: https://anthropic.com (optional for AI chat)

### 3. Set Up Database
```bash
npm run db:migrate
```

### 4. Start the Demo

**Option A: Platform View (Full Demo + Admin Panel)**
```bash
npm run start:platform
```
This starts:
- **API Server** → http://localhost:3000
- **Admin Panel** → http://localhost:3001 (React - view all merchants)
- **Merchant Dashboard** → http://localhost:5000
- **Signup Page** → http://localhost:8888
- **Demo Store** → http://localhost:8080

**Option B: Merchant View (Recommended for Quick Demo)**
```bash
npm run start:all
```
This starts:
- **API Server** → http://localhost:3000
- **Merchant Dashboard** → http://localhost:5000
- **Signup Page** → http://localhost:8888
- **Demo Store** → http://localhost:8080

**Option C: Minimal Demo (No Signup)**
```bash
npm run start:demo
```
This starts:
- **API Server** → http://localhost:3000
- **Merchant Dashboard** → http://localhost:5000
- **Demo Store** → http://localhost:8080

*Note: With Option C, create merchants via API or test scripts*

**Option D: Manual Control (Advanced)**
```bash
# Terminal 1: API Server
npm run api

# Terminal 2: Admin Panel (optional - platform operators)
npm run admin

# Terminal 3: Merchant Dashboard
cd merchant-dashboard && python -m http.server 5000

# Terminal 4: Signup Page (optional)
cd signup && python -m http.server 8888

# Terminal 5: Demo Store
cd demo && python -m http.server 8080
```

---

## 🎮 Demo Flow

### Step 1: Create Merchant
1. Visit **http://localhost:8888** (signup page)
2. Enter business name: "Priya's Coffee Shop"
3. Enter email: `your@email.com`
4. Click "Create Merchant Account"
5. **Copy the merchant ID** (you'll need it for login)

### Step 2: Log In
1. Visit **http://localhost:5000/login.html**
2. Paste your merchant ID
3. Click "View Dashboard"
4. Dashboard loads at **http://localhost:5000** (index.html)

### Step 3: Explore Dashboard
- See your wallet address + QR code
- View USDC token account
- Check transaction history (empty initially)
- Note auto-conversion settings

### Step 4: Make a Payment
**Option A: Use Demo Store**
1. Visit http://localhost:8080
2. Click "Buy with Crypto"
3. Scan QR or copy address
4. Send 0.1 SOL from any wallet (devnet)

**Option B: Manual Payment**
```bash
# Using Solana CLI
solana transfer <MERCHANT_ADDRESS> 0.1 --url devnet
```

### Step 5: Watch the AI Agent Work ✨

**Immediate actions:**
- ✅ Payment detected within 15 seconds
- 🤖 **AI analyzes** market conditions + merchant profile
- 💭 **AI decides** whether to convert now or wait
- 📊 Decision logged with reasoning + confidence score

**If AI chooses "convert now":**
- ✅ Executes SOL → USDC swap
- ✅ Sends email confirmations
- ✅ Updates dashboard in real-time

**If AI chooses "wait":**
- ⏰ Schedules delayed conversion
- 💰 Targets better price (e.g., wait 15 min for +2%)
- 🔔 Alerts merchant of decision

**You can also:**
- 💬 Chat with AI: "Why did you convert immediately?"
- 📈 View AI insights: Revenue forecast, patterns, alerts
- 📊 Export CSV: All transactions + conversion decisions

---

## 🤖 AI Agent Features to Test

Once your demo is running, try these AI agent features:

### 1. Intelligent Conversion Decisions
- Make a payment → Watch AI decide whether to convert immediately or wait
- Check "Agent Activity" in dashboard to see AI's reasoning
- Look for confidence scores and risk assessments

### 2. Chat with the Agent
- Click chat button (💬) in bottom-right of dashboard
- Ask: **"Why did you convert immediately?"**
- Ask: **"How much have I earned this week?"**
- Try: **"Convert 10 USDC to SOL"** (AI executes the swap!)

### 3. View AI Insights
- Dashboard shows alerts (large payments, activity spikes)
- Revenue forecast for next week
- Pattern detection (repeat customers, peak hours)
- Price alerts (when SOL crosses thresholds)

### 4. Decision Audit Trail
- Every AI decision logged with:
  - ✅ Decision made (convert/wait/monitor)
  - ✅ Confidence level (0-100%)
  - ✅ Full reasoning
  - ✅ Market conditions
- Export to CSV for analysis

---

## 🧪 Testing Without Sending Real Crypto

Use the test scripts:

```bash
# Check database setup
npm run db:check

# Test payment detection
npm run test:payment

# Test full flow (mock)
npm run test:integration

# Test AI agent features
npm run test:agent
```

---

## 📊 Key Endpoints

| Service | URL | Purpose | Available |
|---------|-----|---------|-----------|
| **API Server** | http://localhost:3000 | REST API endpoints | All modes |
| **Admin Panel** 👨‍💼 | http://localhost:3001 | Platform admin (view all merchants) | `start:platform` or `npm run admin` |
| **Merchant Login** | http://localhost:5000/login.html | Enter merchant ID | All modes |
| **Merchant Dashboard** | http://localhost:5000 | Individual merchant view | All modes |
| **Demo Store** | http://localhost:8080 | Customer-facing checkout | All modes |
| **Signup Page** | http://localhost:8888 | Merchant onboarding | `start:all` or `start:platform` |
| **Hosted Checkout** | http://localhost:3000/checkout | Payment request pages | All modes |

### 🔄 Navigation Flows:

**For Merchants:**
1. **Sign up** → http://localhost:8888 → Get merchant ID
2. **Log in** → http://localhost:5000/login.html → Enter ID
3. **Dashboard** → Redirects to http://localhost:5000 (index.html)
4. **Demo payment** → http://localhost:8080 → Customer checkout

**For Platform Operators:**
1. **Admin panel** → http://localhost:3001 → View all merchants
2. **Select merchant** → Switch between accounts
3. **Monitor transactions** → Real-time updates
4. **Export data** → CSV accounting reports

---

## 🔍 Verifying It Works

### 1. API Health Check
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":...}
```

### 2. Database Check
```bash
npm run db:check
# Should show connected tables
```

### 3. View Merchant Data
```bash
npm run scripts/check-merchant.ts
# Enter merchant ID to see details
```

### 4. Check Recent Activity
```bash
npm run scripts/check-recent-activity.ts
# Shows last 10 transactions
```

---

## 🐛 Troubleshooting

### API Won't Start
- Check port 3000 is free: `lsof -i :3000`
- Verify `.env` file exists
- Check logs: `tail -f logs/combined.log`

### Database Connection Failed
- Verify Supabase URL/key in `.env`
- Run migrations: `npm run db:migrate`
- Check Supabase dashboard

### Payments Not Detected
- Confirm Helius API key is valid
- Ensure you're on **devnet**
- Check merchant address is correct
- Wait 15-30 seconds (polling interval)

### Emails Not Sending
- Verify Resend API key
- Check email is verified in Resend dashboard
- Look for errors in logs

---

## 📚 Next Steps

- **Read**: [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
- **Deploy**: [docs/MAINNET_SUPPORT.md](./docs/MAINNET_SUPPORT.md) for mainnet
- **Docs**: [docs/](./docs/) for all documentation

---

## 🎥 Demo Video

**Coming Soon** - Watch the full walkthrough on YouTube

---

## 💬 Need Help?

- **Issues**: https://github.com/kshitijofficial/solana-payment-autopilot/issues
- **Telegram**: [@KshitijWeb3](https://t.me/KshitijWeb3)
- **Docs**: Check [docs/](./docs/) folder

---

## ⚡ Speed Run (If You Already Have Keys)

```bash
git clone https://github.com/kshitijofficial/solana-payment-autopilot.git && \
cd solana-payment-autopilot && \
npm install && \
cp .env.example .env && \
# Edit .env with your keys, then:
npm run db:migrate && \
npm run start:demo
```

**Visit http://localhost:5000 and start accepting crypto! 🚀**

---

**Questions? Open an issue or reach out on Telegram.**

**Happy testing! 🎉**
