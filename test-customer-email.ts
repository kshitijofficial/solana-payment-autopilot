import * as dotenv from 'dotenv';
dotenv.config();

import { emailService } from './src/services/EmailService';

async function testCustomerEmail() {
  console.log('\n📧 Testing customer payment confirmation email...\n');
  
  // Test email to customer
  console.log('Sending to customer: srivask6022@gmail.com');
  await emailService.sendCustomerPaymentConfirmation(
    'srivask6022@gmail.com',
    'Kshitij',
    0.006666667,
    'SOL',
    'Demo Course Store',
    '5CMeUck2B6qpsmc...'
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('Sending to merchant: srivastavakshitijprofessional@gmail.com');
  await emailService.sendConversionNotification(
    'srivastavakshitijprofessional@gmail.com',
    'Demo Merchant',
    0.006666667,
    'SOL',
    1.0,
    'USDC',
    'mock_swap_signature_123'
  );
  
  console.log('\n✅ Test complete! Check logs above for any errors.');
}

testCustomerEmail().then(() => process.exit(0));
