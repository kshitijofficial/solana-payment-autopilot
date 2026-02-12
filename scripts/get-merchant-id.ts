import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function getMerchantId() {
  const merchants = await db.getClient().from('merchants')
    .select('id, business_name, wallet_address, auto_convert_enabled')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (merchants.data && merchants.data.length > 0) {
    console.log('\n📊 Available Merchants:\n');
    for (const m of merchants.data) {
      console.log(`✅ ${m.business_name}`);
      console.log(`   ID: ${m.id}`);
      console.log(`   Wallet: ${m.wallet_address}`);
      console.log(`   Auto-convert: ${m.auto_convert_enabled ? 'ON' : 'OFF'}`);
      console.log();
    }
    
    console.log('━'.repeat(60));
    console.log('\n💡 Copy the merchant ID above and use it in demo/index.html');
    console.log('   Replace: REPLACE_WITH_YOUR_MERCHANT_ID');
    console.log(`   With: ${merchants.data[0].id}\n`);
  } else {
    console.log('No merchants found. Create one first.');
  }
}

getMerchantId().then(() => process.exit(0));
