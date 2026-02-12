import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import bs58 from 'bs58';

/**
 * Merchant Chat Agent
 * Allows merchants to interact with the AI agent via natural language
 */
export class MerchantChatAgent {
  private anthropic?: Anthropic;
  private model: string = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Chat with merchant - answer questions, provide insights, execute actions
   */
  async chat(merchantId: string, message: string): Promise<string> {
    try {
      if (!this.anthropic) {
        return 'AI agent not configured. Please set ANTHROPIC_API_KEY in environment.';
      }
      
      logger.info(`💬 Merchant chat: ${message}`);

      // Get merchant context
      const merchant = await this.getMerchantContext(merchantId);
      if (!merchant) {
        return 'Sorry, I could not find your merchant account. Please make sure you are logged in correctly.';
      }
      
      // Check if message is requesting a conversion
      const conversionRequest = this.parseConversionRequest(message);
      if (conversionRequest) {
        return await this.handleConversionRequest(merchant, conversionRequest);
      }
      
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

    } catch (error: any) {
      logger.error('Chat agent failed', error);
      const errorMsg = error?.message || 'Unknown error';
      return `Sorry, I encountered an error: ${errorMsg}. Please make sure the ANTHROPIC_API_KEY is set.`;
    }
  }

  /**
   * Parse conversion request from message
   */
  private parseConversionRequest(message: string): { type: 'usdc_to_sol' | 'sol_to_usdc', amount: number } | null {
    const lowerMsg = message.toLowerCase();
    
    // Patterns for USDC → SOL
    const usdcToSolPatterns = [
      /convert\s+(\d+\.?\d*)\s*(usdc)?\s+to\s+sol/i,
      /buy\s+(\d+\.?\d*)\s*sol/i,
      /swap\s+(\d+\.?\d*)\s*(usdc)?\s+(to|for)\s+sol/i,
      /(\d+\.?\d*)\s*usdc\s+to\s+sol/i
    ];

    for (const pattern of usdcToSolPatterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (!isNaN(amount) && amount > 0) {
          return { type: 'usdc_to_sol', amount };
        }
      }
    }

    return null;
  }

  /**
   * Handle conversion request
   */
  private async handleConversionRequest(
    merchantContext: any, 
    request: { type: 'usdc_to_sol' | 'sol_to_usdc', amount: number }
  ): Promise<string> {
    try {
      const merchant = merchantContext.merchant;
      
      if (request.type === 'usdc_to_sol') {
        logger.info(`🔄 Converting ${request.amount} USDC → SOL for merchant ${merchant.business_name}`);
        
        // Execute conversion
        const result = await this.convertUsdcToSol(merchant.wallet_address, request.amount);
        
        if (result.success) {
          return `✅ Successfully converted ${request.amount} USDC to ${result.solAmount?.toFixed(4)} SOL!\n\n` +
                 `Transaction: ${result.signature}\n` +
                 `View on Solscan: https://solscan.io/tx/${result.signature}?cluster=devnet\n\n` +
                 `Your new SOL balance will be available shortly.`;
        } else {
          return `❌ Conversion failed: ${result.error}\n\nPlease make sure you have sufficient USDC balance.`;
        }
      }

      return 'Conversion type not supported yet.';
    } catch (error: any) {
      logger.error('Conversion request failed', error);
      return `❌ Sorry, the conversion failed: ${error.message}`;
    }
  }

  /**
   * Convert USDC to SOL using Jupiter
   */
  private async convertUsdcToSol(
    merchantWallet: string, 
    usdcAmount: number
  ): Promise<{ success: boolean; signature?: string; solAmount?: number; error?: string }> {
    try {
      // For devnet, simulate the conversion
      const isDevnet = process.env.SOLANA_NETWORK === 'devnet';
      
      if (isDevnet) {
        logger.info('🎭 Simulating USDC→SOL conversion on devnet');
        
        // Mock conversion rate: ~$150/SOL
        const mockSolPrice = 150;
        const solAmount = usdcAmount / mockSolPrice;
        
        // Generate mock signature
        const mockSignature = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        logger.info(`✅ Simulated: ${usdcAmount} USDC → ${solAmount.toFixed(4)} SOL`);
        
        return {
          success: true,
          signature: mockSignature,
          solAmount
        };
      }

      // TODO: Implement real mainnet conversion via Jupiter
      return {
        success: false,
        error: 'Mainnet conversion not implemented yet. Currently only devnet simulation is available.'
      };

    } catch (error: any) {
      logger.error('USDC→SOL conversion failed', error);
      return {
        success: false,
        error: error.message
      };
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

## Actions You Can Perform
When the merchant asks, you can:
- **Convert USDC back to SOL**: If they say "convert X USDC to SOL" or "buy X SOL", you will execute the swap automatically
- Explain conversion decisions
- Provide payment insights
- Answer questions about transactions

## How to Respond
- Be conversational and friendly
- Explain your conversion decisions clearly
- Provide insights about their payment patterns
- Offer helpful suggestions
- If they request a conversion, confirm you're processing it
- If they ask about specific transactions, reference the data above
- If they ask about your reasoning, explain the factors you consider

## Example Questions You Might Get
- "Why did you convert immediately?"
- "How much have I made this week?"
- "Should I change my risk profile?"
- "Why are you waiting to convert?"
- "Can you explain your decision?"
- "Convert 10 USDC to SOL" ← You'll handle this automatically!
- "Buy 0.1 SOL" ← You'll execute this swap!

Answer naturally and helpfully!`;
  }
}

// Lazy singleton - only create when first accessed
let _instance: MerchantChatAgent | null = null;

export const merchantChatAgent = {
  get instance() {
    if (!_instance) {
      _instance = new MerchantChatAgent();
    }
    return _instance;
  },
  // Proxy method
  chat: (merchantId: string, message: string) => merchantChatAgent.instance.chat(merchantId, message)
};
