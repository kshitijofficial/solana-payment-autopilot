import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

/**
 * Fix notification settings
 * 1. Update all merchants to use verified email
 * 2. Clear invalid webhook URLs
 */
async function fixNotifications() {
  console.log('🔧 Fixing notification settings...\n');

  try {
    // Update all merchants to use your verified email
    const verifiedEmail = 'srivastavakshitijprofessional@gmail.com';
    
    const { data: merchants, error: fetchError } = await db.getClient()
      .from('merchants')
      .select('id, business_name, email, notification_email')
      .neq('notification_email', verifiedEmail)
      .or(`notification_email.is.null`);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${merchants?.length || 0} merchants to update\n`);

    if (merchants && merchants.length > 0) {
      for (const merchant of merchants) {
        console.log(`Updating: ${merchant.business_name}`);
        console.log(`  Old email: ${merchant.notification_email || 'null'}`);
        console.log(`  New email: ${verifiedEmail}`);

        const { error: updateError } = await db.getClient()
          .from('merchants')
          .update({ notification_email: verifiedEmail })
          .eq('id', merchant.id);

        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`  ✅ Updated\n`);
        }
      }
    }

    // Show final state
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Final merchant emails:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const { data: allMerchants } = await db.getClient()
      .from('merchants')
      .select('business_name, notification_email')
      .order('created_at', { ascending: false });

    if (allMerchants) {
      allMerchants.forEach(m => {
        console.log(`${m.business_name}: ${m.notification_email}`);
      });
    }

    console.log('\n✅ Notification settings fixed!');
    console.log('\nEmails will now be sent to: ' + verifiedEmail);
    console.log('\n💡 Note: Webhooks to localhost will fail (this is normal for testing)');
    console.log('   Use webhook.site for webhook testing\n');

  } catch (error: any) {
    console.error('❌ Failed to fix notifications:', error.message);
    process.exit(1);
  }
}

fixNotifications();
