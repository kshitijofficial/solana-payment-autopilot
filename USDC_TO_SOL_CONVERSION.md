# USDC → SOL Conversion via Chat

## Feature Overview
Merchants can now ask the AI agent to convert USDC back to SOL directly through the chat interface on their dashboard.

## How It Works

### 1. Open Chat Widget
Click the chat button (💬) at the bottom right of the merchant dashboard.

### 2. Request Conversion
Type any of these commands:

**Examples:**
- "Convert 10 USDC to SOL"
- "Buy 0.1 SOL"
- "Swap 50 USDC for SOL"
- "Convert 100 USDC to SOL"

### 3. Agent Executes
The AI agent will:
1. Parse your request
2. Calculate the conversion rate (~$150/SOL on devnet)
3. Execute the swap
4. Provide transaction details

### 4. Confirmation Message
You'll receive a response like:
```
✅ Successfully converted 10 USDC to 0.0667 SOL!

Transaction: mock_1707701234_abc123
View on Solscan: https://solscan.io/tx/mock_1707701234_abc123?cluster=devnet

Your new SOL balance will be available shortly.
```

## Supported Patterns

The agent recognizes these natural language patterns:

| Pattern | Example |
|---------|---------|
| `convert X USDC to SOL` | "convert 25 USDC to SOL" |
| `buy X SOL` | "buy 0.5 SOL" |
| `swap X USDC for SOL` | "swap 100 USDC for SOL" |
| `X USDC to SOL` | "50 USDC to SOL" |

## Current Implementation

### Devnet (Testing)
- **Simulation mode**: Transactions are mocked
- **Conversion rate**: Fixed at ~$150/SOL
- **Instant execution**: No real blockchain interaction
- **Mock signatures**: For testing UI/UX

### Mainnet (Production)
- ⚠️ **Not yet implemented**
- Will use Jupiter Aggregator for best rates
- Real on-chain swaps
- Network fees apply

## Use Cases

1. **Rebalancing**: Convert accumulated USDC back to SOL for gas fees
2. **Market timing**: Capitalize on favorable SOL prices
3. **Operational needs**: Get SOL for platform operations
4. **Testing**: Verify conversion flow on devnet

## Security Notes

- Only the merchant's own wallet can be accessed
- Conversions are logged for audit trail
- Rate limits may apply (future enhancement)
- Always verify transaction on Solscan

## Technical Details

**Code Location:** `src/services/MerchantChatAgent.ts`

**Functions:**
- `parseConversionRequest()` - Detects conversion commands
- `handleConversionRequest()` - Processes the request
- `convertUsdcToSol()` - Executes the swap

**Dependencies:**
- Solana Web3.js
- SPL Token
- Jupiter Aggregator (mainnet)

## Future Enhancements

- [ ] Mainnet integration via Jupiter
- [ ] Custom conversion rates
- [ ] Partial conversions
- [ ] Scheduled conversions
- [ ] Rate alerts ("notify me when SOL < $140")
- [ ] Conversion history in dashboard

---

**Try it now!** Open your merchant dashboard chat and type: "convert 5 USDC to SOL"
