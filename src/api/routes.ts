import { Router, Request, Response } from 'express';
import { db } from '../database/supabase';
import { logger } from '../utils/logger';
import { Keypair } from '@solana/web3.js';
import QRCode from 'qrcode';

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

export default router;
