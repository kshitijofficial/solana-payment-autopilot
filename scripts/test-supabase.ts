import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!
  );

  try {
    console.log('🔌 Connecting to Supabase...');
    
    // Test query - check if merchants table exists
    const { data, error, count } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Query failed:', error);
      return;
    }

    console.log('✅ Connected successfully!');
    console.log('👥 Merchants in database:', count);

    // List all merchants
    const { data: merchants, error: listError } = await supabase
      .from('merchants')
      .select('id, business_name, email, wallet_address, created_at')
      .limit(5);

    if (listError) {
      console.error('❌ Failed to list merchants:', listError);
    } else {
      console.log('\n📋 Merchants:');
      if (merchants.length === 0) {
        console.log('  (no merchants yet)');
      } else {
        merchants.forEach(m => {
          console.log(`  - ${m.business_name} (${m.email})`);
          console.log(`    Wallet: ${m.wallet_address}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    process.exit(1);
  }
}

testSupabase();
