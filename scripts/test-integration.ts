import * as dotenv from 'dotenv';
dotenv.config();

import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { db } from './src/database/supabase';
import { PaymentMonitor } from './src/modules/PaymentMonitor';
import { logger } from './src/utils/logger';

async function runIntegrationTest() {
  console.log('🧪 Integration Test - Full Payment Flow\n');

  const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');

  // Step 1: Create test merchant
  console.log('1️⃣  Creating test merchant...');
  const merchantWallet = Keypair.generate();
  const merchantAddress = merchantWallet.publicKey.toString();

  const merchant = await db.createMerchant({
    business_name: 'Integration Test Merchant',
    email: `test-${Date.now()}@example.com`,
    wallet_address: merchantAddress,
    auto_convert_enabled: true,
  });

  if (!merchant) {
    console.error('❌ Failed to create merchant');
    process.exit(1);
  }

  console.log(`✅ Merchant created: ${merchant.business_name}`);
  console.log(`   ID: ${merchant.id}`);
  console.log(`   Wallet: ${merchantAddress}\n`);

  // Step 2: Start payment monitor
  console.log('2️⃣  Starting payment monitor...');
  const monitor = new PaymentMonitor(
    process.env.SOLANA_RPC_URL!,
    process.env.HELIUS_API_KEY!
  );

  let paymentDetected = false;

  monitor.on('payment', async (payment) => {
    console.log('\n🎉 PAYMENT DETECTED!');
    console.log(`   From: ${payment.fromAddress}`);
    console.log(`   Amount: ${payment.amount} ${payment.token}`);
    console.log(`   Signature: ${payment.signature}`);
    
    paymentDetected = true;

    // Verify in database
    const tx = await db.getTransactionBySignature(payment.signature);
    if (tx) {
      console.log('✅ Transaction saved to database');
      console.log(`   DB ID: ${tx.id}`);
      console.log(`   Status: ${tx.status}\n`);
    }
  });

  await monitor.start([merchantAddress]);
  console.log('✅ Monitoring started\n');

  // Step 3: Simulate payment (requires devnet SOL)
  console.log('3️⃣  Simulating payment...');
  
  try {
    // Create sender wallet (you'll need to fund this with devnet SOL)
    const senderWallet = Keypair.generate();
    console.log(`   Sender wallet: ${senderWallet.publicKey.toString()}`);
    console.log(`   ⚠️  Need to airdrop devnet SOL...\n`);

    // Request airdrop
    console.log('   Requesting airdrop...');
    const airdropSig = await connection.requestAirdrop(
      senderWallet.publicKey,
      0.5 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig);
    console.log('   ✅ Airdrop confirmed\n');

    // Send payment
    const amountToSend = 0.1 * LAMPORTS_PER_SOL;
    console.log(`   Sending ${amountToSend / LAMPORTS_PER_SOL} SOL to merchant...`);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: merchantWallet.publicKey,
        lamports: amountToSend,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [senderWallet]
    );

    console.log('   ✅ Payment sent!');
    console.log(`   Signature: ${signature}`);
    console.log(`   Explorer: https://solscan.io/tx/${signature}?cluster=devnet\n`);

    // Wait for payment detection
    console.log('4️⃣  Waiting for payment detection (15-30 seconds)...');
    
    const startTime = Date.now();
    const timeout = 60000; // 60 seconds

    while (!paymentDetected && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      process.stdout.write('.');
    }
    console.log('\n');

    if (paymentDetected) {
      console.log('✅ INTEGRATION TEST PASSED!\n');
      
      // Final verification
      const transactions = await db.getTransactionsByMerchant(merchant.id);
      console.log(`📊 Summary:`);
      console.log(`   Merchant: ${merchant.business_name}`);
      console.log(`   Total transactions: ${transactions.length}`);
      console.log(`   Payment amount: ${amountToSend / LAMPORTS_PER_SOL} SOL`);
      console.log(`   Detection time: ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
      
      monitor.stop();
      process.exit(0);
    } else {
      console.log('❌ INTEGRATION TEST FAILED: Payment not detected within timeout\n');
      monitor.stop();
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('airdrop')) {
      console.log('\n💡 TIP: Devnet airdrop might be rate-limited.');
      console.log('   Alternative: Send devnet SOL manually to:');
      console.log(`   ${merchantAddress}\n`);
    }
    
    monitor.stop();
    process.exit(1);
  }
}

runIntegrationTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
