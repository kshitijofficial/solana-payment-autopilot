import dotenv from 'dotenv';
import { db } from '../src/database/supabase';

// Load environment variables
dotenv.config();

async function deleteMerchant(email: string) {
  try {
    console.log(`🔍 Looking for merchant with email: ${email}`);

    // Find merchant by email
    const { data: merchant, error: findError } = await db.getClient()
      .from('merchants')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !merchant) {
      console.error('❌ Merchant not found');
      return;
    }

    console.log(`\n✅ Found merchant:`);
    console.log(`   ID: ${merchant.id}`);
    console.log(`   Business: ${merchant.business_name}`);
    console.log(`   Email: ${merchant.email}`);
    console.log(`   Wallet: ${merchant.wallet_address}`);

    // Delete related data first (foreign key constraints)
    console.log('\n🗑️  Deleting related data...');

    // Delete agent decisions
    const { error: decisionsError } = await db.getClient()
      .from('agent_decisions')
      .delete()
      .eq('merchant_id', merchant.id);
    if (decisionsError) console.error('   ⚠️  Failed to delete agent decisions:', decisionsError.message);
    else console.log('   ✅ Deleted agent decisions');

    // Delete payment requests
    const { error: paymentRequestsError } = await db.getClient()
      .from('payment_requests')
      .delete()
      .eq('merchant_id', merchant.id);
    if (paymentRequestsError) console.error('   ⚠️  Failed to delete payment requests:', paymentRequestsError.message);
    else console.log('   ✅ Deleted payment requests');

    // Get transactions to delete conversions
    const { data: transactions } = await db.getClient()
      .from('transactions')
      .select('id')
      .eq('merchant_id', merchant.id);

    if (transactions && transactions.length > 0) {
      const txIds = transactions.map(tx => tx.id);
      
      // Delete conversions
      const { error: conversionsError } = await db.getClient()
        .from('conversions')
        .delete()
        .in('transaction_id', txIds);
      if (conversionsError) console.error('   ⚠️  Failed to delete conversions:', conversionsError.message);
      else console.log('   ✅ Deleted conversions');
    }

    // Delete transactions
    const { error: transactionsError } = await db.getClient()
      .from('transactions')
      .delete()
      .eq('merchant_id', merchant.id);
    if (transactionsError) console.error('   ⚠️  Failed to delete transactions:', transactionsError.message);
    else console.log('   ✅ Deleted transactions');

    // Finally, delete the merchant
    const { error: deleteError } = await db.getClient()
      .from('merchants')
      .delete()
      .eq('id', merchant.id);

    if (deleteError) {
      console.error('\n❌ Failed to delete merchant:', deleteError.message);
      return;
    }

    console.log('\n✅ Merchant deleted successfully!');
    console.log(`   All data for ${email} has been removed.`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx scripts/delete-merchant.ts <email>');
  console.error('Example: tsx scripts/delete-merchant.ts merchant@example.com');
  process.exit(1);
}

deleteMerchant(email);
