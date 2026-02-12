import * as dotenv from 'dotenv';
dotenv.config();

import { Connection, PublicKey } from '@solana/web3.js';
import { db } from './src/database/supabase';
import { logger } from './src/utils/logger';

async function processTransactionManually() {
  const walletAddress = '4eF3DNutvtqDyJabiqJCobwPqurVfSfxHPCriGDKMQcJ';
  const txSignature = '3KgSz6cdEMuedA24tpcLcu7cSNiwjMiWpHFQz2PjfewgEBWnbFPdGEHkkBeGsARWbUXmiz7fRpAwaHW9RAGYiL78';

  console.log('🔍 Processing transaction manually...\n');

  // Check if merchant exists
  const merchant = await db.getMerchantByWallet(walletAddress);
  
  if (!merchant) {
    console.log('❌ Merchant not found in database!');
    console.log(`   Wallet: ${walletAddress}`);
    console.log('\n💡 Create this merchant first:');
    console.log(`   curl -X POST http://localhost:3000/api/merchants -H "Content-Type: application/json" -d '{"business_name":"Your Shop","email":"you@example.com"}'`);
    console.log('   Then update the wallet_address in Supabase manually or recreate with this address.');
    process.exit(1);
  }

  console.log(`✅ Merchant found: ${merchant.business_name} (${merchant.email})\n`);

  // Check if transaction already saved
  const existing = await db.getTransactionBySignature(txSignature);
  if (existing) {
    console.log('✅ Transaction already in database!');
    console.log(`   Signature: ${txSignature}`);
    console.log(`   Amount: ${existing.amount} ${existing.token}`);
    console.log(`   Status: ${existing.status}\n`);
    console.log('🌐 View in dashboard: http://localhost:5173');
    process.exit(0);
  }

  // Fetch transaction details from blockchain
  const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
  const tx = await connection.getParsedTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    console.log('❌ Transaction not found on blockchain');
    process.exit(1);
  }

  // Parse transaction
  const preBalance = tx.meta?.preBalances[0] || 0;
  const postBalance = tx.meta?.postBalances[0] || 0;
  const amountLamports = preBalance - postBalance;
  const amountSOL = amountLamports / 1e9;
  const fromAddress = tx.transaction.message.accountKeys[0].pubkey.toString();

  console.log('📊 Transaction Details:');
  console.log(`   From: ${fromAddress}`);
  console.log(`   To: ${walletAddress}`);
  console.log(`   Amount: ${amountSOL} SOL`);
  console.log(`   Signature: ${txSignature}`);
  console.log(`   Block Time: ${new Date((tx.blockTime || 0) * 1000).toLocaleString()}\n`);

  // Save to database
  const saved = await db.createTransaction({
    merchant_id: merchant.id,
    signature: txSignature,
    from_address: fromAddress,
    to_address: walletAddress,
    amount: amountSOL,
    token: 'SOL',
    status: 'confirmed',
    confirmations: 32,
    block_time: new Date((tx.blockTime || 0) * 1000),
  });

  if (saved) {
    console.log('✅ Transaction saved to database!');
    console.log(`   Transaction ID: ${saved.id}\n`);
    console.log('🎉 SUCCESS! Refresh your dashboard to see the transaction.\n');
    console.log('🌐 Dashboard: http://localhost:5173');
  } else {
    console.log('❌ Failed to save transaction to database');
  }
}

processTransactionManually().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
