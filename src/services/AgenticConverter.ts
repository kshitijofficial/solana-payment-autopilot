import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';

/**
 * Context for conversion decision
 */
export interface ConversionContext {
  transactionId: string;
  merchantId: string;
  merchantName: string;
  amountSOL: number;
  currentPrice: number;
  merchantRiskProfile: 'conservative' | 'moderate' | 'aggressive';
  timeSincePayment: number; // minutes
  recentVolatility: 'low' | 'medium' | 'high';
  historicalPrices?: number[]; // last 24h prices
  merchantTypicalVolume?: number; // average daily SOL volume
  transactionSize: 'small' | 'medium' | 'large'; // relative to merchant history
}

/**
 * Agent's conversion decision
 */
export interface ConversionDecision {
  decision: 'convert_now' | 'wait' | 'monitor';
  confidence: number; // 0-1
  reasoning: string;
  waitDuration?: number; // minutes (if wait)
  targetPrice?: number; // USD (if wait)
  riskAssessment: string;
  estimatedUSDValue: number;
}

/**
 * Agentic Conversion Decision Engine
 * Uses Claude to make intelligent conversion timing decisions
 */
export class AgenticConverter {
  private anthropic?: Anthropic;
  private model: string = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Make intelligent conversion decision using AI reasoning
   */
  async decideConversion(context: ConversionContext): Promise<ConversionDecision> {
    try {
      if (!this.anthropic) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      
      logger.info(`🤖 Agent analyzing conversion decision for ${context.amountSOL} SOL`);

      const prompt = this.buildDecisionPrompt(context);
      
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.3, // Lower for more consistent financial decisions
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse agent's response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const decision = this.parseDecision(responseText, context);

      // Note: Decision logging happens in AgenticConversionService (orchestration layer)
      logger.info(`🧠 Agent decision: ${decision.decision} (${Math.round(decision.confidence * 100)}% confidence)`);
      logger.info(`💭 Reasoning: ${decision.reasoning}`);

      return decision;

    } catch (error) {
      logger.error('Agent decision-making failed', error);
      
      // Fallback to conservative default (convert immediately)
      return {
        decision: 'convert_now',
        confidence: 0.5,
        reasoning: 'Defaulting to immediate conversion due to agent error (safety first)',
        riskAssessment: 'Unknown - agent error, playing it safe',
        estimatedUSDValue: context.amountSOL * context.currentPrice
      };
    }
  }

  /**
   * Build comprehensive prompt for the agent
   */
  private buildDecisionPrompt(context: ConversionContext): string {
    const usdValue = context.amountSOL * context.currentPrice;
    const volatilityDescription = this.getVolatilityDescription(context.recentVolatility);

    return `You are an autonomous financial agent managing cryptocurrency conversions for a merchant payment system. Your goal is to maximize USD value for the merchant while managing volatility risk.

## Current Situation

**Payment Received:**
- Amount: ${context.amountSOL} SOL
- Current Market Price: $${context.currentPrice.toFixed(2)} USD/SOL
- Estimated USD Value: $${usdValue.toFixed(2)}

**Merchant Profile:**
- Business: ${context.merchantName}
- Risk Tolerance: ${context.merchantRiskProfile}
- Typical Daily Volume: ${context.merchantTypicalVolume ? context.merchantTypicalVolume.toFixed(2) + ' SOL' : 'Unknown (new merchant)'}
- This Transaction Size: ${context.transactionSize}

**Market Conditions:**
- Time Since Payment: ${context.timeSincePayment} minutes
- Recent Volatility: ${context.recentVolatility} (${volatilityDescription})
${context.historicalPrices ? `- 24h Price Range: $${Math.min(...context.historicalPrices).toFixed(2)} - $${Math.max(...context.historicalPrices).toFixed(2)}` : ''}

## Your Decision Framework

1. **Conservative merchants**: Prioritize stability over potential gains. Convert quickly to minimize downside risk.
2. **Moderate merchants**: Balance risk and opportunity. Wait if clear upward trend with low risk.
3. **Aggressive merchants**: Willing to wait for better rates, but still manage downside.

4. **Transaction size matters**: 
   - Small: More room for experimentation
   - Large: Higher stakes, more conservative approach

5. **Volatility assessment**:
   - High volatility: Convert faster to lock in value
   - Low volatility: Can afford to wait for better rates

6. **Time sensitivity**: 
   - Fresh payments (< 5 min): More flexibility
   - Older payments (> 15 min): Consider converting soon

## Required Response Format

Respond with ONLY a valid JSON object (no markdown, no explanation outside JSON):

{
  "decision": "convert_now" | "wait" | "monitor",
  "confidence": 0.0 to 1.0,
  "reasoning": "Your clear, concise explanation in 1-2 sentences",
  "waitDuration": minutes to wait (only if decision is "wait" or "monitor"),
  "targetPrice": target USD price (only if waiting for better rate),
  "riskAssessment": "Your assessment of downside risk in 1 sentence",
  "estimatedUSDValue": your estimate of final USD value after conversion
}

**Decision meanings:**
- "convert_now": Execute conversion immediately
- "wait": Hold SOL and convert after specific duration or price target
- "monitor": Continue watching market, re-evaluate in specified duration

Think carefully about the merchant's needs and market conditions. Provide your honest assessment.`;
  }

  /**
   * Parse agent's JSON response
   */
  private parseDecision(responseText: string, context: ConversionContext): ConversionDecision {
    try {
      // Extract JSON from response (in case agent wrapped it)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in agent response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize
      return {
        decision: ['convert_now', 'wait', 'monitor'].includes(parsed.decision) 
          ? parsed.decision 
          : 'convert_now',
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        waitDuration: parsed.waitDuration ? parseInt(parsed.waitDuration) : undefined,
        targetPrice: parsed.targetPrice ? parseFloat(parsed.targetPrice) : undefined,
        riskAssessment: parsed.riskAssessment || 'Unknown',
        estimatedUSDValue: parsed.estimatedUSDValue || (context.amountSOL * context.currentPrice)
      };

    } catch (error) {
      logger.error('Failed to parse agent decision', error);
      logger.error('Raw response:', responseText);

      // Fallback decision
      return {
        decision: 'convert_now',
        confidence: 0.5,
        reasoning: 'Could not parse agent response, defaulting to immediate conversion',
        riskAssessment: 'Unknown',
        estimatedUSDValue: context.amountSOL * context.currentPrice
      };
    }
  }

  /**
   * Get volatility description for prompt
   */
  private getVolatilityDescription(volatility: 'low' | 'medium' | 'high'): string {
    switch (volatility) {
      case 'low': return 'stable price, low risk of sudden drops';
      case 'medium': return 'moderate fluctuation, some risk';
      case 'high': return 'significant price swings, higher risk';
    }
  }

  /**
   * Log agent decision to database for learning and audit
   */
  private async logDecision(context: ConversionContext, decision: ConversionDecision): Promise<void> {
    try {
      logger.info(`📝 Logging decision to database: ${decision.decision} (${decision.confidence}% confidence)`);
      logger.info(`   Transaction ID: ${context.transactionId} | Merchant ID: ${context.merchantId}`);
      
      const result = await db.getClient().from('agent_decisions').insert({
        transaction_id: context.transactionId,
        merchant_id: context.merchantId,
        decision_type: 'conversion_timing',
        decision: decision.decision,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        context: JSON.stringify({
          amountSOL: context.amountSOL,
          currentPrice: context.currentPrice,
          merchantRiskProfile: context.merchantRiskProfile,
          recentVolatility: context.recentVolatility,
          transactionSize: context.transactionSize
        }),
        wait_duration: decision.waitDuration,
        target_price: decision.targetPrice,
        estimated_usd_value: decision.estimatedUSDValue,
        actual_usd_value: null, // Will update after conversion
        created_at: new Date().toISOString()
      });
      
      if (result.error) {
        logger.error('❌ Database error logging decision:', result.error);
      } else {
        logger.info('✅ Decision logged successfully to database');
      }
    } catch (error) {
      // Don't fail the conversion if logging fails
      logger.error('Failed to log agent decision', error);
    }
  }

  /**
   * Fetch current SOL price (from Jupiter or CoinGecko)
   */
  async getCurrentPrice(): Promise<number> {
    try {
      // Use Jupiter's price API
      const response = await fetch('https://price.jup.ag/v4/price?ids=SOL');
      const data: any = await response.json();
      return data.data.SOL.price;
    } catch (error) {
      logger.error('Failed to fetch SOL price', error);
      // Fallback to approximate price
      return 150; // Conservative estimate
    }
  }

  /**
   * Calculate volatility from recent prices
   */
  calculateVolatility(prices: number[]): 'low' | 'medium' | 'high' {
    if (prices.length < 2) return 'medium';

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + r * r, 0) / returns.length
    );

    // Classify volatility (these thresholds can be tuned)
    if (stdDev < 0.02) return 'low';      // < 2% standard deviation
    if (stdDev < 0.05) return 'medium';   // 2-5%
    return 'high';                         // > 5%
  }

  /**
   * Determine transaction size relative to merchant history
   */
  determineTransactionSize(amount: number, merchantAverage?: number): 'small' | 'medium' | 'large' {
    if (!merchantAverage || merchantAverage === 0) {
      // New merchant - use absolute thresholds
      if (amount < 0.1) return 'small';
      if (amount < 0.5) return 'medium';
      return 'large';
    }

    const ratio = amount / merchantAverage;
    if (ratio < 0.5) return 'small';
    if (ratio < 2.0) return 'medium';
    return 'large';
  }
}

// Lazy singleton - only create when first accessed
let _instance: AgenticConverter | null = null;

export const agenticConverter = {
  get instance() {
    if (!_instance) {
      _instance = new AgenticConverter();
    }
    return _instance;
  },
  // Proxy methods
  decideConversion: (context: ConversionContext) => agenticConverter.instance.decideConversion(context),
  logDecision: (context: ConversionContext, decision: ConversionDecision) => 
    agenticConverter.instance.logDecision(context, decision),
  getCurrentPrice: () => agenticConverter.instance.getCurrentPrice(),
  calculateVolatility: (prices: number[]) => agenticConverter.instance.calculateVolatility(prices),
  determineTransactionSize: (amount: number, merchantAverage?: number) => 
    agenticConverter.instance.determineTransactionSize(amount, merchantAverage)
};
