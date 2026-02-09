import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { PaymentRequest, Transaction } from '../database/supabase';

export interface WebhookPayload {
  event_type: 'payment.completed';
  payment_id: string;
  order_id?: string;
  amount_usd: number;
  amount_sol: number;
  transaction_signature: string;
  status: 'paid';
  customer_email?: string;
  customer_name?: string;
  metadata?: any;
  paid_at: string;
}

export class WebhookService {
  private secret: string;
  private maxRetries: number = 3;
  private retryDelayMs: number = 5000; // 5 seconds

  constructor() {
    this.secret = process.env.WEBHOOK_SECRET || 'default_webhook_secret_change_in_production';
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Send webhook to merchant's callback URL
   */
  async sendPaymentWebhook(
    paymentRequest: PaymentRequest,
    transaction: Transaction
  ): Promise<boolean> {
    if (!paymentRequest.callback_url) {
      logger.warn('No callback URL configured for payment request', {
        payment_id: paymentRequest.payment_id,
      });
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'payment.completed',
      payment_id: paymentRequest.payment_id,
      order_id: paymentRequest.order_id,
      amount_usd: Number(paymentRequest.amount_usd),
      amount_sol: Number(paymentRequest.amount_sol),
      transaction_signature: transaction.signature,
      status: 'paid',
      customer_email: paymentRequest.customer_email,
      customer_name: paymentRequest.customer_name,
      metadata: paymentRequest.metadata,
      paid_at: paymentRequest.paid_at || new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString);

    return await this.sendWithRetry(
      paymentRequest.callback_url,
      payload,
      signature,
      paymentRequest.payment_id
    );
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWithRetry(
    url: string,
    payload: WebhookPayload,
    signature: string,
    paymentId: string,
    attempt: number = 1
  ): Promise<boolean> {
    try {
      logger.info(`📤 Sending webhook (attempt ${attempt}/${this.maxRetries})`, {
        url,
        payment_id: paymentId,
      });

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Payment-ID': paymentId,
        },
        timeout: 10000, // 10 seconds
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info(`✅ Webhook delivered successfully`, {
          payment_id: paymentId,
          status: response.status,
        });
        return true;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      logger.error(`❌ Webhook delivery failed (attempt ${attempt})`, {
        payment_id: paymentId,
        error: error.message,
        url,
      });

      // Retry if we haven't exceeded max retries
      if (attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt));
        return await this.sendWithRetry(url, payload, signature, paymentId, attempt + 1);
      }

      logger.error(`❌ Webhook failed after ${this.maxRetries} attempts`, {
        payment_id: paymentId,
      });
      return false;
    }
  }

  /**
   * Verify webhook signature (for receiving webhooks from external services)
   */
  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// Singleton instance
export const webhookService = new WebhookService();
