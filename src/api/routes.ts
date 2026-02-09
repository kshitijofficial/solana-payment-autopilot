import { Router, Request, Response } from 'express';
import { db } from '../database/supabase';
import { logger } from '../utils/logger';
import { Keypair } from '@solana/web3.js';
import QRCode from 'qrcode';
import { conversionService } from '../services/ConversionService';
import { paymentRequestService } from '../services/PaymentRequestService';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all merchants
router.get('/merchants', async (req: Request, res: Response) => {
  try {
    const merchants = await db.getAllMerchants();
    res.json({ success: true, data: merchants });
  } catch (error) {
    logger.error('Failed to get merchants', error);
    res.status(500).json({ success: false, error: 'Failed to fetch merchants' });
  }
});

// Get merchant by wallet
router.get('/merchants/:walletAddress', async (req: Request, res: Response) => {
  try {
    const merchant = await db.getMerchantByWallet(req.params.walletAddress);
    if (!merchant) {
      return res.status(404).json({ success: false, error: 'Merchant not found' });
    }
    res.json({ success: true, data: merchant });
  } catch (error) {
    logger.error('Failed to get merchant', error);
    res.status(500).json({ success: false, error: 'Failed to fetch merchant' });
  }
});

// Create merchant
router.post('/merchants', async (req: Request, res: Response) => {
  try {
    const { business_name, email, notification_email } = req.body;

    if (!business_name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: business_name, email' 
      });
    }

    // Generate wallet
    const wallet = Keypair.generate();
    const walletAddress = wallet.publicKey.toString();

    // Create merchant
    const merchant = await db.createMerchant({
      business_name,
      email,
      wallet_address: walletAddress,
      notification_email: notification_email || email,
      auto_convert_enabled: true,
    });

    if (!merchant) {
      return res.status(500).json({ success: false, error: 'Failed to create merchant' });
    }

    // Generate QR code for payments
    const solanaPayUrl = `solana:${walletAddress}`;
    const qrCode = await QRCode.toDataURL(solanaPayUrl, { width: 400 });

    res.json({
      success: true,
      data: {
        merchant,
        wallet_address: walletAddress,
        qr_code: qrCode,
        solana_pay_url: solanaPayUrl,
      }
    });

    logger.info(`Created merchant: ${business_name} (${walletAddress})`);
    
    // Add wallet to payment monitor
    try {
      const { monitorService } = await import('../services/MonitorService');
      await monitorService.addWallet(walletAddress);
      logger.info(`Added wallet to monitor: ${walletAddress}`);
    } catch (error) {
      logger.error('Failed to add wallet to monitor', error);
    }
  } catch (error) {
    logger.error('Failed to create merchant', error);
    res.status(500).json({ success: false, error: 'Failed to create merchant' });
  }
});

// Get transactions for merchant
router.get('/merchants/:merchantId/transactions', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await db.getTransactionsByMerchant(merchantId, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('Failed to get transactions', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// Get transaction by signature
router.get('/transactions/:signature', async (req: Request, res: Response) => {
  try {
    const transaction = await db.getTransactionBySignature(req.params.signature);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Failed to get transaction', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
});

// Generate payment QR code
router.post('/payments/qr', async (req: Request, res: Response) => {
  try {
    const { wallet_address, amount, label } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ success: false, error: 'Missing wallet_address' });
    }

    let solanaPayUrl = `solana:${wallet_address}`;
    if (amount) {
      solanaPayUrl += `?amount=${amount}`;
    }
    if (label) {
      solanaPayUrl += `${amount ? '&' : '?'}label=${encodeURIComponent(label)}`;
    }

    const qrCode = await QRCode.toDataURL(solanaPayUrl, { width: 400 });

    res.json({
      success: true,
      data: {
        qr_code: qrCode,
        solana_pay_url: solanaPayUrl,
      }
    });
  } catch (error) {
    logger.error('Failed to generate QR code', error);
    res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
});

// Get conversions for transaction
router.get('/transactions/:transactionId/conversions', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const { data, error } = await db.getClient()
      .from('conversions')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get conversions', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch conversions' });
    }

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Failed to get conversions', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversions' });
  }
});

// Retry failed conversion
router.post('/conversions/:conversionId/retry', async (req: Request, res: Response) => {
  try {
    const { conversionId } = req.params;

    const success = await conversionService.retryConversion(conversionId);

    if (success) {
      res.json({ success: true, message: 'Conversion retry successful' });
    } else {
      res.status(500).json({ success: false, error: 'Conversion retry failed' });
    }
  } catch (error) {
    logger.error('Failed to retry conversion', error);
    res.status(500).json({ success: false, error: 'Failed to retry conversion' });
  }
});

// ===== PAYMENT REQUESTS =====

// Create payment request
router.post('/payment-requests', async (req: Request, res: Response) => {
  try {
    const {
      merchant_id,
      amount_usd,
      order_id,
      customer_email,
      customer_name,
      description,
      callback_url,
      metadata,
      expires_in_minutes,
    } = req.body;

    if (!merchant_id || !amount_usd) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: merchant_id, amount_usd',
      });
    }

    if (amount_usd <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount_usd must be greater than 0',
      });
    }

    const result = await paymentRequestService.createPaymentRequest({
      merchant_id,
      amount_usd,
      order_id,
      customer_email,
      customer_name,
      description,
      callback_url,
      metadata,
      expires_in_minutes,
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment request',
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to create payment request', error);
    res.status(500).json({ success: false, error: 'Failed to create payment request' });
  }
});

// Get payment request by payment ID
router.get('/payment-requests/:paymentId', async (req: Request, res: Response) => {
  try {
    const paymentRequest = await paymentRequestService.getPaymentRequest(req.params.paymentId);

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payment request not found',
      });
    }

    res.json({ success: true, data: paymentRequest });
  } catch (error) {
    logger.error('Failed to get payment request', error);
    res.status(500).json({ success: false, error: 'Failed to get payment request' });
  }
});

// Get payment requests for merchant
router.get('/merchants/:merchantId/payment-requests', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const paymentRequests = await paymentRequestService.getPaymentRequestsByMerchant(
      req.params.merchantId,
      limit
    );

    res.json({ success: true, data: paymentRequests });
  } catch (error) {
    logger.error('Failed to get payment requests', error);
    res.status(500).json({ success: false, error: 'Failed to get payment requests' });
  }
});

// ===== MERCHANT SIGNUP =====

import { Connection, PublicKey } from '@solana/web3.js';
import { emailService } from '../services/EmailService';

// Check signup payment and create merchant
router.post('/signup/check-payment', async (req: Request, res: Response) => {
  try {
    const {
      platform_wallet,
      expected_amount,
      business_name,
      email,
      website,
    } = req.body;

    if (!platform_wallet || !expected_amount || !business_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if merchant with this email already exists
    const existingMerchants = await db.getAllMerchants();
    const existing = existingMerchants.find(m => m.email === email);
    
    if (existing) {
      // Merchant already created
      return res.json({
        success: true,
        data: {
          payment_confirmed: true,
          merchant_id: existing.id,
          already_exists: true,
        },
      });
    }

    // Check for recent payment to platform wallet
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    const pubKey = new PublicKey(platform_wallet);
    
    const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
    
    let paymentFound = false;
    let paymentSignature = '';
    
    for (const sigInfo of signatures) {
      // Only check recent transactions (last 5 minutes)
      const sigTime = sigInfo.blockTime ? sigInfo.blockTime * 1000 : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - sigTime > fiveMinutes) {
        continue;
      }

      // Fetch full transaction
      const tx = await connection.getParsedTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) {
        continue;
      }

      // Check if this is an incoming payment of the expected amount
      const preBalance = tx.meta.preBalances[1] || 0;
      const postBalance = tx.meta.postBalances[1] || 0;
      const amountLamports = postBalance - preBalance;
      const amountSOL = amountLamports / 1e9;

      // Allow 1% tolerance for amount
      const tolerance = expected_amount * 0.01;
      if (Math.abs(amountSOL - expected_amount) <= tolerance) {
        paymentFound = true;
        paymentSignature = sigInfo.signature;
        break;
      }
    }

    if (!paymentFound) {
      return res.json({
        success: true,
        data: {
          payment_confirmed: false,
        },
      });
    }

    // Payment confirmed! Create merchant account
    logger.info(`Signup payment confirmed for ${business_name} (${email})`);

    // Generate wallet for merchant
    const merchantWallet = Keypair.generate();
    const walletAddress = merchantWallet.publicKey.toString();

    // Create merchant
    const merchant = await db.createMerchant({
      business_name,
      email,
      wallet_address: walletAddress,
      notification_email: email,
      auto_convert_enabled: true,
    });

    if (!merchant) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create merchant account',
      });
    }

    logger.info(`Created merchant account: ${business_name} (ID: ${merchant.id})`);

    // Send welcome email
    try {
      await emailService.sendEmail({
        to: email,
        subject: '🎉 Welcome to Solana Payment Autopilot!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .credentials { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 14px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>☄️ Welcome to Solana Payment Autopilot!</h1>
              </div>
              <div class="content">
                <p>Hi ${business_name},</p>
                <p>Your merchant account is ready! Start accepting crypto payments now.</p>
                
                <h3>Your Credentials:</h3>
                <div class="credentials">
                  <strong>Merchant ID:</strong><br/>
                  ${merchant.id}<br/><br/>
                  
                  <strong>Payment Wallet:</strong><br/>
                  ${walletAddress}<br/><br/>
                  
                  <strong>Email:</strong><br/>
                  ${email}
                </div>
                
                <p>Next steps:</p>
                <ol>
                  <li>Visit your merchant dashboard</li>
                  <li>Integrate our SDK on your website (3 lines of code)</li>
                  <li>Start accepting payments!</li>
                </ol>
                
                <a href="http://localhost:5000" class="button">Open Dashboard →</a>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                  Need help? Reply to this email or check our documentation.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send welcome email', error);
    }

    // Add wallet to payment monitor
    try {
      const { monitorService } = await import('../services/MonitorService');
      await monitorService.addWallet(walletAddress);
      logger.info(`Added merchant wallet to monitor: ${walletAddress}`);
    } catch (error) {
      logger.error('Failed to add wallet to monitor', error);
    }

    res.json({
      success: true,
      data: {
        payment_confirmed: true,
        merchant_id: merchant.id,
        wallet_address: walletAddress,
        payment_signature: paymentSignature,
      },
    });

  } catch (error) {
    logger.error('Signup payment check failed', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

export default router;
