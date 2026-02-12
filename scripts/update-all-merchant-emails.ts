import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './src/database/supabase';

async function updateAll() {
  const verifiedEmail = 'srivastavakshitijprofessional@gmail.com';
  
  console.log('Updating ALL merchants to use:', verifiedEmail, '\n');
  
  const { data, error } = await db.getClient()
    .from('merchants')
    .update({ notification_email: verifiedEmail })
    .neq('notification_email', verifiedEmail);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Updated all merchants!');
  }
  
  // Show results
  const { data: all } = await db.getClient()
    .from('merchants')
    .select('business_name, notification_email');
  
  console.log('\nAll merchants now have:');
  all?.forEach(m => console.log(`  ${m.business_name}: ${m.notification_email}`));
}

updateAll();
