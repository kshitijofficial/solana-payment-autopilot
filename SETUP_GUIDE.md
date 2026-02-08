# Setup Guide - Windows

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Git**
3. **Your Supabase credentials** (from dashboard)

---

## Step 1: Get Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/unghlsaqdxmjhfpyurkl
2. Click **Settings** (gear icon, bottom left)
3. Click **API**
4. Copy the **`anon` `public`** key (long JWT token)

---

## Step 2: Update `.env` File

Open `.env` in your project root and update:

```env
SUPABASE_URL=https://unghlsaqdxmjhfpyurkl.supabase.co
SUPABASE_PUBLISHABLE_KEY=<paste your anon key here>
```

**Important:** Use the REAL anon key from your Supabase dashboard, not a placeholder!

---

## Step 3: Install Dependencies

```bash
npm install
cd dashboard
npm install
cd ..
```

---

## Step 4: Start Everything

Open 2 terminals:

### Terminal 1: API Server (with auto payment monitor)
```bash
npm run api
```

You should see:
```
✅ API server running on http://localhost:3000
✅ Payment monitor started (polling every 15s)
Monitoring X merchant wallets
```

### Terminal 2: Dashboard
```bash
npm run dashboard
```

Opens at: http://localhost:5173

---

## Step 5: Create Your First Merchant

1. Open dashboard: http://localhost:5173
2. Click **Create Merchant Account**
3. Enter:
   - Business Name: Your shop name
   - Email: Your email
4. Click **Create**
5. Save the wallet address shown

---

## Step 6: Test Payment Flow

1. **Get Devnet SOL**: Visit https://faucet.solana.com
2. **Send to your wallet**: Use Phantom wallet (switch to devnet)
3. **Wait 15-30 seconds**: Payment monitor polls every 15s
4. **Check dashboard**: Transaction appears automatically!

---

## What Changed (Latest Update)

### ✅ Payment Monitor Auto-Starts
- No need to manually run payment monitor
- Starts automatically when you run `npm run api`
- Monitors all merchant wallets
- Polls every 15 seconds

### ✅ Beautiful New Dashboard
- Modern gradient UI
- Real-time stats (merchants, transactions, volume)
- Better merchant selector
- Improved QR code generator
- Live transaction table with status badges
- Auto-refresh every 10 seconds
- Mobile-friendly responsive design

### ✅ Manual Transaction Processor
If a payment doesn't show up, run:
```bash
npx tsx manual-process-tx.ts
```

This will detect and save any missing transactions.

---

## Troubleshooting

### "Invalid API key" Error
- Check `.env` has the correct `SUPABASE_PUBLISHABLE_KEY`
- Get it from: Supabase Dashboard → Settings → API → anon public key

### Dashboard Shows "Loading..." Forever
- Make sure API server is running on port 3000
- Check `http://localhost:3000/api/health` returns `{"status":"ok"}`

### Transaction Not Showing
- Wait 15-30 seconds (polling interval)
- Check wallet address is correct
- Verify transaction on Solscan: https://solscan.io/?cluster=devnet
- Run manual processor: `npx tsx manual-process-tx.ts`

### Port 3000 Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

---

## Quick Commands

```bash
# Start API + Monitor
npm run api

# Start Dashboard
npm run dashboard

# Manual transaction processor
npx tsx manual-process-tx.ts

# Run all tests
npx tsx day1-complete-test.ts
```

---

## What's Next (Day 2)

Tomorrow we'll add:
- Jupiter SOL→USDC auto-conversion
- Email notifications via Resend
- Conversion status tracking
- Error handling + retries

---

**Need help?** Check the logs in the terminal where you ran `npm run api`.
