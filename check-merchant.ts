import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function checkMerchant() {
  const merchant = await db.getClient().from('merchants')
    .select('*')
    .eq('id', 'be87c918-36a4-4d59-9566-cad574c4e370')
    .single();
  
  if (merchant.data) {
    console.log('\n📊 Merchant Details:\n');
    console.log(`  Business: ${merchant.data.business_name}`);
    console.log(`  Email: ${merchant.data.email}`);
    console.log(`  Notification Email: ${merchant.data.notification_email || 'NOT SET'}`);
    console.log(`  Auto-convert: ${merchant.data.auto_convert_enabled}`);
    console.log(`  Wallet: ${merchant.data.wallet_address}`);
  }
}

checkMerchant().then(() => process.exit(0));
