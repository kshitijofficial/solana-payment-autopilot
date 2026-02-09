import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function checkActivity() {
  console.log('\n🔍 Recent Transactions:\n');
  const txs = await db.getClient().from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (txs.data && txs.data.length > 0) {
    for (const tx of txs.data) {
      console.log(`  💰 ${tx.amount} ${tx.token} - Status: ${tx.status}`);
      console.log(`     Signature: ${tx.signature.slice(0, 16)}...`);
      console.log(`     Created: ${tx.created_at}`);
      console.log(`     Merchant ID: ${tx.merchant_id}\n`);
    }
  } else {
    console.log('  No transactions found.\n');
  }

  console.log('\n🔄 Recent Conversions:\n');
  const conversions = await db.getClient().from('conversions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (conversions.data && conversions.data.length > 0) {
    for (const conv of conversions.data) {
      console.log(`  🔄 ${conv.from_amount} ${conv.from_token} → ${conv.to_amount} ${conv.to_token}`);
      console.log(`     Status: ${conv.status}`);
      console.log(`     Created: ${conv.created_at}`);
      if (conv.error_message) {
        console.log(`     Error: ${conv.error_message}`);
      }
      console.log();
    }
  } else {
    console.log('  No conversions found.\n');
  }

  console.log('\n📧 Recent Notifications:\n');
  const notifications = await db.getClient().from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (notifications.data && notifications.data.length > 0) {
    for (const notif of notifications.data) {
      console.log(`  📧 ${notif.notification_type} to ${notif.recipient}`);
      console.log(`     Subject: ${notif.subject}`);
      console.log(`     Status: ${notif.status}`);
      console.log(`     Sent: ${notif.sent_at}`);
      console.log();
    }
  } else {
    console.log('  No notifications found.\n');
  }

  console.log('\n🎯 Recent Payment Requests:\n');
  const requests = await db.getClient().from('payment_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (requests.data && requests.data.length > 0) {
    for (const req of requests.data) {
      console.log(`  🎯 ${req.payment_id} - Status: ${req.status}`);
      console.log(`     Amount: ${req.amount} ${req.token}`);
      console.log(`     Customer: ${req.customer_email || 'No email'}`);
      console.log(`     Paid at: ${req.paid_at || 'Not paid'}`);
      console.log();
    }
  } else {
    console.log('  No payment requests found.\n');
  }
}

checkActivity().then(() => process.exit(0));
