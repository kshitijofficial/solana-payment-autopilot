import dotenv from 'dotenv';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

dotenv.config();

const MERCHANT_ADDRESS = 'Ayjn4E9LHrPBozm8EoZCKz8pARC2q1XKcYNG2wkBhUYU';

async function sendTestPayments() {
  console.log('🚀 Starting AI agent test payment sequence...\n');
  
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );

  // Generate a test wallet (or use existing keypair)
  const payer = Keypair.generate();
  const merchantPubkey = new PublicKey(MERCHANT_ADDRESS);

  console.log(`📍 Merchant Address: ${MERCHANT_ADDRESS}`);
  console.log(`💰 Payer Address: ${payer.publicKey.toBase58()}\n`);

  // Request airdrop for test wallet
  console.log('💸 Requesting airdrop (2 SOL)...');
  try {
    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);
    console.log('✅ Airdrop confirmed!\n');
  } catch (error) {
    console.error('❌ Airdrop failed:', error);
    console.log('⚠️  Manual airdrop needed from https://faucet.solana.com\n');
    return;
  }

  // Payment sequence to trigger different AI features
  const payments = [
    { amount: 0.05, delay: 0, description: 'Normal payment #1 (baseline)' },
    { amount: 0.08, delay: 5000, description: 'Normal payment #2 (baseline)' },
    { amount: 0.06, delay: 5000, description: 'Normal payment #3 (baseline)' },
    
    // TRIGGER: Large payment detection (5x above average)
    { amount: 0.35, delay: 10000, description: '🚨 LARGE PAYMENT (5x above 0.06 avg) - triggers alert!' },
    
    // TRIGGER: Activity surge (multiple rapid payments)
    { amount: 0.1, delay: 15000, description: '📊 Rapid payment #1 (surge detection)' },
    { amount: 0.12, delay: 3000, description: '📊 Rapid payment #2' },
    { amount: 0.09, delay: 3000, description: '📊 Rapid payment #3' },
    { amount: 0.11, delay: 3000, description: '📊 Rapid payment #4' },
    { amount: 0.08, delay: 3000, description: '📊 Rapid payment #5 - triggers activity spike alert!' },
    
    // More for revenue forecasting
    { amount: 0.07, delay: 10000, description: '📈 Additional payment (revenue forecast data)' },
  ];

  let totalSent = 0;

  for (let i = 0; i < payments.length; i++) {
    const { amount, delay, description } = payments[i];

    // Wait before sending
    if (delay > 0) {
      console.log(`⏰ Waiting ${delay / 1000}s before next payment...\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log(`💳 Payment ${i + 1}/${payments.length}: ${description}`);
    console.log(`   Amount: ${amount} SOL`);

    try {
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: merchantPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      // Send and confirm
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
      );

      console.log(`   ✅ Confirmed: https://solscan.io/tx/${signature}?cluster=devnet`);
      totalSent += amount;
      console.log(`   📊 Total sent: ${totalSent.toFixed(3)} SOL\n`);

    } catch (error: any) {
      console.error(`   ❌ Failed:`, error.message, '\n');
    }
  }

  console.log('\n🎉 Test payment sequence complete!\n');
  console.log('📋 Expected AI Insights:');
  console.log('   🚨 Large Payment Alert: Payment #4 (0.35 SOL, 5x above average)');
  console.log('   📊 Activity Surge Alert: Payments #5-9 (5 payments in ~15 seconds)');
  console.log('   📈 Revenue Forecast: Based on 10 payment pattern');
  console.log('   👤 Customer Pattern: Repeat customer (same sender)');
  console.log('\n💡 Check merchant dashboard to see AI agent insights!');
  console.log(`   Dashboard: http://localhost:5000 (merchant ID required)`);
  console.log(`   Admin Panel: http://localhost:3001\n`);
}

sendTestPayments().catch(console.error);
