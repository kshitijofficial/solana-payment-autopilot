import * as dotenv from 'dotenv';
dotenv.config();

import { Keypair } from '@solana/web3.js';
import { db } from './src/database/supabase';
import { PaymentMonitor } from './src/modules/PaymentMonitor';
import { logger } from './src/utils/logger';
import QRCode from 'qrcode';

async function runDay1Tests() {
  console.log('🧪 Day 1 Complete Test Suite\n');
  console.log('═'.repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Database Connection
  console.log('\n[Test 1] Database Connection');
  try {
    const merchants = await db.getAllMerchants();
    console.log(`   ✅ Connected to Supabase (${merchants.length} merchants)`);
    testsPassed++;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error);
    testsFailed++;
    return;
  }

  // Test 2: Create Merchant
  console.log('\n[Test 2] Create Merchant');
  let testMerchant;
  let testWallet;
  try {
    testWallet = Keypair.generate();
    const walletAddress = testWallet.publicKey.toString();
    
    testMerchant = await db.createMerchant({
      business_name: `Test Merchant ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      wallet_address: walletAddress,
      notification_email: 'test@example.com',
      auto_convert_enabled: true,
    });

    if (testMerchant) {
      console.log(`   ✅ Merchant created: ${testMerchant.business_name}`);
      console.log(`   Wallet: ${testMerchant.wallet_address}`);
      testsPassed++;
    } else {
      throw new Error('Failed to create merchant');
    }
  } catch (error) {
    console.error('   ❌ Merchant creation failed:', error);
    testsFailed++;
    return;
  }

  // Test 3: Generate QR Code
  console.log('\n[Test 3] Generate Payment QR Code');
  try {
    const amount = 0.05;
    const solanaPayUrl = `solana:${testMerchant.wallet_address}?amount=${amount}&label=Test%20Payment`;
    const qrCode = await QRCode.toDataURL(solanaPayUrl, { width: 300 });
    
    console.log(`   ✅ QR code generated`);
    console.log(`   URL: ${solanaPayUrl}`);
    console.log(`   Data URL length: ${qrCode.length} chars`);
    testsPassed++;
  } catch (error) {
    console.error('   ❌ QR generation failed:', error);
    testsFailed++;
  }

  // Test 4: Payment Monitor Initialization
  console.log('\n[Test 4] Payment Monitor Initialization');
  try {
    const monitor = new PaymentMonitor(
      process.env.SOLANA_RPC_URL!,
      process.env.HELIUS_API_KEY!
    );
    
    await monitor.start([testMerchant.wallet_address]);
    console.log('   ✅ Payment monitor started');
    console.log('   Polling: Every 15 seconds');
    
    // Stop immediately after starting
    monitor.stop();
    testsPassed++;
  } catch (error) {
    console.error('   ❌ Payment monitor failed:', error);
    testsFailed++;
  }

  // Test 5: Retrieve Transactions
  console.log('\n[Test 5] Retrieve Transactions');
  try {
    const transactions = await db.getTransactionsByMerchant(testMerchant.id, 10);
    console.log(`   ✅ Fetched transactions (${transactions.length} found)`);
    testsPassed++;
  } catch (error) {
    console.error('   ❌ Transaction retrieval failed:', error);
    testsFailed++;
  }

  // Test 6: Environment Variables
  console.log('\n[Test 6] Environment Variables');
  const envVars = [
    'SOLANA_RPC_URL',
    'HELIUS_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'RESEND_API_KEY',
    'JUPITER_API_URL',
  ];
  
  let allEnvSet = true;
  for (const envVar of envVars) {
    if (!process.env[envVar]) {
      console.log(`   ❌ Missing: ${envVar}`);
      allEnvSet = false;
    }
  }
  
  if (allEnvSet) {
    console.log(`   ✅ All environment variables set`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Day 1 setup complete.\n');
    console.log('📋 Ready for Manual Testing:');
    console.log('   1. Start API server: npm run api');
    console.log('   2. Start payment monitor with test merchant');
    console.log('   3. Send devnet SOL to test wallet');
    console.log('   4. Verify transaction appears in database\n');
    console.log(`🔗 Test Wallet Address: ${testMerchant.wallet_address}`);
    console.log(`🔗 Get devnet SOL: https://faucet.solana.com\n`);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

runDay1Tests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
