import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    if (!this.apiKey) {
      logger.warn('RESEND_API_KEY not set - email notifications disabled');
    }
    
    logger.info(`📧 Email service initialized with sender: ${this.fromEmail}`);
  }

  /**
   * Send email via Resend API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      logger.warn('Cannot send email: RESEND_API_KEY not configured');
      return false;
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: options.from || this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error: any) {
      // Check if it's a Resend free tier restriction (403)
      if (error.response?.status === 403 && error.response?.data?.message?.includes('testing emails')) {
        logger.warn('⚠️  Email not sent: Resend free tier restriction', {
          to: options.to,
          hint: 'On free tier, emails can only be sent to your verified email. Update merchant notification_email to match.',
        });
      } else {
        logger.error('Failed to send email', {
          error: error.message,
          response: error.response?.data,
        });
      }
      return false;
    }
  }

  /**
   * Send payment received notification
   */
  async sendPaymentNotification(
    merchantEmail: string,
    merchantName: string,
    amount: number,
    token: string,
    signature: string,
    usdValue?: number
  ): Promise<void> {
    const subject = `💰 Payment Received: ${amount} ${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .amount { font-size: 36px; font-weight: bold; color: #667eea; margin: 20px 0; }
          .usd-value { font-size: 18px; color: #666; margin-bottom: 20px; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; font-family: monospace; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☄️ Payment Received!</h1>
          </div>
          <div class="content">
            <p>Hello ${merchantName},</p>
            <p>Great news! You've received a new payment:</p>
            
            <div class="amount">${amount} ${token}</div>
            ${usdValue ? `<div class="usd-value">≈ $${usdValue.toFixed(2)} USD</div>` : ''}
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value" style="color: #10b981;">✅ Confirmed</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction:</span>
                <span class="value">${signature.slice(0, 16)}...</span>
              </div>
              <div class="detail-row">
                <span class="label">Network:</span>
                <span class="value">Solana Devnet</span>
              </div>
            </div>
            
            <p>The payment has been automatically detected and recorded in your dashboard.</p>
            
            <a href="https://solscan.io/tx/${signature}?cluster=devnet" class="button">View on Solscan →</a>
            
            <div class="footer">
              <p>Powered by Solana Payment Autopilot</p>
              <p>Autonomous crypto payments for merchants</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const success = await this.sendEmail({
      to: merchantEmail,
      subject,
      html,
    });

    if (success) {
      // Log notification in database
      await this.logNotification(
        merchantEmail,
        'payment_received',
        subject,
        'email',
        'sent'
      );
    }
  }

  /**
   * Send customer payment confirmation
   */
  async sendCustomerPaymentConfirmation(
    customerEmail: string,
    customerName: string,
    amount: number,
    token: string,
    merchantName: string,
    signature: string
  ): Promise<void> {
    const subject = `✅ Payment Confirmed - ${merchantName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .amount { font-size: 36px; font-weight: bold; color: #10b981; margin: 20px 0; text-align: center; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; font-family: monospace; }
          .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your payment has been successfully processed and confirmed on the blockchain!</p>
            
            <div class="amount">${amount} ${token}</div>
            
            <div class="success-badge">✅ Payment Complete</div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Merchant:</span>
                <span class="value">${merchantName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${amount} ${token}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction:</span>
                <span class="value">${signature.slice(0, 16)}...</span>
              </div>
              <div class="detail-row">
                <span class="label">Network:</span>
                <span class="value">Solana Devnet</span>
              </div>
            </div>
            
            <p>Your purchase is confirmed and ${merchantName} has been notified. Thank you for your payment!</p>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              <strong>Transaction ID:</strong><br/>
              <span style="word-break: break-all; font-family: monospace;">${signature}</span>
            </p>
            
            <div class="footer">
              <p>Powered by Solana Payment Autopilot</p>
              <p>Fast, secure cryptocurrency payments</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const success = await this.sendEmail({
      to: customerEmail,
      subject,
      html,
    });

    if (success) {
      await this.logNotification(
        customerEmail,
        'payment_confirmation',
        subject,
        'email',
        'sent'
      );
    }
  }

  /**
   * Send conversion completed notification
   */
  async sendConversionNotification(
    merchantEmail: string,
    merchantName: string,
    fromAmount: number,
    fromToken: string,
    toAmount: number,
    toToken: string,
    swapSignature: string
  ): Promise<void> {
    const subject = `🔄 Conversion Complete: ${fromAmount} ${fromToken} → ${toAmount.toFixed(2)} ${toToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .conversion { text-align: center; margin: 30px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .arrow { font-size: 24px; color: #10b981; margin: 10px 0; }
          .converted { font-size: 32px; font-weight: bold; color: #10b981; margin: 10px 0; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; font-family: monospace; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Conversion Complete!</h1>
          </div>
          <div class="content">
            <p>Hello ${merchantName},</p>
            <p>Your cryptocurrency has been automatically converted to stablecoin:</p>
            
            <div class="conversion">
              <div class="amount">${fromAmount} ${fromToken}</div>
              <div class="arrow">⬇️</div>
              <div class="converted">${toAmount.toFixed(2)} ${toToken}</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value" style="color: #10b981;">✅ Completed</span>
              </div>
              <div class="detail-row">
                <span class="label">Swap Signature:</span>
                <span class="value">${swapSignature.slice(0, 16)}...</span>
              </div>
              <div class="detail-row">
                <span class="label">Rate:</span>
                <span class="value">≈ $${(toAmount / fromAmount).toFixed(2)} per ${fromToken}</span>
              </div>
            </div>
            
            <p>Your funds are now in stable ${toToken}, protecting you from price volatility. You can view the transaction details in your dashboard.</p>
            
            <div class="footer">
              <p>Powered by Solana Payment Autopilot</p>
              <p>Autonomous crypto payments for merchants</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const success = await this.sendEmail({
      to: merchantEmail,
      subject,
      html,
    });

    if (success) {
      await this.logNotification(
        merchantEmail,
        'conversion_completed',
        subject,
        'email',
        'sent'
      );
    }
  }

  /**
   * Log notification in database
   */
  private async logNotification(
    recipient: string,
    type: string,
    subject: string,
    channel: string,
    status: string
  ): Promise<void> {
    try {
      await db.getClient()
        .from('notifications')
        .insert({
          merchant_id: '00000000-0000-0000-0000-000000000000', // Will be updated when we have merchant context
          notification_type: type,
          channel,
          recipient,
          subject,
          message: subject,
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        });
    } catch (error) {
      logger.error('Failed to log notification', error);
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
