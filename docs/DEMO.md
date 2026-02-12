# 🚀 Quick Demo - Solana Payment Autopilot

**Test the MVP in 5 minutes on Solana Devnet**

---

## Prerequisites

- Node.js 18+ installed
- A Solana devnet wallet (Phantom, Solflare, etc.)

---

## Setup (2 minutes)

```bash
# Clone the repo
git clone https://github.com/kshitijofficial/solana-payment-autopilot.git
cd solana-payment-autopilot

# Install dependencies
npm install

# Run the demo
npm run demo
```

---

## What Happens

1. **Creates a merchant wallet** (saved to `merchant-wallet.json`)
2. **Requests 2 SOL airdrop** from devnet faucet
3. **Generates Solana Pay QR Code** (displayed in terminal + saved as PNG)
4. **Monitors for incoming payments** in real-time

---

## Testing the Payment Flow

### Option 1: Using Phantom Wallet (Easiest)

1. Open Phantom wallet
2. Switch to **Devnet** (Settings → Developer Settings → Testnet Mode)
3. Get devnet SOL from https://faucet.solana.com
4. Copy the merchant address from terminal
5. Send 0.1 SOL to that address
6. Watch the demo detect the payment in ~5 seconds! 🎉

### Option 2: Using Solana CLI

```bash
# Get devnet SOL
solana airdrop 1 <your-wallet> --url devnet

# Send payment to merchant
solana transfer <merchant-address> 0.1 --url devnet --allow-unfunded-recipient
```

### Option 3: Using the Payment URL

The demo generates a Solana Pay URL like:
```
solana:MERCHANT_ADDRESS?amount=0.1&label=Coffee
```

Copy this URL and open it in a Solana wallet app that supports Solana Pay.

---

## What You'll See

```
╔════════════════════════════════════════════════════╗
║   Solana Payment Autopilot - MVP Demo (Devnet)    ║
╚════════════════════════════════════════════════════╝

🔑 Creating merchant wallet...
✓ Wallet created: FvZ8...m2Qx
✓ Saved to merchant-wallet.json

💧 Requesting devnet airdrop...
✓ Received 2 SOL on devnet

💰 Current balance: 2.0000 SOL

📱 Generating Solana Pay QR Code...
✓ Amount: 0.1 SOL
✓ Label: Coffee Shop - Latte
✓ QR Code saved to: qr-codes/payment-1234567890.png

📱 Scan this QR code with your Solana wallet:
█████████████████████████████
█████████████████████████████
███ ▄▄▄▄▄ █▀█ █▄██ ▄▄▄▄▄ ███
███ █   █ █▀▀▀█ ▀█ █   █ ███
███ █▄▄▄█ █▀ █▀▀ █ █▄▄▄█ ███
[QR code displayed here]

📋 Or use this URL:
   solana:FvZ8...?amount=0.1&label=Coffee

👀 Monitoring for payments...
   Send SOL to this address from any devnet wallet
   Address: FvZ8m2Qx...
   Press Ctrl+C to stop

🎉 PAYMENT RECEIVED!
   Amount: 0.1 SOL
   Signature: 5Kqm...
   View: https://solscan.io/tx/5Kqm...?cluster=devnet

💱 Auto-conversion would happen here (Jupiter SOL → USDC)
   New balance: 2.1000 SOL
```

---

## How It Works

1. **Wallet Creation**
   - Generates Solana keypair
   - Saves to local JSON file (for demo purposes)

2. **Payment Monitoring**
   - Polls Solana devnet every 5 seconds
   - Checks for new transactions to merchant address
   - Parses transaction details

3. **Auto-Conversion** (simulated in demo)
   - In production: uses Jupiter to swap SOL → USDC
   - Keeps merchant funds stable

---

## Next: Full Version

The full version includes:
- PostgreSQL database for merchants
- REST API for dashboard
- React frontend
- Helius WebSocket (real-time, not polling)
- Jupiter integration (actual conversion)
- Email/SMS notifications
- Shopify/WooCommerce webhooks

But this demo shows the **core payment flow** working end-to-end! ✓

---

## Troubleshooting

**Airdrop failed?**
- Use https://faucet.solana.com manually
- Wait a minute and try again (rate limits)

**No payment detected?**
- Confirm you're on **devnet** (not mainnet)
- Check transaction on https://solscan.io (switch to devnet)
- Wait 10-15 seconds for confirmation

**Want to reset?**
- Delete `merchant-wallet.json`
- Run `npm run demo` again

---

## Questions?

Check the main README or open an issue on GitHub.

**Happy testing! 🚀**
