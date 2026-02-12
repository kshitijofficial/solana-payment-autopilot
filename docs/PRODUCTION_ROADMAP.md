# Production Roadmap - Demo-Ready Build

## Goal
Create a fully working Solana Payment Autopilot that you can demo in a video showing real merchant workflow.

## Must-Have Features for Demo

### ✅ Phase 1: Core Payment Flow (Day 1-2)
**Objective:** End-to-end payment works on devnet

- [ ] **Merchant Onboarding**
  - Create merchant account (business name, email)
  - Generate Solana wallet (keypair + PDA)
  - Store encrypted keys in database
  - Return merchant dashboard credentials

- [ ] **Payment QR Generation**
  - Merchant enters amount (e.g., $5 coffee)
  - Agent generates Solana Pay URL with merchant address
  - Display QR code in dashboard
  - Support both SOL and USDC payments

- [ ] **Real-time Payment Detection**
  - Helius WebSocket monitors merchant address
  - Detect incoming SOL/USDC transactions
  - Verify amount matches expected
  - Confirm transaction finality (32 confirmations)

- [ ] **Dashboard Updates**
  - Live transaction feed (WebSocket to frontend)
  - Show: timestamp, amount, status (pending → confirmed)
  - Display wallet balance (SOL + USDC)

**Demo Script:**
1. Onboard merchant "Joe's Coffee"
2. Create payment for $5 latte
3. Show QR code
4. Pay from Phantom wallet (devnet SOL)
5. Watch transaction appear in dashboard in <5 seconds

---

### ✅ Phase 2: Auto-Conversion (Day 3)
**Objective:** Agent automatically swaps SOL → USDC

- [ ] **Jupiter Integration**
  - Get swap quote (SOL → USDC)
  - Execute swap transaction
  - Handle slippage (1% tolerance)
  - Store swap signature

- [ ] **Conversion Logic**
  - When SOL payment confirmed → trigger swap
  - Skip if payment is already in USDC
  - Update merchant balance (show USDC received)

- [ ] **Error Handling**
  - Retry failed swaps (max 3 attempts)
  - Alert merchant if swap fails
  - Manual retry option in dashboard

**Demo Script:**
1. Customer pays 0.1 SOL
2. Agent detects payment
3. Auto-swaps to ~$15 USDC
4. Merchant sees stable balance

---

### ✅ Phase 3: Accounting & Notifications (Day 4)
**Objective:** Merchant gets reports and alerts

- [ ] **Transaction History**
  - Paginated list of all payments
  - Filter by date range, status
  - Show: date, order ID, amount in/out, USD value, fee

- [ ] **CSV Export**
  - Download accounting report
  - QuickBooks-compatible format
  - Columns: Date, Description, Amount, Fee, Net, Status

- [ ] **Email Notifications**
  - Send alert when payment received
  - Include: amount, USD value, order ID
  - Use SendGrid or Resend

**Demo Script:**
1. Show 5+ transactions in history
2. Download CSV report
3. Open in Excel/Google Sheets
4. Show email notification

---

### ✅ Phase 4: Polish & Production Deploy (Day 5)
**Objective:** Make it look professional for video

- [ ] **Dashboard UI**
  - Clean merchant interface (React)
  - Show wallet balance prominently
  - Transaction feed with live updates
  - Settings page (notification preferences)

- [ ] **Production Deployment**
  - Deploy backend to Railway/Render
  - Deploy frontend to Vercel
  - Use Supabase for PostgreSQL
  - Connect to Helius mainnet WebSocket

- [ ] **Demo Data**
  - Seed database with sample merchant
  - Pre-load 3-5 test transactions
  - Show realistic business names

- [ ] **Video Prep**
  - Write script
  - Test full flow 3x
  - Record screen + voiceover
  - Upload to YouTube

---

## Out of Scope for MVP (Post-Hackathon)

- Shopify/WooCommerce integration (just show webhooks concept)
- SMS notifications (email is enough)
- Multi-merchant support (one demo merchant is fine)
- Fraud detection
- Recurring billing

---

## Tech Stack - Final Decisions

### Backend
- Node.js + TypeScript
- Express.js for API
- PostgreSQL (Supabase)
- Helius RPC + WebSocket
- Jupiter API for swaps

### Frontend
- React + Vite
- TailwindCSS
- Recharts for analytics
- Socket.io for live updates

### Deployment
- Backend: Railway (free tier)
- Frontend: Vercel (free tier)
- Database: Supabase (free tier)
- Total cost: $0

---

## Testing Plan

### Manual Tests
1. **Happy path**: Payment → Detection → Swap → Notification
2. **USDC direct**: Customer pays USDC (no swap needed)
3. **Large amount**: 1 SOL payment (~$150)
4. **Multiple payments**: 3 payments in 1 minute
5. **Failed swap**: Simulate Jupiter API error

### Devnet vs Mainnet
- Build on devnet first (free testing)
- Final demo on mainnet with real (small) amounts
- Use devnet for video recording (to avoid fees)

---

## Timeline

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Onboarding + QR generation | Merchant can create payment link |
| Day 2 | Payment detection | Dashboard shows incoming tx |
| Day 3 | Jupiter swap integration | Auto-convert SOL → USDC |
| Day 4 | Reports + notifications | CSV export + email alerts |
| Day 5 | Deploy + video | Live demo + YouTube upload |

**Target completion**: 5 days from today = **February 13, 2026**

---

## Success Metrics for Demo

✅ **Working demo** showing full payment flow  
✅ **Video** showing real transactions on devnet  
✅ **Dashboard** with live updates  
✅ **CSV export** with real transaction data  
✅ **Deployed** to public URL (shareable link)  

**Bonus points:**
- Show mainnet transaction (even if just $1 worth)
- Add analytics dashboard (total volume, # transactions)
- Mobile-responsive UI

---

## Questions to Answer Before Starting

1. **Database schema finalized?** (merchants, transactions, wallets tables)
2. **Helius API key ready?** (need for WebSocket)
3. **Jupiter on devnet?** (verify it works with devnet tokens)
4. **Dashboard design?** (wireframe or just build as we go?)
5. **Demo merchant details?** (business name, logo, etc.)

Let's knock this out! 🚀
