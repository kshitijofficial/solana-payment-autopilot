# Agentic Conversion System Setup

## Overview

The Smart Conversion Agent uses Claude (Anthropic) to make intelligent, context-aware decisions about when to convert SOL payments to USDC. Instead of always converting immediately, the agent analyzes:

- Current market price & volatility
- Merchant risk profile
- Transaction size relative to history
- Time since payment received
- Market trends

## Setup Instructions

### 1. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Add to Environment

Edit `.env` file and replace the placeholder:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 3. Run Database Migration

Create the `agent_decisions` and `agent_learnings` tables:

```bash
# Using Supabase SQL Editor (recommended):
# 1. Go to https://app.supabase.com/project/unghlsaqdxmjhfpyurkl/editor/sql
# 2. Copy contents of migrations/004_agent_decisions.sql
# 3. Run the migration

# OR using psql:
psql $DATABASE_URL < migrations/004_agent_decisions.sql
```

### 4. Test the Agent

Start the API server:

```bash
npm run api
```

Trigger a test payment and watch the logs for agent reasoning:

```
🤖 Agent analyzing conversion decision for 0.05 SOL
🧠 Agent decision: wait (85% confidence)
💭 Reasoning: Current volatility is low and SOL shows upward trend. 
   Conservative merchant but small transaction size allows waiting 15 
   minutes for potential $0.50-1.00 gain with minimal downside risk.
```

## How It Works

### Decision Flow

```
Payment Received
    ↓
Gather Context (price, volatility, merchant profile, history)
    ↓
AI Agent Analyzes (Claude Sonnet 4)
    ↓
Decision: convert_now | wait | monitor
    ↓
Log Decision (audit trail + learning)
    ↓
Execute or Schedule Conversion
    ↓
Log Outcome (for future learning)
```

### Agent Reasoning Factors

**Merchant Risk Profile:**
- Conservative: Prioritize stability, convert quickly
- Moderate: Balance risk/reward
- Aggressive: Willing to wait for better rates

**Market Conditions:**
- High volatility → Convert faster
- Low volatility → More room to wait
- Upward trend → Consider waiting
- Downward trend → Convert immediately

**Transaction Size:**
- Small (< 0.1 SOL): More experimental
- Medium (0.1-0.5 SOL): Balanced approach
- Large (> 0.5 SOL): More conservative

**Time Sensitivity:**
- Fresh (< 5 min): Maximum flexibility
- Aging (5-15 min): Start considering conversion
- Old (> 15 min): Lean toward converting

## Configuration

Set merchant risk profile when creating merchant:

```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Coffee Shop",
    "email": "owner@shop.com",
    "riskProfile": "conservative"
  }'
```

Risk profiles:
- `conservative`: Minimize volatility exposure (default)
- `moderate`: Balance risk and opportunity
- `aggressive`: Maximize potential gains

## Agent Learning

The system tracks all decisions and outcomes in the database:

```sql
-- View agent decisions
SELECT * FROM agent_decisions 
ORDER BY created_at DESC 
LIMIT 10;

-- View agent learnings
SELECT * FROM agent_learnings 
ORDER BY success_rate DESC;

-- Compare estimated vs actual USD value
SELECT 
  decision,
  AVG(estimated_usd_value) as avg_estimated,
  AVG(actual_usd_value) as avg_actual,
  AVG(actual_usd_value - estimated_usd_value) as avg_gain_loss
FROM agent_decisions
WHERE actual_usd_value IS NOT NULL
GROUP BY decision;
```

Over time, the agent can learn from past decisions to improve future ones.

## Monitoring

Watch the agent's reasoning in real-time:

```bash
# Tail the logs
npm run api | grep "🤖\|🧠\|💭"
```

## Benefits vs Traditional Automation

**Before (Automation):**
```
Payment received → Immediately convert → Done
```
- No context awareness
- Misses market opportunities
- No risk management
- No merchant preferences

**After (Agentic):**
```
Payment received → Analyze context → Reason about options → 
Make intelligent decision → Explain reasoning → Learn from outcome
```
- Context-aware decisions
- Optimizes conversion timing
- Manages risk intelligently
- Respects merchant preferences
- Continuously learns

## Hackathon Judge Appeal

This transforms the project from **automation** to **true agent behavior**:

✅ **Autonomous reasoning** - Agent makes decisions, not just executes rules  
✅ **Context awareness** - Considers market, merchant, history  
✅ **Explainable** - Provides reasoning for every decision  
✅ **Adaptive** - Learns from outcomes  
✅ **Safety-first** - Conservative fallbacks on errors  

This is what separates an "AI agent" from a "smart script" — the ability to reason, adapt, and improve.

## Troubleshooting

**Agent always defaults to "convert_now":**
- Check API key is valid
- Check logs for Anthropic API errors
- Ensure sufficient API credits

**Decisions seem illogical:**
- Review context being passed
- Check market data accuracy
- Try adjusting temperature (currently 0.3)

**Database errors:**
- Ensure migrations have been run
- Check database connection in logs

## Future Enhancements

- Multi-agent collaboration (fraud detection agent, pricing agent)
- Reinforcement learning from outcomes
- Merchant-specific learning profiles
- Predictive market modeling
- Natural language merchant interface
