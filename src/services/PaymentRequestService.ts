import * as dotenv from 'dotenv';
dotenv.config();

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { encodeURL, createQR } from '@solana/pay';
import { db, PaymentRequest } from '../database/supabase';
import { logger } from '../utils/logger';

const QR_SIZE = 512;

export interface CreatePaymentRequestParams {
  merchant_id: string;
  amount_usd: number;
  order_id?: string;
  customer_email?: string;
  customer_name?: string;
  description?: string;
  callback_url?: string;
  metadata?: any;
  expires_in_minutes?: number; // Default: 15 minutes
}

export interface PaymentRequestResponse {
  payment_id: string;
  payment_url: string;
  amount_usd: number;
  amount_sol: number;
  qr_code: string; // Base64 PNG
  wallet_address: string;
  expires_at: string;
}

export class PaymentRequestService {
  private connection: Connection;
  private baseUrl: string;
  private solPriceUsd: number = 150; // Default, will be updated

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Update SOL price periodically
    this.updateSolPrice();
    setInterval(() => this.updateSolPrice(), 60000); // Every minute
  }

  /**
   * Fetch current SOL price (for devnet, use mock price)
   */
  private async updateSolPrice(): Promise<void> {
    try {
      // For devnet, use mock price
      if (process.env.SOLANA_NETWORK === 'devnet') {
        this.solPriceUsd = 150;
        return;
      }

      // For mainnet, fetch real price from Jupiter or CoinGecko
      // TODO: Implement real price fetching
      this.solPriceUsd = 150;
    } catch (error) {
      logger.error('Failed to update SOL price', error);
      // Keep last known price
    }
  }

  /**
   * Generate unique payment ID (pr_xxxxx format)
   */
  private generatePaymentId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'pr_';
    for (let i = 0; i < 12; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /**
   * Calculate SOL amount from USD
   */
  private calculateSolAmount(amountUsd: number): number {
    return Number((amountUsd / this.solPriceUsd).toFixed(9));
  }

  /**
   * Generate QR code for Solana Pay
   */
  private async generateQrCode(
    recipient: string,
    amount: number,
    label: string,
    message?: string
  ): Promise<string> {
    try {
      const recipientPubkey = new PublicKey(recipient);
      
      // Create Solana Pay URL
      const url = encodeURL({
        recipient: recipientPubkey,
        amount,
        label,
        message,
      });

      // Generate QR code
      const qr = createQR(url, QR_SIZE);
      const qrBuffer = await qr.getRawData('png');
      
      if (!qrBuffer) {
        throw new Error('Failed to generate QR code');
      }

      // Convert to base64
      const base64 = qrBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      logger.error('Failed to generate QR code', error);
      throw error;
    }
  }

  /**
   * Create a new payment request
   */
  async createPaymentRequest(
    params: CreatePaymentRequestParams
  ): Promise<PaymentRequestResponse | null> {
    try {
      // Get merchant to get their wallet address
      const { data: merchant } = await db.getClient()
        .from('merchants')
        .select('wallet_address, business_name')
        .eq('id', params.merchant_id)
        .single();

      if (!merchant) {
        logger.error('Merchant not found', { merchant_id: params.merchant_id });
        return null;
      }

      // Calculate SOL amount
      const amountSol = this.calculateSolAmount(params.amount_usd);

      // Generate payment ID
      const paymentId = this.generatePaymentId();

      // Calculate expiration
      const expiresInMinutes = params.expires_in_minutes || 15;
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      // Generate payment URL
      const paymentUrl = `${this.baseUrl}/pay/${paymentId}`;

      // Generate QR code
      const qrCode = await this.generateQrCode(
        merchant.wallet_address,
        amountSol,
        merchant.business_name,
        params.description || `Payment of $${params.amount_usd}`
      );

      // Create payment request in database
      const paymentRequest = await db.createPaymentRequest({
        merchant_id: params.merchant_id,
        payment_id: paymentId,
        amount_usd: params.amount_usd,
        amount_sol: amountSol,
        order_id: params.order_id,
        customer_email: params.customer_email,
        customer_name: params.customer_name,
        description: params.description,
        callback_url: params.callback_url,
        metadata: params.metadata,
        status: 'pending',
        payment_url: paymentUrl,
        qr_code_data: qrCode,
        expires_at: expiresAt.toISOString(),
      });

      if (!paymentRequest) {
        throw new Error('Failed to create payment request in database');
      }

      logger.info(`Payment request created: ${paymentId} ($${params.amount_usd} = ${amountSol} SOL)`);

      return {
        payment_id: paymentId,
        payment_url: paymentUrl,
        amount_usd: params.amount_usd,
        amount_sol: amountSol,
        qr_code: qrCode,
        wallet_address: merchant.wallet_address,
        expires_at: expiresAt.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to create payment request', error);
      return null;
    }
  }

  /**
   * Get payment request by payment ID
   */
  async getPaymentRequest(paymentId: string): Promise<PaymentRequest | null> {
    return await db.getPaymentRequestByPaymentId(paymentId);
  }

  /**
   * Mark payment request as paid
   */
  async markAsPaid(paymentId: string, transactionId: string): Promise<boolean> {
    const paymentRequest = await this.getPaymentRequest(paymentId);
    if (!paymentRequest) return false;

    const updated = await db.updatePaymentRequest(paymentRequest.id!, {
      status: 'paid',
      transaction_id: transactionId,
      paid_at: new Date().toISOString(),
    });

    return !!updated;
  }

  /**
   * Check if payment request is expired
   */
  isExpired(paymentRequest: PaymentRequest): boolean {
    return new Date(paymentRequest.expires_at) < new Date();
  }

  /**
   * Get payment requests for merchant
   */
  async getPaymentRequestsByMerchant(merchantId: string, limit = 50): Promise<PaymentRequest[]> {
    return await db.getPaymentRequestsByMerchant(merchantId, limit);
  }
}

// Singleton instance
export const paymentRequestService = new PaymentRequestService();
