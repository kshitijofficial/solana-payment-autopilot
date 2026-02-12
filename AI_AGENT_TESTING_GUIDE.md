# AI Agent Intelligence Testing Guide 🤖

**Merchant Address:** `Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU`

This guide helps you test all AI agent intelligence features by sending specific payment patterns.

---

## 🎯 AI Features to Test

| Feature | Trigger Condition | What AI Does |
|---------|------------------|--------------|
| **Large Payment Detection** | Payment **5x above** merchant average | 🚨 Alert: "Unusual payment detected - review for fraud" |
| **Activity Surge Detection** | **5+ payments** in 3 hours (unusual pattern) | 📊 Alert: "High activity spike detected" |
| **Revenue Forecasting** | **10+ payments** over 7 days | 📈 Predicts next week's revenue based on trends |
| **Price Alerts** | SOL crosses **$160 (high)** or **$135 (low)** | 📈/📉 Notifies about conversion opportunities |
| **Pattern Detection** | Repeat customer or round number preferences | 👤 Identifies top customers + payment habits |
| **Smart Recommendations** | Volume **increases 50%+** this week | 💡 Suggests risk profile changes |
| **Conversion Decisions** | Every payment | 🧠 AI decides: convert now, wait, or monitor |

---

## 📋 Test Payment Sequence

Send these payments to trigger all AI features:

### **Phase 1: Establish Baseline (3 payments)**

These create an average payment size (~0.06 SOL) for comparison:

```bash
# Payment 1: 0.05 SOL
# Payment 2: 0.08 SOL
# Payment 3: 0.06 SOL

Average: 0.063 SOL
```

**Expected AI behavior:**
- ✅ Detects payments within 15 seconds
- ✅ Makes conversion decision for each
- ✅ Logs reasoning (check dashboard "Agent Activity")
- ✅ No alerts (normal activity)

---

### **Phase 2: Trigger Large Payment Alert**

**Wait 2-3 minutes, then send:**

```bash
# Payment 4: 0.35 SOL (5.5x above 0.063 average)
```

**Expected AI Alert:**
```
🚨 Unusual Payment Detected
Large payment significantly above your average.
Amount: 0.35 SOL
Average: 0.063 SOL
Ratio: 5.5x
Action: Review for potential fraud
Priority: HIGH
```

**Where to see:**
- Dashboard "Insights" section
- Admin panel (if using platform view)
- Email notification (if configured)

---

### **Phase 3: Trigger Activity Surge Alert**

**Send 5 rapid payments (within 15 minutes):**

```bash
# Payment 5: 0.10 SOL (now)
# Payment 6: 0.12 SOL (wait 2 min)
# Payment 7: 0.09 SOL (wait 2 min)
# Payment 8: 0.11 SOL (wait 2 min)
# Payment 9: 0.08 SOL (wait 2 min)
```

**Expected AI Alert:**
```
📊 High Activity Detected
5 payments in last 15 minutes. Unusual spike in volume.
Normal pattern: 1-2 payments per hour
Current rate: 20 payments/hour equivalent
Priority: MEDIUM
```

**Where to see:**
- Dashboard "Insights" panel
- Real-time notification popup
- Agent activity log

---

### **Phase 4: Revenue Forecasting**

**Send 2 more payments:**

```bash
# Payment 10: 0.07 SOL
# Payment 11: 0.05 SOL
```

**Now you have 11 payments total.**

**Expected AI Forecast:**
```
📊 Revenue Forecast
Based on trends: ~$XXX this week
Daily average: 0.XX SOL/day
Pattern: Growing (or Stable/Declining)
Confidence: 75%
Priority: LOW
```

**Calculation:**
- Total: ~1.16 SOL
- Daily avg: 1.16 SOL / (time span in days)
- Weekly projection: daily_avg × 7 × $150/SOL

**Where to see:**
- Dashboard "Insights" → "Forecast" card
- Export in CSV with predictions
- Chat with AI: "What's my revenue forecast?"

---

### **Phase 5: Test Conversational AI**

**Open chat widget** (💬 bottom-right of dashboard):

**Questions to ask:**

1. **"Why did you convert immediately?"**
   ```
   Expected: AI explains its reasoning for last conversion
   "I converted immediately because you have a conservative 
   risk profile and market volatility was moderate. 
   Confidence: 85%"
   ```

2. **"How much have I earned this week?"**
   ```
   Expected: AI calculates total + USD value
   "This week: 1.16 SOL (~$174 at current rates)
   11 transactions total
   Average: 0.105 SOL per transaction"
   ```

3. **"Should I change my risk profile?"**
   ```
   Expected: AI analyzes patterns and recommends
   "Your volume increased 300% this week. Consider 
   switching from conservative to moderate for better 
   conversion timing and potential 2-3% gains."
   ```

4. **"Convert 10 USDC to SOL"** (if you have USDC)
   ```
   Expected: AI executes the swap
   "✅ Successfully converted 10 USDC to 0.067 SOL!
   Transaction: mock_xxx (devnet)
   Rate: $149.25/SOL"
   ```

---

## 🧪 Manual Testing Instructions

### **Option A: Use Phantom Wallet (Easiest)**

1. Install Phantom wallet browser extension
2. Switch to **devnet** (Settings → Developer Settings → Testnet Mode)
3. Request devnet SOL: https://faucet.solana.com
4. Send payments to: `Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU`
5. Follow the payment sequence above

### **Option B: Use Solana CLI**

```bash
# Switch to devnet
solana config set --url devnet

# Request airdrop
solana airdrop 2

# Send payments (replace <AMOUNT> with values from sequence)
solana transfer Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU <AMOUNT>

# Example:
solana transfer Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU 0.05
```

### **Option C: Use Test Script (once airdrop works)**

```bash
# This will send all payments automatically
npx tsx scripts/send-test-payments.ts
```

---

## 📊 Where to See AI Insights

### **1. Merchant Dashboard (http://localhost:5000)**

**After login with merchant ID:**

**Insights Panel (top section):**
- 🚨 Alerts (red cards with warning icon)
- 📊 Patterns (blue cards with chart icon)
- 💡 Recommendations (yellow cards with lightbulb)
- 📈 Forecasts (green cards with trend icon)

**Agent Activity Timeline (middle section):**
- Every conversion decision
- Confidence scores (0-100%)
- Reasoning explanations
- Market conditions at decision time
- Timestamps

**Chat Widget (bottom-right):**
- Click 💬 to open
- Ask natural language questions
- Execute commands (convert USDC, etc.)

### **2. Admin Panel (http://localhost:3001)**

**Platform-wide view:**
- All merchant insights aggregated
- Cross-merchant patterns
- Platform health metrics
- Bulk data exports

### **3. Database (direct query)**

```bash
# View all AI decisions
npx tsx scripts/check-database.ts

# Look for agent_decisions table
# Each row contains:
# - decision (convert_now/wait/monitor)
# - confidence (0.0 to 1.0)
# - reasoning (full explanation)
# - market_conditions (JSON with price, volatility, etc.)
```

---

## 🔍 Verification Checklist

After running all test payments, verify:

### **✅ Large Payment Detection**
- [ ] Alert appears in dashboard Insights
- [ ] Priority marked as HIGH
- [ ] Shows amount vs average comparison
- [ ] Suggests "Review for fraud"

### **✅ Activity Surge Detection**
- [ ] Alert appears after 5 rapid payments
- [ ] Shows payment count + timeframe
- [ ] Priority marked as MEDIUM
- [ ] Identifies "unusual spike"

### **✅ Revenue Forecasting**
- [ ] Forecast appears in Insights after 10+ payments
- [ ] Shows weekly projection in USD
- [ ] Displays daily average
- [ ] Confidence level shown

### **✅ Conversion Decisions**
- [ ] Every payment has decision logged
- [ ] Confidence scores visible (0-100%)
- [ ] Reasoning includes merchant profile + market conditions
- [ ] Decisions vary based on amount/timing

### **✅ Conversational AI**
- [ ] Chat widget opens
- [ ] AI responds to "Why did you convert?"
- [ ] AI calculates earnings for "How much earned?"
- [ ] AI recommends risk profile changes
- [ ] "Convert X USDC to SOL" executes swap (if USDC available)

### **✅ Pattern Detection**
- [ ] Identifies repeat customer (same sender)
- [ ] Shows top customer by volume
- [ ] Detects payment timing patterns
- [ ] Notes round number preferences (if applicable)

---

## 🐛 Troubleshooting

### **Payments not appearing in dashboard:**
- Wait 15-30 seconds (polling interval)
- Check wallet address is correct
- Verify on Solscan: https://solscan.io/account/Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU?cluster=devnet
- Run: `npx tsx scripts/manual-process-tx.ts`

### **AI insights not showing:**
- Check ANTHROPIC_API_KEY in `.env`
- Verify you have 10+ transactions
- Look in Agent Activity section (might be there instead of Insights)
- Try chat interface: "Show me insights"

### **Chat not responding:**
- Verify ANTHROPIC_API_KEY is set
- Check browser console for errors
- Refresh dashboard and try again
- Check API logs: `tail -f logs/combined.log`

### **Conversion decisions seem random:**
- AI adapts to merchant profile (check settings)
- Small payments → more aggressive
- Large payments → more conservative
- Check reasoning in Agent Activity log

---

## 📸 Screenshots to Capture

For demo/documentation purposes, capture:

1. **Normal payment** → AI decision popup with reasoning
2. **Large payment alert** → Red warning card in Insights
3. **Activity surge alert** → Blue pattern card
4. **Revenue forecast** → Green forecast card with numbers
5. **Chat interaction** → "Why did you convert?" + AI response
6. **Agent Activity log** → List of decisions with confidence scores
7. **CSV export** → Show AI decisions in Excel/spreadsheet

---

## 🎥 Demo Video Script

If recording AI features for video:

1. **[0:00-0:30] Setup**
   - Show clean dashboard
   - Explain you'll trigger AI features

2. **[0:30-1:00] Normal payments**
   - Send 3 baseline payments
   - Show AI making decisions
   - Highlight confidence scores

3. **[1:00-1:30] Large payment alert**
   - Send 0.35 SOL payment
   - Alert appears immediately
   - Explain fraud detection

4. **[1:30-2:00] Activity surge**
   - Send 5 rapid payments
   - Show surge alert
   - Explain pattern detection

5. **[2:00-2:30] Revenue forecast**
   - Show forecast card
   - Explain how AI predicts
   - Mention confidence level

6. **[2:30-3:00] Chat with AI**
   - Ask "Why did you convert?"
   - Show AI reasoning
   - Try "Convert 10 USDC to SOL"

7. **[3:00-3:30] Wrap-up**
   - Show Agent Activity log
   - Highlight full audit trail
   - Mention this is what makes it an "agent"

---

## 💡 Additional Tests

### **Test Different Merchant Profiles**

Create 3 merchants with different risk profiles:

1. **Conservative** → Should always convert immediately
2. **Moderate** → Should sometimes wait for better rates
3. **Aggressive** → Should wait more often, target higher prices

Compare AI decisions for the same payment amount across profiles.

### **Test Market Conditions**

- Morning vs evening (different SOL prices)
- High volatility periods
- Price trends (upward vs downward)

AI should adapt decisions based on these factors.

---

## 🚀 Ready to Test!

**Quick Start:**
1. Open dashboard: http://localhost:5000
2. Login with your merchant ID
3. Start sending test payments using Phantom or CLI
4. Watch AI insights appear in real-time!

**Questions?** Check logs or chat with the AI agent directly!

---

**Merchant Address (copy this):**
```
Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU
```

**Solscan (view transactions):**
https://solscan.io/account/Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU?cluster=devnet
