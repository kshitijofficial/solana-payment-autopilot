#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function quickTest() {
  console.log('\n🧪 Day 1 Quick Test\n');
  
  try {
    // 1. Database connection
    console.log('1️⃣  Testing database connection...');
    const merchants = await db.getAllMerchants();
    console.log(`   ✅ Database connected (${merchants.length} merchants)\n`);
    
    // 2. List merchants
    console.log('2️⃣  Merchants in database:');
    if (merchants.length === 0) {
      console.log('   (none yet - create one via API)\n');
    } else {
      merchants.slice(0, 5).forEach(m => {
        console.log(`   - ${m.business_name} (${m.email})`);
        console.log(`     Wallet: ${m.wallet_address}`);
      });
      console.log('');
    }
    
    // 3. Recent transactions
    if (merchants.length > 0) {
      console.log('3️⃣  Recent transactions:');
      const recentMerchant = merchants[0];
      const txs = await db.getTransactionsByMerchant(recentMerchant.id, 5);
      
      if (txs.length === 0) {
        console.log(`   (none yet for ${recentMerchant.business_name})\n`);
      } else {
        txs.forEach(tx => {
          console.log(`   - ${tx.amount} ${tx.token} from ${tx.from_address.slice(0, 8)}...`);
          console.log(`     Status: ${tx.status} | Signature: ${tx.signature.slice(0, 12)}...`);
        });
        console.log('');
      }
    }
    
    // 4. Summary
    console.log('📊 Summary:');
    console.log(`   ✅ Database: Connected`);
    console.log(`   ✅ Merchants: ${merchants.length}`);
    
    const allTxs = await Promise.all(
      merchants.map(m => db.getTransactionsByMerchant(m.id))
    );
    const totalTxs = allTxs.reduce((sum, txs) => sum + txs.length, 0);
    console.log(`   ✅ Transactions: ${totalTxs}`);
    console.log('');
    
    console.log('✅ Day 1 core systems operational!\n');
    console.log('📋 Next steps:');
    console.log('   1. Start API: npm run api');
    console.log('   2. Create merchant: curl -X POST http://localhost:3000/api/merchants ...');
    console.log('   3. Send devnet SOL to merchant wallet');
    console.log('   4. Wait 15-30s for detection');
    console.log('   5. Check transactions via API\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

quickTest();
