import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function checkConversionEmails() {
  // Get recent conversion
  const conversion = await db.getClient().from('conversions')
    .select('*, transactions(merchant_id)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (conversion.data) {
    console.log('\n🔄 Recent Conversion:');
    console.log(`  Status: ${conversion.data.status}`);
    console.log(`  From: ${conversion.data.from_amount} ${conversion.data.from_token}`);
    console.log(`  To: ${conversion.data.to_amount} ${conversion.data.to_token}`);
    console.log(`  Transaction ID: ${conversion.data.transaction_id}`);
    
    if (conversion.data.transactions) {
      const merchantId = (conversion.data.transactions as any).merchant_id;
      console.log(`  Merchant ID: ${merchantId}`);
      
      // Get merchant
      const merchant = await db.getClient().from('merchants')
        .select('*')
        .eq('id', merchantId)
        .single();
      
      if (merchant.data) {
        console.log(`\n📧 Merchant Email Settings:`);
        console.log(`  Business: ${merchant.data.business_name}`);
        console.log(`  Email: ${merchant.data.email}`);
        console.log(`  Notification Email: ${merchant.data.notification_email || 'NOT SET'}`);
      }
    }
  }
}

checkConversionEmails().then(() => process.exit(0));
