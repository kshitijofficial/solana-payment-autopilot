# Solana Payment Autopilot 🤖💰

> **Autonomous AI agent that lets merchants accept crypto without technical expertise**

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) • [Agent #710](https://colosseum.com/agent-hackathon/agents/openclaw-kshitij)

---

## 🎯 The Problem

Small merchants want to accept cryptocurrency, but:
- ❌ Setup is too technical (wallets, addresses, networks)
- ❌ Managing volatile crypto is risky
- ❌ Accounting/taxes are complicated
- ❌ No good integration with existing tools

**Result: Merchants miss out on crypto-paying customers**

---

## ✨ The Solution

An autonomous AI agent that handles everything:

✅ **One-click merchant onboarding** - Agent creates wallet, generates QR codes  
✅ **Real-time payment detection** - Monitors blockchain 24/7 via Helius WebSockets  
✅ **Auto-conversion** - Converts volatile SOL → stable USDC via Jupiter (best rates)  
✅ **Smart decision-making** - AI decides when to convert based on volatility & merchant preferences  
✅ **Accounting exports** - CSV reports ready for QuickBooks/Excel  
✅ **Payment requests** - Hosted checkout pages + JavaScript SDK for e-commerce  
✅ **Webhooks** - Notify merchant systems when payments arrive  
✅ **Email notifications** - Instant alerts for merchants & customers  
✅ **Chat interface** - Merchants can ask the AI questions about their payments  

---

## 🚀 How It Works

```
1. Merchant signs up → Agent creates wallet + QR code
2. Customer scans QR → Pays 0.1 SOL ($15)
3. Agent detects payment in real-time
4. Agent converts SOL → 15 USDC (Jupiter swap)
5. Merchant receives stable USDC
6. Both parties get email confirmations
```

**The AI agent runs 24/7** - no manual intervention needed.

---

## 🏗️ Architecture

### Core Components

| Component | Purpose | Tech |
|-----------|---------|------|
| **Agent Controller** | Orchestrates all operations | OpenClaw AI |
| **Payment Monitor** | Real-time blockchain monitoring | Helius WebSocket API |
| **Conversion Engine** | Auto-swaps SOL → USDC | Jupiter Aggregator |
| **Decision Service** | AI decides when to convert | Claude AI |
| **Payment Requests** | Hosted checkout + SDK | Solana Pay |
| **Webhook Service** | Notify merchant backends | HMAC-secured webhooks |
| **Email Service** | Notifications | Resend API |
| **API Server** | RESTful endpoints | Express.js |
| **Merchant Dashboard** | Real-time UI | React + Tailwind CSS |

### Tech Stack

- **Blockchain**: Solana (devnet → mainnet ready)
- **Language**: TypeScript + Node.js
- **Payments**: Solana Pay protocol
- **DEX**: Jupiter Aggregator (v6 API)
- **Database**: Supabase (PostgreSQL)
- **Monitoring**: Helius WebSocket API
- **AI**: Anthropic Claude (via OpenClaw)
- **Email**: Resend
- **Frontend**: React, Tailwind CSS

---

## 🧠 Why It's an "Agent"

This isn't just a payment processor - **the AI agent makes autonomous decisions**:

1. **Payment Detection** - Monitors blockchain, matches payments to merchants
2. **Conversion Strategy** - Decides whether to convert immediately or wait based on:
   - Current SOL/USDC rate
   - Recent volatility
   - Merchant risk profile (conservative vs aggressive)
   - Historical patterns
3. **Error Recovery** - Retries failed conversions, handles edge cases
4. **Merchant Interaction** - Answers questions via chat interface
5. **Proactive Notifications** - Alerts merchants of important events

**Without the agent, merchants would have to:**
- Manually check for payments
- Decide when to convert
- Handle failed transactions
- Generate accounting reports
- Manage webhooks and notifications

**The agent does all of this autonomously.**

---

## 📁 Project Structure

```
solana-payment-autopilot/
├── src/                      # Core application code
│   ├── agent/               # AI agent logic
│   ├── services/            # Business logic (payments, conversions, etc.)
│   ├── modules/             # Reusable modules (Jupiter, QR codes, etc.)
│   ├── api/                 # REST API server
│   ├── database/            # Database client + queries
│   └── utils/               # Helpers, logger, config
├── merchant-dashboard/       # Merchant UI (React)
├── checkout/                 # Hosted checkout page
├── sdk/                      # JavaScript SDK for merchants
├── demo/                     # Demo merchant website
├── database/                 # Schema + migrations
├── scripts/                  # Utility scripts (testing, fixes)
├── docs/                     # Additional documentation
└── dist/                     # Compiled JavaScript
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm or yarn
- (Optional) Solana CLI for local testing

### 1. Installation
```bash
git clone https://github.com/kshitijofficial/solana-payment-autopilot.git
cd solana-payment-autopilot
npm install
```

### 2. Configuration
```bash
cp .env.example .env
```

Add your API keys to `.env`:
```env
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
HELIUS_API_KEY=your_helius_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Email
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=onboarding@yourdomain.com

# AI (optional - for merchant chat)
ANTHROPIC_API_KEY=your_claude_key
```

### 3. Database Setup
```bash
# Run migrations
node scripts/run-migrations.js
```

### 4. Run the Agent
```bash
npm run dev       # Start agent + API server
```

### 5. Open Merchant Dashboard
```
http://localhost:3000/merchant-dashboard
```

---

## 🎮 Demo Flow

### As a Merchant:
1. Sign up at `/signup`
2. View your dashboard
3. Copy your payment QR code
4. Share with customers
5. Watch payments arrive in real-time
6. Agent auto-converts SOL → USDC
7. Export CSV for accounting

### As a Customer:
1. Visit demo store: `/demo`
2. Click "Buy with Crypto"
3. Scan QR code or copy address
4. Send SOL from any wallet
5. Get instant confirmation email

---

## 📊 Key Features

### ✅ Merchant Onboarding
- Auto-generates Solana wallet (no wallet extension needed)
- Creates QR code for payments
- Provides both SOL address + USDC token account
- One-click signup

### ✅ Real-Time Payment Detection
- Helius WebSocket monitors blockchain
- 15-second polling fallback
- Matches payments to merchants
- Updates dashboard instantly

### ✅ Auto-Conversion (Jupiter)
- Swaps SOL → USDC at best rate
- Configurable slippage (default 1%)
- Simulated on devnet, real swaps on mainnet
- Tracks conversion history

### ✅ AI Decision Engine
- Analyzes market conditions
- Decides conversion timing
- Respects merchant risk profile
- Logs all decisions for audit

### ✅ Payment Requests
- Generate unique payment links
- Hosted checkout page
- JavaScript SDK for e-commerce
- Auto-matches payments to orders

### ✅ Webhooks
- HMAC-secured webhook delivery
- Notify merchant backends
- Retry logic for failed deliveries

### ✅ Notifications
- Email confirmations to merchants
- Email receipts to customers
- Payment + conversion alerts
- Beautiful HTML templates

### ✅ Accounting
- CSV export (QuickBooks compatible)
- Transaction history
- Conversion tracking
- Filter by date/status

### ✅ Merchant Chat
- Ask AI about payments
- Get insights on conversions
- Natural language queries
- Example: "Why did you convert immediately?"

---

## 🔐 Security

- ✅ Private keys encrypted in database
- ✅ HMAC-signed webhooks
- ✅ Rate limiting on API endpoints
- ✅ Input validation + sanitization
- ✅ Secure credential management (.env)

---

## 🌐 Deployment

Currently runs on **devnet** (demo). Ready for mainnet with:
1. Update `SOLANA_NETWORK=mainnet` in `.env`
2. Update RPC URL to mainnet Helius endpoint
3. Fund platform wallet with SOL (for conversion fees)
4. Deploy to VPS/cloud (PM2 recommended)

---

## 📖 Additional Documentation

- [Architecture Deep Dive](./ARCHITECTURE.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [All Documentation](./docs/)

---

## 🛣️ Roadmap

**✅ Hackathon MVP (Complete)**
- [x] Payment monitoring
- [x] Auto-conversion (Jupiter)
- [x] Merchant dashboard
- [x] Hosted checkout
- [x] Email notifications
- [x] AI decision engine
- [x] Payment requests + webhooks
- [x] SDK + demo site

**🚧 Post-Hackathon**
- [ ] Shopify plugin
- [ ] WooCommerce plugin
- [ ] Multi-token support (BONK, USDT, etc.)
- [ ] Tax reporting module
- [ ] Mobile app for merchants
- [ ] Mainnet launch

---

## 🤝 Contributing

Contributions welcome! This is an open-source hackathon project.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🏆 Colosseum Hackathon

- **Agent Name**: openclaw-kshitij
- **Agent #**: 710
- **Verification**: helm-5F6C
- **Twitter**: [@KshitijWeb3](https://twitter.com/KshitijWeb3)

---

## 📬 Contact

- **GitHub**: [@kshitijofficial](https://github.com/kshitijofficial)
- **Telegram**: [@KshitijWeb3](https://t.me/KshitijWeb3)
- **Project Page**: [Colosseum](https://colosseum.com/agent-hackathon/projects/solana-payment-autopilot)

---

**Built with ❤️ for the Solana community**

*Making crypto payments accessible to every merchant, one autonomous agent at a time.*
