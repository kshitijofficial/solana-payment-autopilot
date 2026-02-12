import * as dotenv from 'dotenv';
dotenv.config();

import { Connection } from '@solana/web3.js';
import { db } from './src/database/supabase';

const walletAddress = '8FpKD3ju9axxoie6uGn9AMD4H6ukNB1RfWFe6xiHR8FV';

async function processWallet() {
  console.log(`🔍 Processing wallet: ${walletAddress}\n`);

  // Check if merchant exists
  const merchant = await db.getMerchantByWallet(walletAddress);
  
  if (!merchant) {
    console.log('❌ Merchant not found! Creating now...\n');
    
    const newMerchant = await db.createMerchant({
      business_name: 'My Shop',
      email: 'shop@example.com',
      wallet_address: walletAddress,
      notification_email: 'shop@example.com',
      auto_convert_enabled: true,
    });
    
    if (newMerchant) {
      console.log(`✅ Merchant created: ${newMerchant.business_name}\n`);
    }
  } else {
    console.log(`✅ Merchant exists: ${merchant.business_name}\n`);
  }

  // Fetch all transactions
  const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
  const signatures = await connection.getSignaturesForAddress(
    new (await import('@solana/web3.js')).PublicKey(walletAddress),
    { limit: 10 }
  );

  console.log(`📊 Found ${signatures.length} transactions on blockchain\n`);

  for (const sig of signatures) {
    // Check if already in DB
    const existing = await db.getTransactionBySignature(sig.signature);
    if (existing) {
      console.log(`⏭️  Skipping (already saved): ${sig.signature.slice(0, 8)}...`);
      continue;
    }

    // Fetch details
    const tx = await connection.getParsedTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) continue;

    const preBalance = tx.meta.preBalances[0] || 0;
    const postBalance = tx.meta.postBalances[0] || 0;
    const amountLamports = preBalance - postBalance;
    const amountSOL = amountLamports / 1e9;
    
    if (amountSOL <= 0) continue; // Skip if not incoming

    const fromAddress = tx.transaction.message.accountKeys[0].pubkey.toString();

    console.log(`💰 Processing: ${amountSOL} SOL from ${fromAddress.slice(0, 8)}...`);

    // Save to database
    const merchantData = merchant || await db.getMerchantByWallet(walletAddress);
    if (!merchantData) {
      console.log('❌ Still no merchant found');
      continue;
    }

    await db.createTransaction({
      merchant_id: merchantData.id,
      signature: sig.signature,
      from_address: fromAddress,
      to_address: walletAddress,
      amount: amountSOL,
      token: 'SOL',
      status: 'confirmed',
      confirmations: 32,
      block_time: new Date((sig.blockTime || 0) * 1000),
    });

    console.log(`✅ Saved: ${sig.signature.slice(0, 8)}...\n`);
  }

  console.log('\n🎉 Done! Check your dashboard: http://localhost:5173\n');
}

processWallet().catch(console.error);
