import * as dotenv from 'dotenv';
dotenv.config();

import { JupiterConverter } from './src/modules/JupiterConverter';
import { db } from './src/database/supabase';

async function testJupiter() {
  console.log('Testing Jupiter Integration\n');

  const isDevnet = process.env.SOLANA_NETWORK === 'devnet';
  console.log(`Network: ${isDevnet ? 'DEVNET' : 'MAINNET'}`);

  if (isDevnet) {
    console.log('Jupiter does not support devnet');
    console.log('Will use simulated swaps for testing\n');
  }

  // Test: Simulate Conversion
  console.log('[Test] Simulate Conversion');

  const converter = new JupiterConverter(process.env.SOLANA_RPC_URL!);
  const testAmount = 0.05;

  const swapResult = await converter.simulateSwap(testAmount);

  if (swapResult.success) {
    console.log(`Simulated swap successful:`);
    console.log(`  Input: ${swapResult.inputAmount} SOL`);
    console.log(`  Output: ${swapResult.outputAmount} USDC`);
    console.log(`  Signature: ${swapResult.signature?.slice(0, 16)}...\n`);
  } else {
    console.log(`Simulation failed: ${swapResult.error}\n`);
    return;
  }

  // Test: Database Integration
  console.log('[Test] Database Integration');

  const merchants = await db.getAllMerchants();
  if (merchants.length === 0) {
    console.log('No merchants found. Create a merchant first.');
    return;
  }

  const merchant = merchants[0];
  console.log(`Using merchant: ${merchant.business_name}`);

  // Create test conversion record
  const testConversion = await db.createConversion({
    transaction_id: '00000000-0000-0000-0000-000000000000',
    from_token: 'SOL',
    to_token: 'USDC',
    from_amount: testAmount,
    to_amount: swapResult.outputAmount,
    swap_signature: swapResult.signature || 'test-signature',
    slippage_bps: 50,
    status: 'completed',
  });

  if (testConversion) {
    console.log(`Conversion record created:`);
    console.log(`  ID: ${testConversion.id}`);
    console.log(`  ${testConversion.from_amount} ${testConversion.from_token} -> ${testConversion.to_amount} ${testConversion.to_token}`);
    console.log(`  Status: ${testConversion.status}\n`);
  } else {
    console.log('Failed to create conversion record\n');
    return;
  }

  console.log('All tests passed! Jupiter integration ready for Day 2!\n');
}

testJupiter().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
