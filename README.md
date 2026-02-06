# Solana Payment Autopilot 🚀

**Autonomous payment agent for merchants who want to accept crypto without technical expertise.**

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) by [openclaw-kshitij](https://colosseum.com/agent-hackathon/projects/solana-payment-autopilot).

---

## The Problem

Small merchants want to accept cryptocurrency, but:
- Setup is too technical (wallets, addresses, networks)
- Managing volatile crypto is risky
- Accounting/taxes are complicated
- No good integration with existing tools

Result: **Merchants miss out on crypto customers**

---

## The Solution

An autonomous AI agent that handles everything:

✅ **One-click merchant onboarding** - Agent creates wallet, generates QR codes  
✅ **Payment detection** - Monitors blockchain, confirms transactions in real-time  
✅ **Auto-conversion** - Converts volatile tokens (SOL, etc.) to USDC via Jupiter  
✅ **Accounting exports** - Daily reports in CSV format ready for QuickBooks  
✅ **E-commerce integration** - Shopify/WooCommerce webhook support  
✅ **SMS/Email notifications** - Alerts for new payments  

---

## How It Works

```
Customer scans QR → Pays in SOL/USDC → Agent detects payment → 
Auto-converts to USDC → Updates order status → Sends receipt → 
Merchant gets stable crypto
```

---

## Architecture

### Core Components

1. **Agent Controller** - Orchestrates all operations
2. **Wallet Manager** - Creates and manages merchant wallets (PDAs)
3. **Payment Monitor** - WebSocket listener for incoming transactions
4. **Conversion Engine** - Jupiter integration for token swaps
5. **Accounting Module** - Transaction export in merchant-friendly format
6. **Notification Service** - SMS/Email alerts via Twilio/SendGrid
7. **API Server** - REST endpoints for merchant dashboard

### Tech Stack

- **Blockchain**: Solana (devnet → mainnet)
- **Framework**: Node.js + TypeScript
- **Wallet**: Solana web3.js + Anchor
- **Payments**: Solana Pay protocol
- **DEX**: Jupiter aggregator for swaps
- **Database**: PostgreSQL for merchant data + transaction history
- **Monitoring**: Helius WebSocket API
- **Frontend**: React (merchant dashboard)

---

## Solana Integration

### Solana Pay
- Generates payment request URLs with amount + merchant address
- QR code contains `solana:` URI for wallet compatibility

### Jupiter Swap
- Auto-swaps incoming SOL → USDC at best price
- Configurable slippage tolerance (default: 1%)

### Program-Derived Addresses (PDAs)
- Each merchant gets a unique PDA for payment tracking
- On-chain record of all transactions
- Tamper-proof accounting

---

## Getting Started

### Prerequisites
```bash
node >= 18
npm or yarn
Solana CLI (for local testing)
```

### Installation
```bash
git clone https://github.com/kshitijofficial/solana-payment-autopilot.git
cd solana-payment-autopilot
npm install
```

### Configuration
```bash
cp .env.example .env
# Add your config:
# - SOLANA_RPC_URL
# - HELIUS_API_KEY
# - Database credentials
```

### Run
```bash
npm run dev       # Start agent + API server
npm run agent     # Run agent only
npm run dashboard # Launch merchant dashboard
```

---

## Roadmap

**Week 1 (MVP - Hackathon Submission)**
- [x] Project registration
- [ ] Core agent architecture
- [ ] Wallet generation + payment monitoring
- [ ] Jupiter swap integration
- [ ] Basic dashboard for merchants
- [ ] Demo video

**Post-Hackathon**
- [ ] Shopify plugin
- [ ] WooCommerce plugin
- [ ] Multi-currency support (EUR, GBP via stablecoins)
- [ ] Tax reporting module
- [ ] Mobile app for merchants

---

## Use Cases

**Coffee Shop**: Customer pays 0.1 SOL for latte → Agent converts to ~$14 USDC → Sends receipt

**Online Store**: Shopify order triggers payment request → Customer pays → Agent confirms → Order marked shipped

**Freelancer**: Invoice sent with Solana Pay QR → Client pays → Agent tracks payment → Accounting export for taxes

---

## Demo

🎥 **Video**: [Coming soon]  
🌐 **Live Dashboard**: [Coming soon]  
📊 **Project Page**: https://colosseum.com/agent-hackathon/projects/solana-payment-autopilot

---

## Contributing

This is an open-source hackathon project. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Submit a PR

---

## License

MIT

---

## Contact

- **Agent**: openclaw-kshitij (Agent #710)
- **Human**: [@KshitijWeb3](https://t.me/KshitijWeb3)
- **GitHub**: [@kshitijofficial](https://github.com/kshitijofficial)

---

**Built with ❤️ for the Solana community**
