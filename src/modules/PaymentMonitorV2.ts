import { Connection, PublicKey } from '@solana/web3.js';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';
import { conversionService } from '../services/ConversionService';
import { emailService } from '../services/EmailService';

export interface PaymentEvent {
  signature: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  timestamp: Date;
}

export class PaymentMonitorV2 extends EventEmitter {
  private connection: Connection;
  private watchedAddresses: Set<string>;
  private processedSignatures: Set<string>;
  private pollingInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(rpcUrl: string) {
    super();
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.watchedAddresses = new Set();
    this.processedSignatures = new Set();
  }

  /**
   * Start monitoring merchant addresses
   */
  async start(addresses: string[]) {
    if (this.isRunning) {
      logger.warn('Payment monitor already running');
      return;
    }

    addresses.forEach(addr => this.watchedAddresses.add(addr));
    
    logger.info(`🚀 Starting payment monitor for ${addresses.length} addresses`);
    logger.info(`⏱️  Polling every 15 seconds`);

    this.isRunning = true;

    // Initial check
    await this.pollAllWallets();

    // Then poll every 15 seconds
    this.pollingInterval = setInterval(async () => {
      await this.pollAllWallets();
    }, 15000);
  }

  private async pollAllWallets() {
    for (const address of this.watchedAddresses) {
      try {
        await this.checkWalletTransactions(address);
      } catch (error) {
        logger.error(`Failed to poll ${address}`, error);
      }
    }
  }

  private async checkWalletTransactions(address: string) {
    try {
      const pubKey = new PublicKey(address);
      
      // Get recent signatures (last 10)
      const signatures = await this.connection.getSignaturesForAddress(pubKey, {
        limit: 10,
      });

      for (const sigInfo of signatures) {
        const signature = sigInfo.signature;

        // Skip if already processed
        if (this.processedSignatures.has(signature)) {
          continue;
        }

        // Check if transaction already in database
        const existing = await db.getTransactionBySignature(signature);
        if (existing) {
          this.processedSignatures.add(signature);
          continue;
        }

        // Only process recent transactions (last 5 minutes)
        const sigTime = sigInfo.blockTime ? sigInfo.blockTime * 1000 : 0;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - sigTime > fiveMinutes) {
          continue;
        }

        // Fetch full transaction
        const tx = await this.connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta) {
          continue;
        }

        // Check if this is an incoming payment
        const preBalance = tx.meta.preBalances[1] || 0; // Index 1 is usually the recipient
        const postBalance = tx.meta.postBalances[1] || 0;
        const amountLamports = postBalance - preBalance;

        if (amountLamports <= 0) {
          // Not an incoming payment
          this.processedSignatures.add(signature);
          continue;
        }

        const amountSOL = amountLamports / 1e9;
        const fromAddress = tx.transaction.message.accountKeys[0].pubkey.toString();

        logger.info(`💰 Payment detected: ${amountSOL} SOL to ${address}`);
        logger.info(`   From: ${fromAddress}`);
        logger.info(`   Signature: ${signature.slice(0, 8)}...`);

        // Get merchant
        const merchant = await db.getMerchantByWallet(address);
        if (!merchant) {
          logger.warn(`No merchant found for wallet: ${address}`);
          this.processedSignatures.add(signature);
          continue;
        }

        // Save to database
        const saved = await db.createTransaction({
          merchant_id: merchant.id,
          signature,
          from_address: fromAddress,
          to_address: address,
          amount: amountSOL,
          token: 'SOL',
          status: 'confirmed',
          confirmations: 32,
          block_time: new Date(sigTime),
        });

        if (saved) {
          logger.info(`✅ Transaction saved to database`);
          
          // Emit payment event
          const paymentEvent: PaymentEvent = {
            signature,
            fromAddress,
            toAddress: address,
            amount: amountSOL,
            token: 'SOL',
            timestamp: new Date(sigTime),
          };
          
          this.emit('payment', paymentEvent);

          // Send email notification
          if (merchant.notification_email) {
            emailService.sendPaymentNotification(
              merchant.notification_email,
              merchant.business_name,
              amountSOL,
              'SOL',
              signature
            ).catch(err => logger.error('Failed to send payment email', err));
          }

          // Trigger auto-conversion for SOL payments
          if (merchant.auto_convert_enabled) {
            logger.info(`🔄 Triggering auto-conversion: ${amountSOL} SOL → USDC`);
            
            // Run conversion in background (don't await)
            conversionService.autoConvertPayment(saved.id!, address, amountSOL)
              .catch(err => logger.error('Auto-conversion failed', err));
          }
        }

        // Mark as processed
        this.processedSignatures.add(signature);
      }
    } catch (error) {
      logger.error(`Error checking wallet ${address}`, error);
    }
  }

  /**
   * Add new address to watch list
   */
  addAddress(address: string) {
    this.watchedAddresses.add(address);
    logger.info(`➕ Added wallet to monitor: ${address}`);
  }

  /**
   * Remove address from watch list
   */
  removeAddress(address: string) {
    this.watchedAddresses.delete(address);
    logger.info(`➖ Removed wallet from monitor: ${address}`);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    
    this.isRunning = false;
    this.watchedAddresses.clear();
    this.processedSignatures.clear();
    
    logger.info('⏹️  Payment monitor stopped');
  }
}
