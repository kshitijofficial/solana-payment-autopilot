import { Connection, PublicKey } from '@solana/web3.js';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { Transaction, PaymentStatus } from '../types';

export interface PaymentEvent {
  signature: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  timestamp: Date;
}

export class PaymentMonitor extends EventEmitter {
  private connection: Connection;
  private heliusWs?: WebSocket;
  private heliusApiKey: string;
  private watchedAddresses: Set<string>;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;

  constructor(rpcUrl: string, heliusApiKey: string) {
    super();
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.heliusApiKey = heliusApiKey;
    this.watchedAddresses = new Set();
  }

  /**
   * Start monitoring merchant addresses
   */
  async start(addresses: string[]) {
    addresses.forEach(addr => this.watchedAddresses.add(addr));
    
    logger.info(`Starting payment monitor for ${addresses.length} addresses`);
    
    // Connect to Helius WebSocket
    await this.connectWebSocket();
    
    // Also poll for recent transactions (backup mechanism)
    this.startPolling();
  }

  /**
   * Connect to Helius WebSocket for real-time updates
   */
  private async connectWebSocket() {
    const wsUrl = `wss://api.helius.xyz/v0/ws?api-key=${this.heliusApiKey}`;
    
    try {
      this.heliusWs = new WebSocket(wsUrl);

      this.heliusWs.on('open', () => {
        logger.info('Helius WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to transaction updates for watched addresses
        this.watchedAddresses.forEach(address => {
          this.subscribeToAddress(address);
        });
      });

      this.heliusWs.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error);
        }
      });

      this.heliusWs.on('error', (error) => {
        logger.error('Helius WebSocket error', error);
      });

      this.heliusWs.on('close', () => {
        logger.warn('Helius WebSocket closed');
        this.attemptReconnect();
      });
    } catch (error) {
      logger.error('Failed to connect to Helius WebSocket', error);
      this.attemptReconnect();
    }
  }

  /**
   * Subscribe to a specific address
   */
  private subscribeToAddress(address: string) {
    if (!this.heliusWs || this.heliusWs.readyState !== WebSocket.OPEN) {
      logger.warn(`Cannot subscribe to ${address} - WebSocket not connected`);
      return;
    }

    const subscribeMessage = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'transactionSubscribe',
      params: [
        {
          accountInclude: [address],
        },
        {
          commitment: 'confirmed',
          encoding: 'jsonParsed',
          transactionDetails: 'full',
          showRewards: false,
          maxSupportedTransactionVersion: 0,
        }
      ],
    };

    this.heliusWs.send(JSON.stringify(subscribeMessage));
    logger.info(`Subscribed to address: ${address}`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWebSocketMessage(message: any) {
    if (message.method === 'transactionNotification') {
      const txData = message.params.result;
      await this.processTransaction(txData);
    }
  }

  /**
   * Process a transaction and emit payment event if valid
   */
  private async processTransaction(txData: any) {
    try {
      const signature = txData.signature;
      const meta = txData.transaction?.meta;
      const transaction = txData.transaction?.transaction;

      if (!meta || !transaction) {
        return;
      }

      // Parse transaction instructions
      const instructions = transaction.message?.instructions || [];
      
      for (const instruction of instructions) {
        // Check if this is a SOL transfer to one of our watched addresses
        if (instruction.programId?.toString() === SystemProgram.programId.toString()) {
          const parsed = instruction.parsed;
          
          if (parsed?.type === 'transfer') {
            const { source, destination, lamports } = parsed.info;
            
            // Check if destination is one of our watched addresses
            if (this.watchedAddresses.has(destination)) {
              const amountSOL = lamports / 1e9;
              
              const paymentEvent: PaymentEvent = {
                signature,
                fromAddress: source,
                toAddress: destination,
                amount: amountSOL,
                token: 'SOL',
                timestamp: new Date(),
              };

              logger.info(`Payment detected: ${amountSOL} SOL from ${source} to ${destination}`);
              logger.info(`Transaction: https://solscan.io/tx/${signature}`);

              // Emit payment event
              this.emit('payment', paymentEvent);
            }
          }
        }
        
        // TODO: Handle SPL token transfers (USDC, USDT, etc.)
      }
    } catch (error) {
      logger.error('Failed to process transaction', error);
    }
  }

  /**
   * Backup polling mechanism (in case WebSocket fails)
   */
  private startPolling() {
    setInterval(async () => {
      for (const address of this.watchedAddresses) {
        try {
          await this.checkRecentTransactions(address);
        } catch (error) {
          logger.error(`Polling failed for ${address}`, error);
        }
      }
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Check recent transactions for an address (polling backup)
   */
  private async checkRecentTransactions(address: string) {
    try {
      const pubKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(pubKey, {
        limit: 10,
      });

      for (const sig of signatures) {
        // Only process recent transactions (last 60 seconds)
        const sigTime = sig.blockTime ? sig.blockTime * 1000 : 0;
        const now = Date.now();
        
        if (now - sigTime < 60000) {
          const tx = await this.connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (tx) {
            await this.processTransaction({ signature: sig.signature, transaction: tx });
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to check recent transactions for ${address}`, error);
    }
  }

  /**
   * Add new address to watch list
   */
  addAddress(address: string) {
    this.watchedAddresses.add(address);
    
    if (this.heliusWs && this.heliusWs.readyState === WebSocket.OPEN) {
      this.subscribeToAddress(address);
    }
    
    logger.info(`Added address to watch list: ${address}`);
  }

  /**
   * Remove address from watch list
   */
  removeAddress(address: string) {
    this.watchedAddresses.delete(address);
    logger.info(`Removed address from watch list: ${address}`);
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.heliusWs) {
      this.heliusWs.close();
    }
    
    this.watchedAddresses.clear();
    logger.info('Payment monitor stopped');
  }
}

// Import SystemProgram for checking program IDs
import { SystemProgram } from '@solana/web3.js';
