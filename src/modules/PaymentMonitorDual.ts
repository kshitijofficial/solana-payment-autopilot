import { Connection, PublicKey } from '@solana/web3.js';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';
import { agenticConversionService } from '../services/AgenticConversionService';
import { emailService } from '../services/EmailService';
import { webhookService } from '../services/WebhookService';

export interface PaymentEvent {
  signature: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  timestamp: Date;
  network: 'mainnet' | 'devnet';
}

interface WatchedAddress {
  address: string;
  network: 'mainnet' | 'devnet';
  merchantId: string;
}

export class PaymentMonitorDual extends EventEmitter {
  private mainnetConnection: Connection;
  private devnetConnection: Connection;
  private watchedAddresses: Map<string, WatchedAddress>; // address -> info
  private processedSignatures: Set<string>;
  private pollingInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(mainnetRpcUrl: string, devnetRpcUrl: string) {
    super();
    this.mainnetConnection = new Connection(mainnetRpcUrl, 'confirmed');
    this.devnetConnection = new Connection(devnetRpcUrl, 'confirmed');
    this.watchedAddresses = new Map();
    this.processedSignatures = new Set();
  }

  /**
   * Start monitoring merchant addresses on both networks
   */
  async start(addresses: WatchedAddress[]) {
    if (this.isRunning) {
      logger.warn('Payment monitor already running');
      return;
    }

    addresses.forEach(addr => {
      this.watchedAddresses.set(addr.address, addr);
    });
    
    const mainnetCount = addresses.filter(a => a.network === 'mainnet').length;
    const devnetCount = addresses.filter(a => a.network === 'devnet').length;
    
    logger.info(`🚀 Starting dual-network payment monitor`);
    logger.info(`   Mainnet: ${mainnetCount} addresses`);
    logger.info(`   Devnet: ${devnetCount} addresses`);
    logger.info(`⏱️  Polling every 15 seconds`);

    this.isRunning = true;

    // Initial check
    await this.pollAllWallets();

    // Then poll every 15 seconds
    this.pollingInterval = setInterval(async () => {
      await this.pollAllWallets();
    }, 15000);
  }

  /**
   * Add a new address to monitor
   */
  addAddress(address: string, network: 'mainnet' | 'devnet', merchantId: string) {
    this.watchedAddresses.set(address, { address, network, merchantId });
    logger.info(`Added ${network} address to monitor: ${address}`);
  }

  /**
   * Remove address from monitoring
   */
  removeAddress(address: string) {
    this.watchedAddresses.delete(address);
    logger.info(`Removed address from monitor: ${address}`);
  }

  private async pollAllWallets() {
    for (const [address, info] of this.watchedAddresses) {
      try {
        await this.checkWalletTransactions(address, info.network, info.merchantId);
      } catch (error) {
        logger.error(`Failed to poll ${info.network} ${address}`, error);
      }
    }
  }

  private async checkWalletTransactions(address: string, network: 'mainnet' | 'devnet', merchantId: string) {
    try {
      const connection = network === 'mainnet' ? this.mainnetConnection : this.devnetConnection;
      const pubKey = new PublicKey(address);
      
      // Get recent signatures (last 10)
      const signatures = await connection.getSignaturesForAddress(pubKey, {
        limit: 10,
      });

      for (const sigInfo of signatures) {
        const signature = sigInfo.signature;

        // Skip if already processed
        const signatureKey = `${network}:${signature}`;
        if (this.processedSignatures.has(signatureKey)) {
          continue;
        }

        // Get full transaction details
        const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta) {
          continue;
        }

        // Look for SOL transfers to our address
        const preBalance = tx.meta.preBalances[0];
        const postBalance = tx.meta.postBalances[0];
        
        // Check if this wallet received SOL
        const receiverIndex = tx.transaction.message.accountKeys.findIndex(
          key => key.pubkey.toString() === address
        );

        if (receiverIndex === -1) continue;

        const preReceiverBalance = tx.meta.preBalances[receiverIndex];
        const postReceiverBalance = tx.meta.postBalances[receiverIndex];
        const amountReceived = postReceiverBalance - preReceiverBalance;

        if (amountReceived > 0) {
          const amountSOL = amountReceived / 1e9;

          // Get sender address
          const fromAddress = tx.transaction.message.accountKeys[0].pubkey.toString();

          logger.info(`💰 [${network.toUpperCase()}] Payment detected: ${amountSOL} SOL from ${fromAddress}`);

          // Mark as processed
          this.processedSignatures.add(signatureKey);

          // Save to database
          await this.saveTransaction({
            merchantId,
            signature,
            fromAddress,
            toAddress: address,
            amount: amountSOL,
            network,
            blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
          });

          // Emit payment event
          this.emit('payment', {
            signature,
            fromAddress,
            toAddress: address,
            amount: amountSOL,
            token: 'SOL',
            timestamp: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
            network,
          } as PaymentEvent);
        }
      }
    } catch (error: any) {
      logger.error(`Error checking ${network} transactions for ${address}:`, error.message);
    }
  }

  private async saveTransaction(data: {
    merchantId: string;
    signature: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    network: 'mainnet' | 'devnet';
    blockTime: Date;
  }) {
    try {
      // Check if transaction already exists
      const existing = await db.getClient()
        .from('transactions')
        .select('id')
        .eq('signature', data.signature)
        .eq('network', data.network)
        .single();

      if (existing.data) {
        logger.info(`Transaction already exists: ${data.signature}`);
        return;
      }

      // Get merchant info
      const merchant = await db.getMerchantById(data.merchantId);
      if (!merchant) {
        logger.error(`Merchant not found: ${data.merchantId}`);
        return;
      }

      // Calculate USD value (simplified - you can add real price feed later)
      const solPriceUSD = data.network === 'mainnet' ? 150 : 150; // Same price for both
      const usdValue = data.amount * solPriceUSD;

      // Save transaction
      const transaction = await db.createTransaction({
        merchant_id: data.merchantId,
        signature: data.signature,
        from_address: data.fromAddress,
        to_address: data.toAddress,
        amount: data.amount,
        token: 'SOL',
        usd_value: usdValue,
        status: 'confirmed',
        confirmations: 32,
        block_time: data.blockTime,
        network: data.network,
      });

      logger.info(`✅ Transaction saved to database: ${transaction.id}`);

      // Send email notification to merchant
      try {
        await emailService.sendPaymentReceived({
          merchantEmail: merchant.notification_email || merchant.email,
          businessName: merchant.business_name,
          amount: data.amount,
          token: 'SOL',
          usdValue,
          signature: data.signature,
          network: data.network,
        });
      } catch (emailError) {
        logger.error('Failed to send payment email:', emailError);
      }

      // Trigger auto-conversion if enabled (only on mainnet for real conversions)
      if (merchant.auto_convert_enabled && transaction.id) {
        if (data.network === 'mainnet') {
          logger.info(`🔄 Auto-conversion enabled for ${merchant.business_name} - triggering REAL Jupiter swap`);
          await agenticConversionService.analyzeAndConvert(transaction.id, merchant);
        } else {
          logger.info(`🔄 Auto-conversion enabled for ${merchant.business_name} - using SIMULATION (devnet)`);
          await agenticConversionService.analyzeAndConvert(transaction.id, merchant);
        }
      }

      // Check for matching payment request and trigger webhook
      try {
        const paymentRequests = await db.getClient()
          .from('payment_requests')
          .select('*')
          .eq('merchant_id', data.merchantId)
          .eq('status', 'pending')
          .eq('network', data.network);

        if (paymentRequests.data && paymentRequests.data.length > 0) {
          for (const pr of paymentRequests.data) {
            // Match by amount (with 1% tolerance)
            const expectedAmount = pr.amount_sol;
            const tolerance = expectedAmount * 0.01;
            if (Math.abs(data.amount - expectedAmount) <= tolerance) {
              // Update payment request
              await db.getClient()
                .from('payment_requests')
                .update({
                  status: 'paid',
                  transaction_id: transaction.id,
                  paid_at: new Date().toISOString(),
                })
                .eq('id', pr.id);

              logger.info(`✅ Matched payment request: ${pr.payment_id}`);

              // Trigger webhook if callback URL exists
              if (pr.callback_url) {
                await webhookService.triggerWebhook({
                  callbackUrl: pr.callback_url,
                  merchantId: data.merchantId,
                  paymentId: pr.payment_id,
                  orderId: pr.order_id || '',
                  amount: data.amount,
                  token: 'SOL',
                  signature: data.signature,
                  network: data.network,
                  status: 'paid',
                });
              }
            }
          }
        }
      } catch (webhookError) {
        logger.error('Failed to process payment request webhook:', webhookError);
      }
    } catch (error) {
      logger.error('Failed to save transaction:', error);
      throw error;
    }
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
    logger.info('Payment monitor stopped');
  }

  /**
   * Check if monitor is running
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * Get monitored addresses count
   */
  getMonitoredCount(): { mainnet: number; devnet: number; total: number } {
    const addresses = Array.from(this.watchedAddresses.values());
    return {
      mainnet: addresses.filter(a => a.network === 'mainnet').length,
      devnet: addresses.filter(a => a.network === 'devnet').length,
      total: addresses.length,
    };
  }
}

// Singleton instance with both mainnet and devnet connections
export const paymentMonitor = new PaymentMonitorDual(
  process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
  process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com'
);
