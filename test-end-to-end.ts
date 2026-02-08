import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';
import { conversionService } from './src/services/ConversionService';
import { Keypair } from '@solana/web3.js';

async function testEndToEnd() {
  console.log('🧪 End-to-End Test: Payment → Conversion\n');

  // Get a merchant with a real transaction
  console.log('[Step 1] Finding merchant with transactions...');
  const merchants = await db.getAllMerchants();
  
  let testMerchant = null;
  let testTransaction = null;
  
  for (const merchant of merchants) {
    const txs = await db.getTransactionsByMerchant(merchant.id, 5);
    if (txs.length > 0) {
      testMerchant = merchant;
      testTransaction = txs[0];
      break;
    }
  }

  if (!testMerchant || !testTransaction) {
    console.log('❌ No merchants with transactions found');
    console.log('   Create a merchant and send a payment first\n');
    return;
  }

  console.log(`✅ Found merchant: ${testMerchant.business_name}`);
  console.log(`✅ Found transaction: ${testTransaction.amount} ${testTransaction.token}`);
  console.log(`   Signature: ${testTransaction.signature.slice(0, 16)}...\n`);

  // Check if conversion already exists
  console.log('[Step 2] Checking for existing conversion...');
  const { data: existingConv } = await db.getClient()
    .from('conversions')
    .select('*')
    .eq('transaction_id', testTransaction.id)
    .maybeSingle();

  if (existingConv) {
    console.log(`✅ Conversion already exists:`);
    console.log(`   Status: ${existingConv.status}`);
    console.log(`   ${existingConv.from_amount} ${existingConv.from_token} → ${existingConv.to_amount} ${existingConv.to_token}\n`);
  } else {
    console.log('No existing conversion found');
    
    // Trigger conversion
    console.log('\n[Step 3] Triggering auto-conversion...');
    
    const mockKeypair = Keypair.generate();
    const success = await conversionService.processConversion(
      testTransaction.id,
      mockKeypair,
      parseFloat(testTransaction.amount)
    );

    if (success) {
      console.log('✅ Conversion triggered successfully\n');
    } else {
      console.log('❌ Conversion failed\n');
      return;
    }
  }

  // Verify in database
  console.log('[Step 4] Verifying conversion in database...');
  const { data: finalConv } = await db.getClient()
    .from('conversions')
    .select('*')
    .eq('transaction_id', testTransaction.id)
    .maybeSingle();

  if (finalConv) {
    console.log('✅ Conversion verified in database:');
    console.log(`   ID: ${finalConv.id}`);
    console.log(`   From: ${finalConv.from_amount} ${finalConv.from_token}`);
    console.log(`   To: ${finalConv.to_amount} ${finalConv.to_token}`);
    console.log(`   Status: ${finalConv.status}`);
    console.log(`   Swap Signature: ${finalConv.swap_signature.slice(0, 16)}...\n`);
  } else {
    console.log('❌ Conversion not found in database\n');
    return;
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n🎉 End-to-End Test Passed!\n');
  console.log('Flow verified:');
  console.log(`  1. Payment received: ${testTransaction.amount} ${testTransaction.token}`);
  console.log(`  2. Auto-conversion triggered`);
  console.log(`  3. Swap executed: ${finalConv.to_amount} ${finalConv.to_token}`);
  console.log(`  4. Conversion saved with status: ${finalConv.status}`);
  console.log('\n💡 Refresh your dashboard to see the conversion!\n');
}

testEndToEnd().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
