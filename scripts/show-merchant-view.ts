import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function showMerchantView() {
  const merchantId = 'be87c918-36a4-4d59-9566-cad574c4e370';
  
  console.log('\n👨‍💼 MERCHANT DASHBOARD VIEW\n');
  console.log('━'.repeat(60));
  
  // What merchant sees
  const transactions = await db.getTransactionsByMerchant(merchantId, 3);
  
  console.log('\n📊 Recent Transactions:\n');
  for (const tx of transactions) {
    const date = new Date(tx.created_at);
    console.log(`┌─────────────────────────────────────────────`);
    console.log(`│ ✅ Status: ${tx.status.toUpperCase()}`);
    console.log(`│ 💰 Amount: ${tx.amount} ${tx.token}`);
    console.log(`│ 👤 From: ${tx.from_address.slice(0, 8)}...${tx.from_address.slice(-8)}`);
    console.log(`│ 🔗 Signature: ${tx.signature.slice(0, 16)}...`);
    console.log(`│ 🕐 Time: ${date.toLocaleString()}`);
    console.log(`└─────────────────────────────────────────────\n`);
  }
  
  console.log('━'.repeat(60));
  console.log('\n❌ Merchant DOES NOT see:');
  console.log('   - Customer QR code');
  console.log('   - Checkout page');
  console.log('   - Customer email/details (unless in payment request)\n');
  
  console.log('✅ Merchant DOES see:');
  console.log('   - Transaction records (payment completed)');
  console.log('   - Payment amounts and signatures');
  console.log('   - Conversion status (SOL → USDC)');
  console.log('   - Export CSV for accounting\n');
  
  // Show payment requests
  const requests = await db.getClient().from('payment_requests')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(2);
  
  if (requests.data && requests.data.length > 0) {
    console.log('━'.repeat(60));
    console.log('\n🎯 Recent Payment Requests (with customer info):\n');
    for (const req of requests.data) {
      console.log(`Payment ID: ${req.payment_id}`);
      console.log(`Customer: ${req.customer_email || 'N/A'}`);
      console.log(`Amount: ${req.amount_sol} SOL ($${req.amount_usd})`);
      console.log(`Status: ${req.status.toUpperCase()}`);
      console.log(`Order: ${req.order_id || 'N/A'}\n`);
    }
  }
  
  console.log('━'.repeat(60));
}

showMerchantView().then(() => process.exit(0));
