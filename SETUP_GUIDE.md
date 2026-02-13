# Setup Guide 🚀

Complete installation and configuration guide for Solana Payment Autopilot.

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Git**
- **Solana CLI** (optional, for local testing)

### API Keys Required

You'll need accounts with these services:

| Service | Purpose | Free Tier | Sign Up |
|---------|---------|-----------|---------|
| **Helius** | Solana RPC + WebSocket | 1M requests/month | https://helius.dev |
| **Supabase** | PostgreSQL database | Free forever | https://supabase.com |
| **Resend** | Email notifications | 3,000 emails/month | https://resend.com |
| **Anthropic** | AI agent (required for agentic features) | $5 credit | https://anthropic.com |

---

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/kshitijofficial/solana-payment-autopilot.git
cd solana-payment-autopilot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Solana Configuration
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
SOLANA_NETWORK=devnet
HELIUS_API_KEY=your_helius_api_key_here

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here

# Email Notifications (Resend)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@yourdomain.com

# AI Agent (Required for agentic conversion, chat, insights)
ANTHROPIC_API_KEY=your_claude_api_key_here

# Jupiter Aggregator (Optional - defaults provided)
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### 4. Set Up Database

Run migrations to create tables:
```bash
npm run db:migrate
```

**Verify connection:**
```bash
npm run db:check
```

You should see:
```
✅ Connected to Supabase
✅ Tables: merchants, transactions, conversions, payment_requests, agent_decisions
```

---

## 🎮 Running the Application

### Quick Start (Recommended)

**Full platform with admin panel:**
```bash
npm run start:platform
```

**Or merchant-only demo:**
```bash
npm run start:all
```

**Access the services:**
- Admin Panel: http://localhost:3001
- Merchant Signup: http://localhost:8888
- Merchant Login: http://localhost:5000/login.html
- Demo Store: http://localhost:8080
- API: http://localhost:3000

### Individual Services

Run services separately for development:

```bash
# Terminal 1: API Server
npm run api

# Terminal 2: Admin Panel (optional)
npm run admin

# Terminal 3: Merchant Dashboard
cd merchant-dashboard && python -m http.server 5000

# Terminal 4: Signup Page
cd signup && python -m http.server 8888

# Terminal 5: Demo Store
cd demo && python -m http.server 8080
```

---

## ✅ Verification

### 1. API Health Check
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 2. Database Connection
```bash
npm run db:check
```

Expected: List of tables with row counts

### 3. Create Test Merchant

Visit http://localhost:8888 (signup page):
1. Enter business name: "Test Shop"
2. Enter email: test@example.com
3. Click "Create Merchant Account"
4. Save the merchant ID shown

### 4. Test Payment Flow

**Using Solana CLI (devnet):**
```bash
solana config set --url devnet
solana airdrop 1
solana transfer <MERCHANT_WALLET_ADDRESS> 0.1
```

**Or use Phantom wallet:**
1. Switch to devnet
2. Airdrop SOL from https://faucet.solana.com
3. Send to merchant wallet address

**Check dashboard:**
- Visit http://localhost:5000/login.html
- Enter your merchant ID
- Transaction should appear within 15-30 seconds

---

## 🔧 Configuration Options

### Network Selection

**For devnet (demo):**
```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

**For mainnet (production):**
```env
SOLANA_NETWORK=mainnet
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Payment Monitoring

**Polling interval** (default: 15 seconds)
Edit `src/modules/PaymentMonitor.ts`:
```typescript
private pollingInterval = 15000; // milliseconds
```

### Conversion Settings

**Auto-conversion enabled by default** for new merchants.

To change default behavior, edit `database/migrations/001_create_merchants.sql`:
```sql
auto_convert_enabled BOOLEAN DEFAULT true
```

### Email Templates

Customize email templates in:
- `src/services/EmailService.ts`
- HTML templates with merchant branding

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Agent Tests (AI Features)
```bash
npm run test:agent
```

**What it tests:**
- ✅ Agentic conversion decisions (market analysis, risk profiles)
- ✅ Merchant chat interface (questions, swap commands)
- ✅ Agent insights (forecasting, alerts, patterns)
- ✅ Decision audit trail logging

**To test AI chat manually:**
1. Visit merchant dashboard: http://localhost:5000
2. Click "Chat with Agent" in bottom-right
3. Try commands:
   - "Why did you convert immediately?"
   - "Convert 10 USDC to SOL"
   - "Show me my revenue forecast"
4. Check decision trail in admin panel: http://localhost:3001

### Database Tests
```bash
npm run test:db
```

### End-to-End Test
```bash
npx tsx scripts/test-integration.ts
```

---

## 🐛 Troubleshooting

### API Server Won't Start

**Check port availability:**
```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

**Kill existing process:**
```bash
# Linux/Mac
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

### Database Connection Failed

1. Verify credentials in `.env`
2. Check Supabase project is active
3. Confirm database tables exist:
   ```bash
   npm run db:check
   ```
4. Re-run migrations if needed:
   ```bash
   npm run db:migrate
   ```

### Payments Not Detected

1. **Verify network**: Ensure using devnet
2. **Check RPC**: Test Helius endpoint
3. **Confirm wallet address**: Verify in Supabase `merchants` table
4. **Wait 15-30 seconds**: Polling interval
5. **Check logs**: `tail -f logs/combined.log`
6. **Manual trigger**: 
   ```bash
   npx tsx scripts/manual-process-tx.ts
   ```

### Email Notifications Not Sending

1. **Verify Resend API key** in `.env`
2. **Check email address verified** in Resend dashboard
3. **Review free tier limits** (3,000/month)
4. **Check logs** for error messages

### Admin Dashboard Shows No Merchants

1. Create merchant via signup: http://localhost:8888
2. Verify in database:
   ```bash
   npx tsx scripts/check-database.ts
   ```
3. Refresh admin panel: http://localhost:3001

---

## 📦 Production Deployment

### Environment Variables

Set all `.env` variables in your hosting platform.

### Database

Supabase production instance (or self-hosted PostgreSQL).

### API Server

Deploy to:
- Railway
- Render
- AWS EC2
- DigitalOcean
- Heroku

### Static Files

Deploy merchant dashboard, signup, demo to:
- Vercel
- Netlify
- CloudFlare Pages
- AWS S3 + CloudFront

### Admin Panel (React)

Build and deploy:
```bash
cd dashboard
npm run build
# Deploy dist/ folder to Vercel/Netlify
```

### Mainnet Checklist

- [ ] Update `SOLANA_NETWORK=mainnet`
- [ ] Update RPC URL to mainnet Helius endpoint
- [ ] Fund platform wallet with SOL for fees
- [ ] Test with small amounts first
- [ ] Monitor error logs closely
- [ ] Set up alerts (Sentry, LogRocket)

---

## 🔐 Security Best Practices

1. **Never commit `.env` to git**
2. **Use environment variables** for all secrets
3. **Enable rate limiting** on API endpoints
4. **Validate all inputs** (XSS, SQL injection)
5. **Use HTTPS** in production
6. **Secure webhook signatures** (HMAC verification)
7. **Rotate API keys** regularly
8. **Monitor suspicious activity** (large payments, rapid transactions)

---

## 📚 Additional Resources

- **Main README**: [README.md](./README.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **All Docs**: [docs/](./docs/)

---

## 🆘 Need Help?

- **Issues**: https://github.com/kshitijofficial/solana-payment-autopilot/issues
- **Telegram**: [@KshitijWeb3](https://t.me/KshitijWeb3)
- **Logs**: Check `logs/combined.log` and `logs/error.log`

---

**Ready to accept crypto payments! 🎉**
