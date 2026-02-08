import * as dotenv from 'dotenv';
dotenv.config();

import { PaymentMonitorV2 } from '../modules/PaymentMonitorV2';
import { db } from '../database/supabase';
import { logger } from '../utils/logger';

export class MonitorService {
  private monitor: PaymentMonitorV2;
  private isRunning: boolean = false;

  constructor() {
    this.monitor = new PaymentMonitorV2(process.env.SOLANA_RPC_URL!);
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Monitor service already running');
      return;
    }

    logger.info('🚀 Starting Payment Monitor Service...');

    // Get all merchant wallets
    const merchants = await db.getAllMerchants();
    const wallets = merchants.map(m => m.wallet_address).filter(w => w !== 'DEMO_WALLET_ADDRESS_REPLACE_ME');

    if (wallets.length === 0) {
      logger.warn('No merchant wallets to monitor. Create merchants first.');
      return;
    }

    logger.info(`Monitoring ${wallets.length} merchant wallets`);

    // Start monitoring
    await this.monitor.start(wallets);
    this.isRunning = true;

    // Listen for payment events
    this.monitor.on('payment', async (payment) => {
      logger.info(`💰 Payment received: ${payment.amount} ${payment.token} to ${payment.toAddress}`);
    });

    logger.info('✅ Payment Monitor Service started successfully');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.monitor.stop();
    this.isRunning = false;
    logger.info('Payment Monitor Service stopped');
  }

  async addWallet(address: string) {
    this.monitor.addAddress(address);
    logger.info(`Added wallet to monitor: ${address}`);
  }
}

// Singleton instance
export const monitorService = new MonitorService();
