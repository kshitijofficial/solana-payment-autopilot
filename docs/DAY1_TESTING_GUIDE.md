# Day 1 Testing Guide 🧪

Quick guide to test the payment flow yourself.

---

## Prerequisites

✅ API server running (should already be started)  
✅ Devnet SOL from faucet  
✅ Phantom wallet (optional, for QR code testing)

---

## Test 1: API Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T..."
}
```

---

## Test 2: Create Merchant & Get Wallet

```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Coffee Shop",
    "email": "test@example.com"
  }' | jq .
```

**Expected output:**
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "abc-123-...",
      "business_name": "Test Coffee Shop",
      "wallet_address": "HHjT..."
    },
    "qr_code": "data:image/png;base64,...",
    "solana_pay_url": "solana:HHjT..."
  }
}
```

**Save the wallet_address and merchant.id!**

---

## Test 3: Fund Merchant Wallet

### Option A: Solana CLI
```bash
solana airdrop 0.5 <WALLET_ADDRESS> --url devnet
```

### Option B: Web Faucet
1. Go to https://faucet.solana.com
2. Paste wallet address
3. Select "Devnet"
4. Request airdrop

---

## Test 4: Send Payment

### Option A: Phantom Wallet
1. Switch to Devnet network
2. Send 0.1 SOL to merchant wallet address

### Option B: Solana CLI
```bash
solana transfer <MERCHANT_WALLET> 0.1 --url devnet --allow-unfunded-recipient
```

---

## Test 5: Check Payment Detection

**Wait 15-30 seconds** (polling interval), then:

```bash
curl http://localhost:3000/api/merchants/<MERCHANT_ID>/transactions | jq .
```

**Expected output:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx-123...",
      "signature": "5Kj...",
      "from_address": "sender...",
      "to_address": "merchant...",
      "amount": "0.100000000",
      "token": "SOL",
      "status": "confirmed",
      "created_at": "2026-02-08T..."
    }
  ]
}
```

---

## Test 6: Verify in Supabase Dashboard

1. Go to Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor"
4. Check `transactions` table
5. You should see the payment record

---

## Test 7: Generate QR Code

```bash
curl -X POST http://localhost:3000/api/payments/qr \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "<MERCHANT_WALLET>",
    "amount": 0.05,
    "label": "Coffee"
  }' | jq -r '.data.qr_code' > qr.txt
```

Then open `qr.txt` in browser (it's a data URL) to see the QR code.

---

## Troubleshooting

### Payment not detected?
- Check API logs: `docker logs <container> -f` or check terminal
- Verify polling is running (logs every 15s)
- Confirm transaction on Solscan: `https://solscan.io/tx/<SIGNATURE>?cluster=devnet`

### Airdrop failed?
- Rate limit hit - wait 5 minutes and try again
- Use alternative faucet: https://solfaucet.com

### Database error?
- Check Supabase connection string in `.env`
- Verify tables exist in Supabase dashboard
- Run `npm run test:db` to test connection

---

## Success Checklist

- [ ] API health check passes
- [ ] Merchant created successfully
- [ ] Wallet funded with devnet SOL
- [ ] Payment sent to merchant
- [ ] Payment detected within 30 seconds
- [ ] Transaction visible in API response
- [ ] Transaction visible in Supabase dashboard

---

**Once all tests pass, Day 1 is validated! ✅**

Next: Day 2 - Jupiter SOL→USDC conversion
