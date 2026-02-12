# Quick AI Agent Test Reference Card 🎯

**Merchant:** `Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU`

---

## 🚨 Large Payment Detection

**Send:** `0.35 SOL` (after 3 baseline payments of ~0.06 SOL each)

**Triggers:** Alert when payment is **5x above average**

**Expected Result:**
```
⚠️ Unusual Payment Detected
Large payment significantly above your average.
Review for potential fraud.
```

---

## 📊 Activity Surge Detection  

**Send:** 5 payments within 15 minutes

```
0.10 SOL → wait 2 min
0.12 SOL → wait 2 min  
0.09 SOL → wait 2 min
0.11 SOL → wait 2 min
0.08 SOL
```

**Triggers:** Alert when **5+ payments** in short timeframe

**Expected Result:**
```
📊 High Activity Detected
5 payments in last 15 minutes. 
Unusual spike in volume.
```

---

## 📈 Revenue Forecasting

**Need:** 10+ total payments over time

**Triggers:** Automatically after sufficient data

**Expected Result:**
```
📊 Revenue Forecast
Based on trends: ~$XXX this week
Daily average: X.XX SOL/day
Confidence: 75%
```

---

## 💬 Chat Commands to Test

**Open chat widget (💬) and try:**

1. `"Why did you convert immediately?"`
   → AI explains last decision

2. `"How much have I earned this week?"`
   → AI calculates total

3. `"Should I change my risk profile?"`
   → AI analyzes and recommends

4. `"Convert 10 USDC to SOL"`
   → AI executes swap (if USDC available)

---

## 🎯 Full Test Sequence

```bash
# Baseline (establish average)
Send: 0.05 SOL
Send: 0.08 SOL  
Send: 0.06 SOL
→ Average established: ~0.063 SOL

# Trigger large payment alert
Send: 0.35 SOL
→ 🚨 Alert appears (5.5x above avg)

# Trigger activity surge
Send: 0.10 SOL (now)
Send: 0.12 SOL (2 min later)
Send: 0.09 SOL (2 min later)
Send: 0.11 SOL (2 min later)
Send: 0.08 SOL (2 min later)
→ 📊 Surge alert appears

# Enable forecasting  
Send: 0.07 SOL
Send: 0.05 SOL
→ 📈 Forecast appears (11 payments total)
```

---

## 📍 Where to Look

1. **Dashboard Insights** (top section)
   - Red cards = Alerts
   - Blue cards = Patterns
   - Green cards = Forecasts

2. **Agent Activity** (timeline)
   - Every decision logged
   - Confidence scores
   - Full reasoning

3. **Chat Widget** (bottom-right 💬)
   - Ask questions
   - Get explanations
   - Execute commands

---

## ⏱️ Timing

- **Payment detection:** 15-30 seconds
- **AI decision:** Instant after detection
- **Alerts:** Real-time when threshold hit
- **Forecast:** Updates after each new payment

---

## 🔗 Quick Links

- **Dashboard:** http://localhost:5000
- **Solscan:** https://solscan.io/account/Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU?cluster=devnet
- **Devnet Faucet:** https://faucet.solana.com

---

**Copy merchant address:**
```
Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU
```
