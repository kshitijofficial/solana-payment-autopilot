import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';
import { conversionService } from './src/services/ConversionService';
import { Keypair } from '@solana/web3.js';

async function testConversionEmail() {
  console.log('\n🔄 Testing conversion email flow...\n');
  
  // Get the most recent completed conversion
  const conversion = await db.getClient().from('conversions')
    .select('*, transactions(merchant_id)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!conversion.data) {
    console.log('No completed conversions found');
    return;
  }
  
  const merchantId = (conversion.data.transactions as any).merchant_id;
  console.log(`Transaction ID: ${conversion.data.transaction_id}`);
  console.log(`Merchant ID: ${merchantId}`);
  
  // Get merchant
  const merchant = await db.getClient().from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single();
  
  if (!merchant.data) {
    console.log('Merchant not found');
    return;
  }
  
  console.log(`Business: ${merchant.data.business_name}`);
  console.log(`Email: ${merchant.data.notification_email || merchant.data.email}`);
  
  // Manually trigger conversion email
  console.log('\n📧 Manually sending conversion email...\n');
  
  const mockKeypair = Keypair.generate();
  await (conversionService as any).processConversion(
    conversion.data.transaction_id,
    mockKeypair,
    conversion.data.from_amount,
    merchant.data.notification_email || merchant.data.email,
    merchant.data.business_name
  );
  
  console.log('\n✅ Test complete!');
}

testConversionEmail().then(() => process.exit(0));
