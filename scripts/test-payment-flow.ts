import * as dotenv from 'dotenv';
dotenv.config();

import { Keypair } from '@solana/web3.js';
import { PaymentMonitor } from './src/modules/PaymentMonitor';
import { db } from './src/database/supabase';
import { logger } from './src/utils/logger';
import QRCode from 'qrcode';

async function testPaymentFlow() {
  console.log('🚀 Solana Payment Autopilot - Test Flow\n');

  // Step 1: Create test merchant
  console.log('📝 Step 1: Creating test merchant...');
  
  const testWallet = Keypair.generate();
  const walletAddress = testWallet.publicKey.toString();
  
  console.log(`   Wallet address: ${walletAddress}`);
  console.log(`   Network: devnet`);

  const merchant = await db.createMerchant({
    business_name: 'Test Coffee Shop',
    email: `test-${Date.now()}@example.com`,
    wallet_address: walletAddress,
    notification_email: 'kshitij@example.com',
    auto_convert_enabled: true,
  });

  if (!merchant) {
    console.error('❌ Failed to create merchant');
    process.exit(1);
  }

  console.log(`   ✅ Merchant created: ${merchant.business_name}`);
  console.log(`   Merchant ID: ${merchant.id}\n`);

  // Step 2: Generate payment QR code
  console.log('🎫 Step 2: Generating payment QR code...');
  
  const amount = 0.1; // 0.1 SOL
  const solanaPayUrl = `solana:${walletAddress}?amount=${amount}&label=Test%20Payment`;
  
  const qrCodeDataUrl = await QRCode.toDataURL(solanaPayUrl, {
    width: 300,
    margin: 2,
  });
  
  console.log(`   Payment URL: ${solanaPayUrl}`);
  console.log(`   QR Code generated (data URL)`);
  console.log(`   💰 Amount: ${amount} SOL\n`);

  // Step 3: Start payment monitor
  console.log('👀 Step 3: Starting payment monitor...');
  
  const monitor = new PaymentMonitor(
    process.env.SOLANA_RPC_URL!,
    process.env.HELIUS_API_KEY!
  );

  // Listen for payment events
  monitor.on('payment', async (payment) => {
    console.log('\n🎉 PAYMENT RECEIVED!');
    console.log(`   From: ${payment.fromAddress}`);
    console.log(`   Amount: ${payment.amount} ${payment.token}`);
    console.log(`   Signature: ${payment.signature}`);
    console.log(`   Explorer: https://solscan.io/tx/${payment.signature}?cluster=devnet`);
    
    // Check database
    const transactions = await db.getTransactionsByMerchant(merchant.id);
    console.log(`\n   📊 Total transactions for merchant: ${transactions.length}`);
  });

  await monitor.start([walletAddress]);
  console.log('   ✅ Monitoring started\n');

  // Step 4: Instructions for testing
  console.log('📲 Step 4: Test the payment flow');
  console.log('   ─────────────────────────────────────────');
  console.log('   1. Open Phantom wallet (mobile or browser)');
  console.log('   2. Switch to DEVNET network');
  console.log('   3. Get devnet SOL: https://faucet.solana.com');
  console.log(`   4. Send ${amount} SOL to: ${walletAddress}`);
  console.log('   5. Watch for payment confirmation below\n');
  console.log('   🔗 Solana Pay URL (scan with Phantom):');
  console.log(`   ${solanaPayUrl}\n`);
  console.log('   ⏳ Waiting for payment...\n');
  console.log('   (Press Ctrl+C to stop)\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping payment monitor...');
    monitor.stop();
    process.exit(0);
  });
}

testPaymentFlow().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
