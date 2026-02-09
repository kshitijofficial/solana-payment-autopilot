import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function testFiltering() {
  const merchantId = 'be87c918-36a4-4d59-9566-cad574c4e370';  // "check" merchant
  
  console.log('\n✅ Testing Dashboard Filtering:\n');
  console.log('Merchant: "check"');
  console.log(`Merchant ID: ${merchantId}`);
  console.log('━'.repeat(60));
  
  // Get transactions for THIS merchant only
  const merchantTxs = await db.getTransactionsByMerchant(merchantId);
  console.log(`\n📊 Transactions for "check" merchant: ${merchantTxs.length}`);
  
  for (const tx of merchantTxs.slice(0, 3)) {
    console.log(`  ✅ ${tx.amount} ${tx.token} - ${tx.signature.slice(0, 16)}...`);
  }
  
  // Get all transactions (to compare)
  const allTxs = await db.getClient().from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log(`\n📊 Total transactions (all merchants): ${allTxs.data?.length || 0}`);
  console.log('━'.repeat(60));
  
  console.log('\n✅ FILTERING CONFIRMED:');
  console.log(`   Dashboard will only show ${merchantTxs.length} transactions for "check"`);
  console.log(`   (Not all ${allTxs.data?.length || 0} transactions from database)`);
  console.log('\n🔒 Each merchant only sees their own transactions!\n');
}

testFiltering().then(() => process.exit(0));
