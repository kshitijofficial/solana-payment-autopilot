import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Get merchant wallet
app.get('/api/merchant/wallet', (req, res) => {
  const walletPath = path.join(process.cwd(), 'merchant-wallet.json');
  if (fs.existsSync(walletPath)) {
    const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    res.json({ publicKey: wallet.publicKey });
  } else {
    res.status(404).json({ error: 'Wallet not found. Run demo first.' });
  }
});

// Get payments
app.get('/api/payments', (req, res) => {
  // TODO: Load from database
  res.json([]);
});

// Generate QR code
app.post('/api/qr/generate', async (req, res) => {
  const { amount, label } = req.body;
  // TODO: Use QRCodeGenerator
  res.json({ url: 'solana:...', qrCode: 'base64...' });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
