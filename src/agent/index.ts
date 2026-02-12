/**
 * ⚠️ REFERENCE IMPLEMENTATION
 * 
 * This file contains an early architecture design for the autonomous agent.
 * The actual production implementation uses:
 * - src/api/server-v2.ts (main API server)
 * - src/services/AgenticConversionService.ts (AI conversion decisions)
 * - src/services/MerchantChatAgent.ts (conversational interface)
 * - src/services/AgentInsightsService.ts (alerts & forecasting)
 * 
 * This file is kept for reference and demonstrates the initial design pattern.
 * To run the production system, use: npm run api or npm run start:all
 */

import dotenv from 'dotenv';
import { WalletManager } from '../modules/WalletManager';
import { PaymentMonitor, PaymentEvent } from '../modules/PaymentMonitor';
import { ConversionEngine } from '../modules/ConversionEngine';
import { logger } from '../utils/logger';
import { AgentConfig } from '../types';

// Load environment variables
dotenv.config();

export class PaymentAutopilotAgent {
  private config: AgentConfig;
  private walletManager: WalletManager;
  private paymentMonitor: PaymentMonitor;
  private conversionEngine: ConversionEngine;
  private isRunning: boolean = false;

  constructor() {
    // Load configuration from environment
    this.config = {
      solanaNetwork: (process.env.SOLANA_NETWORK as any) || 'devnet',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      heliusApiKey: process.env.HELIUS_API_KEY || '',
      heliusWebSocketUrl: process.env.HELIUS_WEBHOOK_URL || 'wss://api.helius.xyz/v0/ws',
      jupiterApiUrl: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
      autoConversionEnabled: process.env.AUTO_CONVERSION_ENABLED === 'true',
      defaultSlippageBps: parseInt(process.env.DEFAULT_SLIPPAGE_BPS || '100'),
      confirmationWaitTime: parseInt(process.env.CONFIRMATION_WAIT_TIME || '10000'),
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
    };

    // Initialize modules
    this.walletManager = new WalletManager(this.config.rpcUrl);
    this.paymentMonitor = new PaymentMonitor(this.config.rpcUrl, this.config.heliusApiKey);
    this.conversionEngine = new ConversionEngine(this.config.rpcUrl, this.config.jupiterApiUrl);

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for payment monitoring
   */
  private setupEventHandlers() {
    this.paymentMonitor.on('payment', async (event: PaymentEvent) => {
      await this.handlePaymentEvent(event);
    });
  }

  /**
   * Handle detected payment
   */
  private async handlePaymentEvent(event: PaymentEvent) {
    try {
      logger.info('Payment event received', event);

      // Wait for confirmation
      logger.info(`Waiting ${this.config.confirmationWaitTime}ms for confirmation...`);
      await new Promise(resolve => setTimeout(resolve, this.config.confirmationWaitTime));

      // TODO: Look up merchant from database using toAddress
      // TODO: Store transaction in database
      // TODO: Send notification to merchant

      // Auto-convert to USDC if enabled
      if (this.config.autoConversionEnabled && event.token === 'SOL') {
        logger.info(`Auto-conversion enabled, converting ${event.amount} SOL to USDC`);
        
        // TODO: Get merchant wallet keypair from database
        // TODO: Execute conversion
        // TODO: Update transaction record with conversion signature
        // TODO: Send conversion confirmation to merchant
      }

      logger.info('Payment processing complete');
    } catch (error) {
      logger.error('Failed to handle payment event', error);
    }
  }

  /**
   * Start the agent
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Agent is already running');
      return;
    }

    logger.info('Starting Payment Autopilot Agent...');
    logger.info(`Network: ${this.config.solanaNetwork}`);
    logger.info(`Auto-conversion: ${this.config.autoConversionEnabled ? 'enabled' : 'disabled'}`);

    // TODO: Load merchant addresses from database
    const merchantAddresses: string[] = [];

    if (merchantAddresses.length === 0) {
      logger.warn('No merchant addresses to monitor. Add merchants to get started.');
    } else {
      // Start monitoring payments
      await this.paymentMonitor.start(merchantAddresses);
    }

    this.isRunning = true;
    logger.info('Agent started successfully ✓');
  }

  /**
   * Stop the agent
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Agent is not running');
      return;
    }

    logger.info('Stopping Payment Autopilot Agent...');
    
    this.paymentMonitor.stop();
    
    this.isRunning = false;
    logger.info('Agent stopped');
  }

  /**
   * Add a new merchant address to monitor
   */
  async addMerchant(address: string) {
    if (!this.walletManager.isValidAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }

    this.paymentMonitor.addAddress(address);
    logger.info(`Added merchant address: ${address}`);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      running: this.isRunning,
      network: this.config.solanaNetwork,
      autoConversion: this.config.autoConversionEnabled,
    };
  }
}

// Run agent if this file is executed directly
if (require.main === module) {
  const agent = new PaymentAutopilotAgent();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  // Start the agent
  agent.start().catch(error => {
    logger.error('Failed to start agent', error);
    process.exit(1);
  });
}
