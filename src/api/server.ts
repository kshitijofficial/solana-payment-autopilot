import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import path from 'path';
import { Connection, PublicKey } from '@solana/web3.js';
import { QRCodeGenerator } from '../modules/QRCodeGenerator';

const app = express();
const PORT = 3000;
const DEVNET_RPC = 'https://api.devnet.solana.com';

app.use(cors());
app.use(express.json());

const connection = new Connection(DEVNET_RPC, 'confirmed');
const qrGenerator = new QRCodeGenerator();

// In-memory payment storage
let payments: any[] = [];

// Get merchant wallet
app.get('/api/merchant/wallet', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), 'merchant-wallet.json');
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({ error: 'Wallet not found. Run npm run demo first.' });
    }
    
    const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    const balance = await connection.getBalance(new PublicKey(wallet.publicKey));
    
    res.json({ 
      publicKey: wallet.publicKey,
      balance: (balance / 1e9).toFixed(4)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments
app.get('/api/payments', (req, res) => {
  res.json(payments);
});

// Generate QR code
app.post('/api/qr/generate', async (req, res) => {
  try {
    const { amount, label = 'Payment' } = req.body;
    
    const walletPath = path.join(process.cwd(), 'merchant-wallet.json');
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    
    const result = await qrGenerator.generatePaymentQR({
      recipient: wallet.publicKey,
      amount: parseFloat(amount),
      label,
      message: 'Payment via Solana Payment Autopilot'
    });
    
    res.json({
      url: result.url,
      qrCodeDataURL: result.qrCodeDataURL,
      qrCodeFilePath: result.qrCodeFilePath
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Poll for new payments
app.get('/api/payments/check', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), 'merchant-wallet.json');
    if (!fs.existsSync(walletPath)) {
      return res.json({ newPayments: [] });
    }
    
    const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    const pubKey = new PublicKey(wallet.publicKey);
    
    const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 });
    
    const newPayments = [];
    for (const sig of signatures) {
      // Check if we already have this payment
      if (payments.find(p => p.signature === sig.signature)) continue;
      
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0
      });
      
      if (tx && tx.meta && !tx.meta.err) {
        const postBalance = tx.meta.postBalances[1] || 0;
        const preBalance = tx.meta.preBalances[1] || 0;
        const amount = (postBalance - preBalance) / 1e9;
        
        if (amount > 0) {
          const payment = {
            signature: sig.signature,
            amount: amount.toFixed(4),
            timestamp: new Date(sig.blockTime! * 1000).toLocaleString(),
            status: 'confirmed'
          };
          payments.unshift(payment);
          newPayments.push(payment);
        }
      }
    }
    
    res.json({ newPayments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`));
