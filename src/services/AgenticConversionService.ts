import * as dotenv from 'dotenv';
dotenv.config();

import { Keypair } from '@solana/web3.js';
import { JupiterConverter } from '../modules/JupiterConverter';
import { agenticConverter, ConversionContext } from './AgenticConverter';
import { db } from '../database/supabase';
import { logger } from '../utils/logger';
import { emailService } from './EmailService';
import bs58 from 'bs58';

/**
 * Agentic Conversion Service
 * Uses AI agent to make intelligent conversion timing decisions
 */
export class AgenticConversionService {
  private converter: JupiterConverter;
  private isDevnet: boolean;
  private maxRetries: number = 3;

  constructor() {
    this.converter = new JupiterConverter(
      process.env.SOLANA_RPC_URL!,
      process.env.JUPITER_API_URL
    );
    this.isDevnet = process.env.SOLANA_NETWORK === 'devnet';
  }

  /**
   * Process conversion with AI decision-making
   * @param context - Full context for agent decision-making
   */
  async processAgenticConversion(
    context: ConversionContext,
    merchantWalletKeypair: Keypair,
    merchantEmail?: string
  ): Promise<boolean> {
    try {
      logger.info(`🤖 Starting agentic conversion for ${context.amountSOL} SOL`);

      // Get AI agent's decision
      const decision = await agenticConverter.decideConversion(context);

      // Log decision to database for audit trail
      await agenticConverter.logDecision(context, decision);

      // Handle decision
      if (decision.decision === 'convert_now') {
        logger.info('✅ Agent decided: Convert immediately');
        return await this.executeConversion(
          context.transactionId,
          merchantWalletKeypair,
          context.amountSOL,
          merchantEmail,
          context.merchantName,
          decision.reasoning
        );
      } 
      else if (decision.decision === 'wait') {
        logger.info(`⏰ Agent decided: Wait ${decision.waitDuration} minutes (target: $${decision.targetPrice})`);
        // Schedule delayed conversion
        await this.scheduleDelayedConversion(
          context,
          merchantWalletKeypair,
          decision.waitDuration!,
          decision.targetPrice,
          merchantEmail
        );
        return true;
      }
      else if (decision.decision === 'monitor') {
        logger.info(`👁️  Agent decided: Monitor market for ${decision.waitDuration} minutes`);
        // Schedule re-evaluation
        await this.scheduleMonitoring(
          context,
          merchantWalletKeypair,
          decision.waitDuration!,
          merchantEmail
        );
        return true;
      }

      return false;

    } catch (error) {
      logger.error('Agentic conversion failed', error);
      
      // Fallback to immediate conversion on error (safety first)
      logger.warn('⚠️  Falling back to immediate conversion due to error');
      return await this.executeConversion(
        context.transactionId,
        merchantWalletKeypair,
        context.amountSOL,
        merchantEmail,
        context.merchantName,
        'Emergency fallback due to agent error'
      );
    }
  }

  /**
   * Execute the actual conversion
   */
  private async executeConversion(
    transactionId: string,
    merchantWalletKeypair: Keypair,
    amountSol: number,
    merchantEmail: string | undefined,
    merchantName: string,
    reasoning: string
  ): Promise<boolean> {
    try {
      logger.info(`💱 Executing conversion: ${amountSol} SOL → USDC`);

      // Create pending conversion record
      const conversion = await db.createConversion({
        transaction_id: transactionId,
        from_token: 'SOL',
        to_token: 'USDC',
        from_amount: amountSol,
        to_amount: 0,
        swap_signature: '',
        slippage_bps: 50,
        status: 'pending',
      });

      if (!conversion) {
        logger.error('Failed to create conversion record');
        return false;
      }

      // Execute conversion
      let swapResult;
      
      if (this.isDevnet) {
        swapResult = await this.converter.simulateSwap(amountSol);
      } else {
        swapResult = await this.converter.executeSwap(
          merchantWalletKeypair,
          amountSol,
          50,
          this.isDevnet
        );
      }

      if (!swapResult.success) {
        await db.updateConversion(conversion.id!, {
          status: 'failed',
          error_message: swapResult.error,
        });
        logger.error(`Conversion failed: ${swapResult.error}`);
        return false;
      }

      // Update conversion record
      await db.updateConversion(conversion.id!, {
        to_amount: swapResult.outputAmount,
        swap_signature: swapResult.signature!,
        status: 'completed',
      });

      // Update agent decision with actual outcome
      await this.updateDecisionOutcome(transactionId, swapResult.outputAmount);

      logger.info(`✅ Conversion completed: ${swapResult.outputAmount} USDC`);
      logger.info(`💭 Agent reasoning: ${reasoning}`);

      // Send enhanced email with agent reasoning
      if (merchantEmail && merchantName) {
        await this.sendAgenticNotification(
          merchantEmail,
          merchantName,
          amountSol,
          swapResult.outputAmount,
          swapResult.signature!,
          reasoning
        );
      }

      return true;

    } catch (error) {
      logger.error('Conversion execution failed', error);
      return false;
    }
  }

  /**
   * Schedule a delayed conversion
   */
  private async scheduleDelayedConversion(
    context: ConversionContext,
    merchantWalletKeypair: Keypair,
    waitMinutes: number,
    targetPrice: number | undefined,
    merchantEmail: string | undefined
  ): Promise<void> {
    logger.info(`⏰ Scheduling conversion in ${waitMinutes} minutes`);

    // TODO: Implement proper job scheduler (Bull, Agenda, or cron)
    // For now, use setTimeout (not production-ready - will lose on restart)
    setTimeout(async () => {
      logger.info(`🔔 Delayed conversion triggered for ${context.amountSOL} SOL`);
      
      // Re-evaluate with fresh context
      const freshContext = await this.buildFreshContext(context);
      const newDecision = await agenticConverter.decideConversion(freshContext);
      
      // Log re-evaluation decision
      await agenticConverter.logDecision(freshContext, newDecision);

      if (newDecision.decision === 'convert_now') {
        await this.executeConversion(
          context.transactionId,
          merchantWalletKeypair,
          context.amountSOL,
          merchantEmail,
          context.merchantName,
          `Delayed conversion executed. ${newDecision.reasoning}`
        );
      } else {
        logger.warn('Agent still recommends waiting - converting anyway (safety timeout)');
        await this.executeConversion(
          context.transactionId,
          merchantWalletKeypair,
          context.amountSOL,
          merchantEmail,
          context.merchantName,
          'Forced conversion after wait period (safety measure)'
        );
      }
    }, waitMinutes * 60 * 1000);

    // Send immediate notification about the wait
    if (merchantEmail) {
      await emailService.sendEmail({
        to: merchantEmail,
        subject: `Payment Processing Strategy - ${context.merchantName}`,
        html: `
        <h2>💭 Smart Conversion Strategy</h2>
        <p>Your agent has analyzed the ${context.amountSOL} SOL payment and decided to optimize the conversion timing.</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
          <strong>Agent Decision:</strong> Wait ${waitMinutes} minutes<br>
          ${targetPrice ? `<strong>Target Price:</strong> $${targetPrice.toFixed(2)}/SOL<br>` : ''}
          <strong>Current Price:</strong> $${context.currentPrice.toFixed(2)}/SOL<br>
          <strong>Estimated Value:</strong> $${(context.amountSOL * context.currentPrice).toFixed(2)}
        </div>

        <p style="color: #64748b; font-size: 14px;">
          I'll monitor the market and convert when conditions are optimal. You'll get a notification when the conversion completes.
        </p>
        `
      });
    }
  }

  /**
   * Schedule market monitoring and re-evaluation
   */
  private async scheduleMonitoring(
    context: ConversionContext,
    merchantWalletKeypair: Keypair,
    waitMinutes: number,
    merchantEmail: string | undefined
  ): Promise<void> {
    logger.info(`👁️  Scheduling market monitoring for ${waitMinutes} minutes`);

    setTimeout(async () => {
      logger.info(`🔄 Re-evaluating conversion decision`);
      
      const freshContext = await this.buildFreshContext(context);
      await this.processAgenticConversion(freshContext, merchantWalletKeypair, merchantEmail);
    }, waitMinutes * 60 * 1000);
  }

  /**
   * Build fresh context with updated market data
   */
  private async buildFreshContext(oldContext: ConversionContext): Promise<ConversionContext> {
    const currentPrice = await agenticConverter.getCurrentPrice();
    const timeSincePayment = Date.now() - new Date(oldContext.transactionId).getTime();
    
    return {
      ...oldContext,
      currentPrice,
      timeSincePayment: Math.floor(timeSincePayment / 60000), // Convert to minutes
    };
  }

  /**
   * Update agent decision with actual outcome
   */
  private async updateDecisionOutcome(transactionId: string, actualUsdValue: number): Promise<void> {
    try {
      await db.getClient().from('agent_decisions')
        .update({
          actual_usd_value: actualUsdValue,
          executed_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);
    } catch (error) {
      logger.error('Failed to update decision outcome', error);
    }
  }

  /**
   * Send email notification with agent reasoning
   */
  private async sendAgenticNotification(
    merchantEmail: string,
    merchantName: string,
    amountSol: number,
    amountUsdc: number,
    signature: string,
    reasoning: string
  ): Promise<void> {
    try {
      await emailService.sendEmail({
        to: merchantEmail,
        subject: `Payment Converted - ${merchantName}`,
        html: `
        <h2>✅ Payment Converted to USDC</h2>
        
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
          <strong>Amount Received:</strong> ${amountSol} SOL<br>
          <strong>Converted To:</strong> ${amountUsdc.toFixed(2)} USDC<br>
          <strong>Rate:</strong> $${(amountUsdc / amountSol).toFixed(2)}/SOL
        </div>

        <h3>🤖 Agent Decision</h3>
        <p style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; color: #92400e;">
          ${reasoning}
        </p>

        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          <strong>Transaction:</strong> <a href="https://solscan.io/tx/${signature}">View on Solscan</a>
        </p>
        `
      });
    } catch (error) {
      logger.error('Failed to send agentic notification', error);
    }
  }

  /**
   * Auto-convert with agentic decision-making
   */
  async autoConvertPayment(transactionId: string, merchantWalletAddress: string, amountSol: number): Promise<void> {
    try {
      // Get merchant by wallet address
      const merchant = await db.getMerchantByWallet(merchantWalletAddress);
      if (!merchant) {
        logger.warn(`Merchant not found: ${merchantWalletAddress}`);
        return;
      }

      // Check if auto-convert enabled
      if (!merchant.auto_convert_enabled) {
        logger.info(`Auto-convert disabled for ${merchant.business_name}`);
        return;
      }

      logger.info(`🚀 Starting agentic auto-conversion for ${merchant.business_name}`);

      // Build context for agent decision
      const context = await this.buildConversionContext(
        transactionId,
        merchant.id, // Use merchant UUID, not wallet address
        merchant.business_name,
        amountSol,
        merchant.risk_profile || 'conservative'
      );

      // Mock keypair (in production, use secure key management)
      const mockKeypair = Keypair.generate();

      // Process with agent intelligence
      await this.processAgenticConversion(
        context,
        mockKeypair,
        merchant.notification_email || merchant.email
      );

    } catch (error) {
      logger.error('Agentic auto-conversion failed', error);
    }
  }

  /**
   * Build comprehensive context for agent decision
   */
  private async buildConversionContext(
    transactionId: string,
    merchantId: string,
    merchantName: string,
    amountSOL: number,
    riskProfile: string
  ): Promise<ConversionContext> {
    const currentPrice = await agenticConverter.getCurrentPrice();
    
    // TODO: Fetch historical prices (implement price history API)
    const historicalPrices = [currentPrice]; // Placeholder
    
    // Calculate volatility
    const recentVolatility = agenticConverter.calculateVolatility(historicalPrices);
    
    // Get merchant statistics
    const merchantStats = await this.getMerchantStats(merchantId);
    
    // Determine transaction size
    const transactionSize = agenticConverter.determineTransactionSize(
      amountSOL,
      merchantStats?.avgDailyVolume
    );

    return {
      transactionId,
      merchantId,
      merchantName,
      amountSOL,
      currentPrice,
      merchantRiskProfile: riskProfile as any,
      timeSincePayment: 0, // Just received
      recentVolatility,
      historicalPrices,
      merchantTypicalVolume: merchantStats?.avgDailyVolume,
      transactionSize
    };
  }

  /**
   * Get merchant statistics for context
   */
  private async getMerchantStats(merchantId: string): Promise<{ avgDailyVolume: number } | null> {
    try {
      const result = await db.getClient().from('transactions')
        .select('amount')
        .eq('merchant_wallet', merchantId)
        .eq('status', 'confirmed');

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const totalVolume = result.data.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const avgDailyVolume = totalVolume / Math.max(1, result.data.length);

      return { avgDailyVolume };
    } catch (error) {
      logger.error('Failed to get merchant stats', error);
      return null;
    }
  }
}

// Singleton instance
export const agenticConversionService = new AgenticConversionService();
