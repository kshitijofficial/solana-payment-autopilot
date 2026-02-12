import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { logger } from './src/utils/logger';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Test the Payment Request System
 * 
 * This script:
 * 1. Gets/creates a merchant
 * 2. Creates a payment request
 * 3. Shows payment details (QR code, amount, URL)
 * 4. Provides instructions for manual testing
 */
async function main() {
  console.log('🧪 Testing Payment Request System\n');
  console.log('Prerequisites:');
  console.log('1. API server running: npm run api');
  console.log('2. Database migration applied (payment_requests table exists)');
  console.log('3. At least one merchant created\n');

  try {
    // Step 1: Get existing merchant or create one
    console.log('📋 Step 1: Getting merchant...');
    let merchantRes = await axios.get(`${API_BASE}/api/merchants`);
    let merchant = merchantRes.data.data[0];

    if (!merchant) {
      console.log('No merchants found. Creating test merchant...');
      const createRes = await axios.post(`${API_BASE}/api/merchants`, {
        business_name: 'Test Store',
        email: 'test@example.com',
        notification_email: 'test@example.com',
      });
      merchant = createRes.data.data;
    }

    console.log(`✅ Using merchant: ${merchant.business_name} (${merchant.wallet_address})\n`);

    // Step 2: Create payment request
    console.log('📋 Step 2: Creating payment request...');
    const paymentReq = await axios.post(`${API_BASE}/api/payment-requests`, {
      merchant_id: merchant.id,
      amount_usd: 0.01, // Small amount for testing
      order_id: 'TEST-' + Date.now(),
      customer_email: 'customer@example.com',
      customer_name: 'Test Customer',
      description: 'Test Payment - Hackathon Demo',
      callback_url: 'https://webhook.site/unique-url-here', // Replace with your webhook.site URL
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      },
      expires_in_minutes: 30 // 30 minutes for testing
    });

    const payment = paymentReq.data.data;
    console.log('✅ Payment request created!\n');

    // Step 3: Display payment details
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 PAYMENT DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Payment ID:      ${payment.payment_id}`);
    console.log(`Amount USD:      $${payment.amount_usd}`);
    console.log(`Amount SOL:      ${payment.amount_sol} SOL`);
    console.log(`Payment URL:     ${payment.payment_url}`);
    console.log(`Merchant Wallet: ${payment.wallet_address}`);
    console.log(`Expires At:      ${new Date(payment.expires_at).toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📱 QR Code Data:');
    console.log(payment.qr_code.slice(0, 80) + '...\n');

    // Step 4: Testing instructions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 MANUAL TESTING STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Option A: Test with Solana CLI');
    console.log('────────────────────────────────────────');
    console.log(`solana transfer ${payment.wallet_address} ${payment.amount_sol} --url devnet --allow-unfunded-recipient`);
    console.log('');
    console.log('Option B: Test with Phantom Wallet');
    console.log('────────────────────────────────────────');
    console.log('1. Switch to Devnet in Phantom');
    console.log('2. Send exactly', payment.amount_sol, 'SOL to:', payment.wallet_address);
    console.log('3. Wait 15-30 seconds for detection');
    console.log('');
    console.log('Option C: Get devnet SOL first (if you need airdrop)');
    console.log('────────────────────────────────────────');
    console.log(`solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 CHECK STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`curl ${API_BASE}/api/payment-requests/${payment.payment_id}`);
    console.log('');
    console.log('Or in browser:');
    console.log(`${API_BASE}/api/payment-requests/${payment.payment_id}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 EXPECTED FLOW');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. You send SOL → Transaction on blockchain');
    console.log('2. PaymentMonitorV2 detects it (15-30 seconds)');
    console.log('3. System matches payment to request');
    console.log('4. Status changes: "pending" → "paid"');
    console.log('5. Webhook sent to callback_url');
    console.log('6. Email notification sent to merchant');
    console.log('7. Auto-conversion triggered (SOL → USDC)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    console.log('💡 TIP: Watch the API server logs to see real-time detection!');
    console.log('');
    console.log(`Payment ID for reference: ${payment.payment_id}`);
    console.log('');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('API Error:', error.response.data);
      console.error('Status:', error.response.status);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure API server is running: npm run api');
    console.log('2. Check database migration was applied');
    console.log('3. Verify Supabase credentials in .env');
    console.log('4. Check API server logs for errors');
    
    process.exit(1);
  }
}

main();
