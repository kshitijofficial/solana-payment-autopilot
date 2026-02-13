# Database Setup Guide

**Quick 5-minute guide to set up your Supabase database for Solana Payment Autopilot**

---

## 📋 What Tables Get Created?

The platform uses **8 main tables:**

### Core Tables:
1. **`merchants`** - Business accounts using the platform
   - Includes `risk_profile` (conservative/moderate/aggressive)
2. **`transactions`** - All incoming SOL payments
3. **`conversions`** - SOL→USDC swaps executed by AI
4. **`wallets`** - Encrypted merchant wallet keys
5. **`notifications`** - Email/SMS/webhook delivery logs
6. **`payment_requests`** - Hosted checkout payment links

### AI Agent Tables:
7. **`agent_decisions`** - Audit trail of all AI decisions
8. **`agent_learnings`** - AI knowledge accumulated over time

---

## 🚀 Setup Steps

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Click **"New Project"**
3. Choose a name (e.g., `solana-payment-autopilot`)
4. Pick a region close to you
5. Set a strong database password (save it!)
6. Click **"Create project"** (takes ~2 minutes)

### 2. Run Database Setup Script

Once your project is ready:

1. Click **"SQL Editor"** in the left sidebar
2. Click **"+ New query"**
3. Copy the **ENTIRE** contents of `database/COMPLETE_SETUP.sql`
4. Paste into the SQL editor
5. Click **"RUN"** (bottom-right)

**Expected output:**
```
✅ SUCCESS! All 8 tables created successfully.
✅ Database is ready to use!
```

### 3. Get Your Credentials

1. Click **"Project Settings"** (gear icon, bottom-left)
2. Click **"API"** in the settings menu
3. Copy these values:

**Project URL:**
```
https://your-project.supabase.co
```

**Anon/Public Key:**
```
eyJhbGciOi...your-long-key-here...
```

### 4. Configure `.env` File

Back in your project folder:

```bash
cd solana-payment-autopilot
cp .env.example .env
nano .env  # or use your favorite editor
```

Update these lines:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

### 5. Verify Connection

Test that your setup works:

```bash
npm run db:check
```

**Expected output:**
```
✅ Connected to Supabase
✅ Tables found:
  • merchants (0 rows)
  • transactions (0 rows)
  • conversions (0 rows)
  • wallets (0 rows)
  • notifications (0 rows)
  • payment_requests (0 rows)
  • agent_decisions (0 rows)
  • agent_learnings (0 rows)
```

---

## 🔍 Understanding the Tables

### `merchants` Table
**Stores merchant accounts:**
- `id` - Unique identifier (UUID)
- `business_name` - Shop name (e.g., "Joe's Coffee")
- `email` - Contact email
- `wallet_address` - Solana public key for receiving payments
- `risk_profile` - **NEW!** AI conversion strategy:
  - `conservative` (default) - Convert immediately
  - `moderate` - Balance risk/opportunity
  - `aggressive` - Optimize for gains
- `auto_convert_enabled` - Auto-convert SOL→USDC?
- `network` - `devnet` or `mainnet`

### `transactions` Table
**Logs all incoming payments:**
- `signature` - Solana transaction hash
- `from_address` - Customer's wallet
- `to_address` - Merchant's wallet
- `amount` - Amount in SOL (e.g., 0.15)
- `usd_value` - Estimated USD value at payment time
- `status` - `pending`, `confirmed`, or `failed`
- `network` - Which Solana network

### `conversions` Table
**Tracks SOL→USDC swaps:**
- `transaction_id` - Links to original payment
- `from_amount` - SOL received
- `to_amount` - USDC after conversion
- `swap_signature` - Jupiter swap transaction
- `status` - `pending`, `completed`, or `failed`

### `agent_decisions` Table
**AI audit trail:**
- `decision_type` - `conversion_timing`, `fraud_detection`, etc.
- `decision` - `convert_now`, `wait`, `monitor`
- `confidence` - 0-100 (how confident the AI was)
- `reasoning` - **Full explanation** of why AI made this choice
- `context` - Market data, merchant profile, transaction details

### `payment_requests` Table
**Hosted checkout links:**
- `payment_id` - Human-readable ID (e.g., `pr_abc123`)
- `amount_usd` - Price in USD
- `amount_sol` - SOL equivalent (calculated at creation)
- `order_id` - Merchant's order reference
- `callback_url` - Webhook to notify merchant
- `status` - `pending`, `paid`, `expired`
- `payment_url` - Full checkout page URL

---

## 🔧 Optional: Manual Table Creation

If you prefer to run SQL files individually:

1. **Core schema:**
   ```bash
   database/schema.sql
   ```

2. **Add AI agent tables:**
   ```bash
   migrations/004_agent_decisions.sql
   ```

3. **Add risk profile:**
   ```bash
   migrations/005_add_risk_profile.sql
   ```

4. **Add network support:**
   ```bash
   migrations/RUN_ALL_MIGRATIONS.sql
   ```

**Or just use `COMPLETE_SETUP.sql` - it includes everything! ✅**

---

## 🛠️ Troubleshooting

### "relation already exists"
**This is fine!** It means tables were already created. The setup script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### "permission denied"
Make sure you're using the **anon/public key**, not the **service role key**. The anon key is safe for client-side use.

### "connection refused"
1. Check your Supabase URL is correct
2. Make sure your project is **not paused** (free tier auto-pauses after 7 days of inactivity)
3. Go to Supabase dashboard → click "Resume project"

### Tables not showing in Supabase dashboard
1. Click **"Table Editor"** in Supabase sidebar
2. Refresh the page
3. Tables should appear under "public" schema

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] Supabase project created
- [ ] COMPLETE_SETUP.sql executed successfully
- [ ] 8 tables visible in Table Editor
- [ ] SUPABASE_URL added to .env
- [ ] SUPABASE_PUBLISHABLE_KEY added to .env
- [ ] `npm run db:check` passes

---

## 📚 Next Steps

Once database is ready:

1. **Configure other API keys** (Helius, Resend, Anthropic)
2. **Start the API server:**
   ```bash
   npm run api
   ```
3. **Create your first merchant:**
   - Visit http://localhost:8888
   - Fill in business details
   - Get your merchant ID

4. **Test payment flow:**
   - See [QUICKSTART.md](./QUICKSTART.md)

---

## 🆘 Need Help?

- **Database issues:** https://supabase.com/docs
- **Project issues:** Open an issue on GitHub
- **General questions:** Check [README.md](./README.md)

---

**Database setup complete! 🎉**
