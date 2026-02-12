# Quick Start Guide ⚡

**Get the demo running in 5 minutes**

---

## 🎯 Prerequisites

- Node.js 18+ installed
- Git installed
- (Optional) Solana CLI for testing

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
```bash
npm run start:demo
```

This starts:
- **API Server** → http://localhost:3000
- **Merchant Dashboard** → http://localhost:5000
- **Demo Store** → http://localhost:8080

---

## 🎮 Demo Flow

### Step 1: Create Merchant
Visit http://localhost:8888 (signup page)
- Enter business name: "Priya's Coffee Shop"
- Enter email: `your@email.com`
- Click "Create Merchant Account"
- **Save the merchant ID!**

### Step 2: View Dashboard
Visit http://localhost:5000 (merchant dashboard)
- Paste your merchant ID
- Click "View Dashboard"
- See your wallet address + QR code

### Step 3: Make a Payment
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

### Step 4: Watch the Magic ✨
- Payment appears in dashboard within 15 seconds
- Agent auto-converts SOL → USDC
- Email notifications sent (if Resend configured)
- Transaction logged in database
- CSV export available

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

| Service | URL | Purpose |
|---------|-----|---------|
| API Server | http://localhost:3000 | REST API |
| Merchant Dashboard | http://localhost:5000 | Merchant UI |
| Demo Store | http://localhost:8080 | Customer checkout |
| Signup Page | http://localhost:8888 | Merchant onboarding |
| Hosted Checkout | http://localhost:3000/checkout | Payment page |

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
