import * as dotenv from 'dotenv';
dotenv.config();

import { emailService } from './src/services/EmailService';

async function testEmail() {
  console.log('Testing Email Service\n');

  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured');
    console.log('Emails will not be sent, but the code is ready\n');
    return;
  }

  console.log('[Test 1] Send Payment Notification');
  
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  await emailService.sendPaymentNotification(
    testEmail,
    'Test Merchant',
    0.05,
    'SOL',
    'test-signature-abc123xyz',
    7.50
  );

  console.log(`Payment email sent to ${testEmail}\n`);

  console.log('[Test 2] Send Conversion Notification');
  
  await emailService.sendConversionNotification(
    testEmail,
    'Test Merchant',
    0.05,
    'SOL',
    7.50,
    'USDC',
    'test-swap-signature-xyz789'
  );

  console.log(`Conversion email sent to ${testEmail}\n`);

  console.log('Email service ready!\n');
}

testEmail().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
