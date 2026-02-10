import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';

/**
 * Merchant Chat Agent
 * Allows merchants to interact with the AI agent via natural language
 */
export class MerchantChatAgent {
  private anthropic: Anthropic;
  private model: string = 'claude-sonnet-4';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Chat with merchant - answer questions, provide insights
   */
  async chat(merchantId: string, message: string): Promise<string> {
    try {
      logger.info(`💬 Merchant chat: ${message}`);

      // Get merchant context
      const merchant = await this.getMerchantContext(merchantId);
      
      // Get recent decisions
      const recentDecisions = await this.getRecentDecisions(merchantId);

      // Build context for agent
      const systemPrompt = this.buildSystemPrompt(merchant, recentDecisions);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      const reply = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not process that.';
      
      logger.info(`🤖 Agent reply: ${reply.substring(0, 100)}...`);
      return reply;

    } catch (error) {
      logger.error('Chat agent failed', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  /**
   * Get merchant context for agent
   */
  private async getMerchantContext(merchantId: string): Promise<any> {
    try {
      const result = await db.getClient()
        .from('merchants')
        .select('*')
        .eq('id', merchantId)
        .single();

      if (!result.data) return null;

      // Get transaction stats
      const txResult = await db.getClient()
        .from('transactions')
        .select('amount, created_at, status')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        merchant: result.data,
        recentTransactions: txResult.data || []
      };
    } catch (error) {
      logger.error('Failed to get merchant context', error);
      return null;
    }
  }

  /**
   * Get recent agent decisions
   */
  private async getRecentDecisions(merchantId: string): Promise<any[]> {
    try {
      const result = await db.getClient()
        .from('agent_decisions')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(5);

      return result.data || [];
    } catch (error) {
      logger.error('Failed to get recent decisions', error);
      return [];
    }
  }

  /**
   * Build system prompt with merchant context
   */
  private buildSystemPrompt(context: any, decisions: any[]): string {
    const merchant = context?.merchant;
    const txs = context?.recentTransactions || [];

    const totalVolume = txs.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || 0), 0);
    const avgTransaction = txs.length > 0 ? totalVolume / txs.length : 0;

    return `You are an AI agent managing cryptocurrency payments for ${merchant?.business_name || 'a merchant'}.

## Your Role
You help merchants understand their payment flow and make intelligent conversion decisions. Be helpful, conversational, and explain technical concepts in simple terms.

## Merchant Context
- Business: ${merchant?.business_name || 'Unknown'}
- Risk Profile: ${merchant?.risk_profile || 'conservative'}
- Auto-convert: ${merchant?.auto_convert_enabled ? 'Enabled' : 'Disabled'}
- Recent Transactions: ${txs.length}
- Total Volume (recent): ${totalVolume.toFixed(3)} SOL
- Average Transaction: ${avgTransaction.toFixed(3)} SOL

## Recent Agent Decisions
${decisions.length > 0 ? decisions.map((d: any) => `
- Decision: ${d.decision}
- Reasoning: ${d.reasoning}
- Confidence: ${Math.round(d.confidence * 100)}%
- Time: ${new Date(d.created_at).toLocaleString()}
`).join('\n') : 'No recent decisions'}

## How to Respond
- Be conversational and friendly
- Explain your conversion decisions clearly
- Provide insights about their payment patterns
- Offer helpful suggestions
- If they ask about specific transactions, reference the data above
- If they ask about your reasoning, explain the factors you consider

## Example Questions You Might Get
- "Why did you convert immediately?"
- "How much have I made this week?"
- "Should I change my risk profile?"
- "Why are you waiting to convert?"
- "Can you explain your decision?"

Answer naturally and helpfully!`;
  }
}

// Singleton instance
export const merchantChatAgent = new MerchantChatAgent();
