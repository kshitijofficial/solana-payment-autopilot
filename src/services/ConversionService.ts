import * as dotenv from 'dotenv';
dotenv.config();

import { Keypair } from '@solana/web3.js';
import { JupiterConverter } from '../modules/JupiterConverter';
import { db } from '../database/supabase';
import { logger } from '../utils/logger';
import { emailService } from './EmailService';
import bs58 from 'bs58';

export class ConversionService {
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
   * Process conversion for a SOL payment
   */
  async processConversion(
    transactionId: string, 
    merchantWalletKeypair: Keypair, 
    amountSol: number,
    merchantEmail?: string,
    merchantName?: string
  ): Promise<boolean> {
    try {
      logger.info(`Starting conversion for transaction ${transactionId}: ${amountSol} SOL`);

      // Create pending conversion record
      const conversion = await db.createConversion({
        transaction_id: transactionId,
        from_token: 'SOL',
        to_token: 'USDC',
        from_amount: amountSol,
        to_amount: 0, // Will update after swap
        swap_signature: '', // Will update after swap
        slippage_bps: 50,
        status: 'pending',
      });

      if (!conversion) {
        logger.error('Failed to create conversion record');
        return false;
      }

      // Execute conversion (simulate on devnet, real on mainnet)
      let swapResult;
      
      if (this.isDevnet) {
        // Jupiter doesn't support devnet, so simulate
        swapResult = await this.converter.simulateSwap(amountSol);
      } else {
        // Real swap on mainnet
        swapResult = await this.converter.executeSwap(
          merchantWalletKeypair,
          amountSol,
          50, // 0.5% slippage
          this.isDevnet
        );
      }

      if (!swapResult.success) {
        // Update conversion record with error
        await db.updateConversion(conversion.id!, {
          status: 'failed',
          error_message: swapResult.error,
        });

        logger.error(`Conversion failed: ${swapResult.error}`);
        return false;
      }

      // Update conversion record with success
      await db.updateConversion(conversion.id!, {
        to_amount: swapResult.outputAmount,
        swap_signature: swapResult.signature!,
        status: 'completed',
      });

      logger.info(`✅ Conversion completed: ${swapResult.outputAmount} USDC`);

      // Send email notification
      if (merchantEmail && merchantName) {
        logger.info(`📧 Sending conversion email to ${merchantEmail}`);
        try {
          await emailService.sendConversionNotification(
            merchantEmail,
            merchantName,
            amountSol,
            'SOL',
            swapResult.outputAmount,
            'USDC',
            swapResult.signature!
          );
          logger.info(`✅ Conversion email sent successfully`);
        } catch (err) {
          logger.error('Failed to send conversion email', err);
        }
      } else {
        logger.warn(`⚠️  Skipping conversion email - merchantEmail: ${merchantEmail}, merchantName: ${merchantName}`);
      }

      return true;

    } catch (error) {
      logger.error('Conversion processing failed', error);
      return false;
    }
  }

  /**
   * Auto-convert SOL payment to USDC
   * Called by payment monitor when SOL payment detected
   */
  async autoConvertPayment(transactionId: string, merchantId: string, amountSol: number): Promise<void> {
    try {
      // Get merchant
      const merchant = await db.getMerchantByWallet(merchantId);
      if (!merchant) {
        logger.warn(`Merchant not found for conversion: ${merchantId}`);
        return;
      }

      // Check if auto-convert is enabled
      if (!merchant.auto_convert_enabled) {
        logger.info(`Auto-convert disabled for merchant: ${merchant.business_name}`);
        return;
      }

      logger.info(`Auto-converting payment for ${merchant.business_name}: ${amountSol} SOL`);

      // For now, we'll simulate with a mock keypair since we don't store private keys
      // In production, you'd use a secure key management system
      const mockKeypair = Keypair.generate();

      await this.processConversion(
        transactionId, 
        mockKeypair, 
        amountSol,
        merchant.notification_email || merchant.email,
        merchant.business_name
      );

    } catch (error) {
      logger.error('Auto-conversion failed', error);
    }
  }

  /**
   * Retry failed conversion
   */
  async retryConversion(conversionId: string): Promise<boolean> {
    try {
      // Get conversion record
      const conversions = await db.getClient().from('conversions')
        .select('*')
        .eq('id', conversionId)
        .single();

      if (!conversions.data) {
        logger.error('Conversion not found');
        return false;
      }

      const conversion = conversions.data;

      // Check retry count
      if (conversion.retry_count >= this.maxRetries) {
        logger.warn(`Max retries reached for conversion ${conversionId}`);
        return false;
      }

      // Retry conversion
      const mockKeypair = Keypair.generate();
      return await this.processConversion(
        conversion.transaction_id,
        mockKeypair,
        conversion.from_amount
      );

    } catch (error) {
      logger.error('Conversion retry failed', error);
      return false;
    }
  }
}

// Singleton instance
export const conversionService = new ConversionService();
