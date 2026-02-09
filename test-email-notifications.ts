import * as dotenv from 'dotenv';
dotenv.config();

import { emailService } from './src/services/EmailService';
import { logger } from './src/utils/logger';

/**
 * Test email notifications
 * 
 * Run: npx tsx test-email-notifications.ts <your-email@example.com>
 */
async function main() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Usage: npx tsx test-email-notifications.ts <your-email@example.com>');
    process.exit(1);
  }
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('🧪 Testing Email Notifications\n');
  console.log(`📧 Recipient: ${testEmail}`);
  console.log(`🔑 API Key: ${process.env.RESEND_API_KEY.slice(0, 10)}...`);
  console.log(`📤 From: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}`);
  console.log('');

  try {
    // Test 1: Payment Notification
    console.log('📨 Test 1: Sending payment received notification...');
    await emailService.sendPaymentNotification(
      testEmail,
      'Test Merchant',
      0.1,
      'SOL',
      'mock_signature_1234567890abcdef',
      15.00
    );
    console.log('✅ Payment notification sent!\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Conversion Notification
    console.log('📨 Test 2: Sending conversion completed notification...');
    await emailService.sendConversionNotification(
      testEmail,
      'Test Merchant',
      0.1,
      'SOL',
      15.00,
      'USDC',
      'mock_swap_signature_abcdef1234567890'
    );
    console.log('✅ Conversion notification sent!\n');

    console.log('🎉 All tests passed!');
    console.log('📬 Check your inbox (and spam folder) for 2 test emails.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify emails arrived');
    console.log('2. Check Resend dashboard: https://resend.com/emails');
    console.log('3. If emails went to spam, that\'s OK for demo/testing');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your API key is valid');
    console.error('2. Check you have free tier credits remaining (3,000/month)');
    console.error('3. View logs in Resend dashboard: https://resend.com/emails');
    process.exit(1);
  }
}

main();
