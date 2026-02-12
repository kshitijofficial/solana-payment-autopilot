import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';
import { logger } from './src/utils/logger';

/**
 * Check if database tables exist
 */
async function checkDatabase() {
  console.log('🔍 Checking database tables...\n');

  try {
    // Check merchants table
    console.log('Checking merchants table...');
    const merchants = await db.getAllMerchants();
    console.log(`✅ merchants table exists (${merchants.length} merchants)`);

    // Check transactions table
    console.log('Checking transactions table...');
    const { data: transactions } = await db.getClient()
      .from('transactions')
      .select('id')
      .limit(1);
    console.log(`✅ transactions table exists`);

    // Check conversions table
    console.log('Checking conversions table...');
    const { data: conversions } = await db.getClient()
      .from('conversions')
      .select('id')
      .limit(1);
    console.log(`✅ conversions table exists`);

    // Check payment_requests table (NEW)
    console.log('Checking payment_requests table...');
    const { data: paymentRequests, error } = await db.getClient()
      .from('payment_requests')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ payment_requests table DOES NOT EXIST');
        console.log('\n🔧 You need to apply the migration:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Click "New Query"');
        console.log('5. Paste contents of: database/migration-payment-requests.sql');
        console.log('6. Click "Run"\n');
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log(`✅ payment_requests table exists\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tables ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nYou can now run:');
    console.log('  npx tsx test-payment-request-system.ts');
    console.log('');

  } catch (error: any) {
    console.error('❌ Database check failed:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check SUPABASE_URL in .env');
    console.log('2. Check SUPABASE_PUBLISHABLE_KEY in .env');
    console.log('3. Make sure you ran the schema.sql in Supabase');
    console.log('4. Check Supabase project is active');
    
    process.exit(1);
  }
}

checkDatabase();
