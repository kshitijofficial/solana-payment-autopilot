# Merchant Dashboard Fixes (Feb 11, 2026)

## Issues Reported
1. Agent Intelligence showing 0 decisions (conversions happened but not tracked)
2. Need visual indicator when agent is making decisions
3. Cancel button (✕) not working in agent chat popup

---

## Fix 1: Track Conversion Decisions

**Problem:** Agent Intelligence stats show 0 because API endpoints `/agent/insights` and `/agent/alerts` don't exist.

**Solution:** Add decision tracking to conversions table + create API endpoints.

### Step 1: Add decision tracking to database
```sql
-- Add columns to conversions table
ALTER TABLE conversions 
ADD COLUMN agent_decision VARCHAR(50),
ADD COLUMN agent_confidence INTEGER,
ADD COLUMN agent_reasoning TEXT;
```

### Step 2: Update ConversionService to log decisions
File: `src/services/ConversionService.ts`

```typescript
// When creating conversion record:
await db.createConversion({
  transaction_id: transactionId,
  from_token: 'SOL',
  to_token: 'USDC',
  from_amount: solAmount,
  to_amount: usdcAmount,
  status: 'completed',
  agent_decision: 'convert_now', // or 'wait'
  agent_confidence: 95, // 0-100
  agent_reasoning: 'High volatility detected - immediate conversion recommended'
});
```

### Step 3: Create API endpoints
File: `src/api/server.ts` (add after existing routes)

```typescript
// Agent Intelligence Stats
app.get('/api/agent/insights/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    // Get all conversions for this merchant
    const conversions = await db.query(`
      SELECT 
        c.agent_decision, 
        c.agent_confidence
      FROM conversions c
      JOIN transactions t ON c.transaction_id = t.id
      WHERE t.merchant_id = $1 AND c.agent_decision IS NOT NULL
    `, [merchantId]);
    
    const totalDecisions = conversions.rows.length;
    const avgConfidence = totalDecisions > 0 
      ? Math.round(conversions.rows.reduce((sum, r) => sum + r.agent_confidence, 0) / totalDecisions)
      : 0;
    
    const breakdown = {
      convert_now: conversions.rows.filter(r => r.agent_decision === 'convert_now').length,
      wait: conversions.rows.filter(r => r.agent_decision === 'wait').length
    };
    
    res.json({
      success: true,
      data: {
        totalDecisions,
        avgConfidence,
        breakdown
      }
    });
  } catch (error) {
    console.error('Agent insights error:', error);
    res.status(500).json({ success: false, error: 'Failed to load agent stats' });
  }
});

// Agent Alerts
app.get('/api/agent/alerts/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    // Get recent conversions with reasoning
    const alerts = await db.query(`
      SELECT 
        c.agent_reasoning,
        c.agent_confidence,
        c.created_at
      FROM conversions c
      JOIN transactions t ON c.transaction_id = t.id
      WHERE t.merchant_id = $1 
        AND c.agent_reasoning IS NOT NULL
        AND c.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [merchantId]);
    
    const formattedAlerts = alerts.rows.map(alert => ({
      message: alert.agent_reasoning,
      priority: alert.agent_confidence > 80 ? 'high' : alert.agent_confidence > 50 ? 'medium' : 'low',
      timestamp: alert.created_at
    }));
    
    res.json({
      success: true,
      data: formattedAlerts
    });
  } catch (error) {
    console.error('Agent alerts error:', error);
    res.status(500).json({ success: false, error: 'Failed to load alerts' });
  }
});
```

---

## Fix 2: Visual Agent Activity Indicator

**Problem:** Static UI doesn't show when agent is actively making decisions.

**Solution:** Add animated agent icon that appears during conversion process.

File: `merchant-dashboard/index.html` (add after stats cards, before Agent Intelligence section)

```html
<!-- Agent Activity Indicator -->
<div id="agentActivity" class="hidden bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl shadow-lg p-6 mb-8 animate-pulse">
    <div class="flex items-center gap-4">
        <div class="relative">
            <!-- Animated robot icon -->
            <svg class="w-12 h-12 text-white animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M21 9H15V22H13V16H11V22H9V9H3V7H21V9M12 10C13.1 10 14 10.9 14 12S13.1 14 12 14 10 13.1 10 12 10.9 10 12 10Z"/>
            </svg>
            <!-- Pulse rings -->
            <div class="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
        </div>
        <div class="flex-1">
            <h3 class="text-xl font-bold text-white mb-1">🤖 Agent Working</h3>
            <p class="text-white/90 text-sm" id="agentActivityText">Analyzing transaction...</p>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div class="w-2 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
    </div>
</div>
```

Add JavaScript functions:
```javascript
function showAgentActivity(message) {
    const indicator = document.getElementById('agentActivity');
    const text = document.getElementById('agentActivityText');
    text.textContent = message;
    indicator.classList.remove('hidden');
}

function hideAgentActivity() {
    const indicator = document.getElementById('agentActivity');
    indicator.classList.add('hidden');
}

// Example usage when conversion starts:
// showAgentActivity('Fetching Jupiter quote for SOL → USDC...');
// showAgentActivity('Executing conversion (95% confidence)...');
// hideAgentActivity();
```

Integration with polling:
```javascript
// In loadTransactions function, check for pending conversions:
const pendingConversions = transactions.filter(tx => 
    tx.status === 'completed' && 
    !conversions[tx.id] && 
    merchantData.auto_convert_enabled
);

if (pendingConversions.length > 0) {
    showAgentActivity(`Converting ${pendingConversions.length} payment(s) to USDC...`);
} else {
    hideAgentActivity();
}
```

---

## Fix 3: Chat Popup Cancel Button

**Problem:** Cancel button (✕) not closing the chat widget.

**Root cause:** CSS conflict between `hidden` class and inline `style="display: flex"`.

**Solution:** Remove inline style and use CSS classes only.

File: `merchant-dashboard/index.html`

**Replace this line (around line 741):**
```html
<div id="chatWidget" class="hidden fixed bottom-20 right-6 w-96 bg-white rounded-lg shadow-2xl" style="max-height: 500px; display: flex; flex-direction: column;">
```

**With:**
```html
<div id="chatWidget" class="hidden fixed bottom-20 right-6 w-96 bg-white rounded-lg shadow-2xl flex flex-col" style="max-height: 500px;">
```

**Explanation:** 
- Remove `display: flex` from inline style (conflicts with `hidden`)
- Add `flex flex-col` to class list instead
- Keep `max-height` in inline style (layout property, not display)

---

## Priority

1. **Fix 3 (Cancel button)** - 2 min fix, high annoyance
2. **Fix 2 (Agent indicator)** - 15 min, high impact for demo
3. **Fix 1 (Agent stats)** - 30 min, required for "Most Agentic" award

---

## Testing Checklist

- [ ] Cancel button closes chat popup
- [ ] Agent activity indicator shows during conversions
- [ ] Agent Intelligence shows > 0 after conversion
- [ ] Agent alerts display recent decisions
- [ ] Stats update after each new conversion
