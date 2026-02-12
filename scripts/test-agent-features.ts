// Test script for AI agent features
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

const TARGET_MERCHANT = '2TDKAKC6aStvhiSQU4znZRq2SVkutU3RX8hovrZYwZrx';
const RPC_URL = 'https://api.devnet.solana.com';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendTransaction(connection: Connection, from: Keypair, to: PublicKey, amountSOL: number, label: string) {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: amountSOL * LAMPORTS_PER_SOL
      })
    );

    const signature = await connection.sendTransaction(transaction, [from]);
    console.log(`✅ ${label}: ${amountSOL} SOL`);
    console.log(`   Signature: ${signature}`);
    console.log(`   View: https://solscan.io/tx/${signature}?cluster=devnet\n`);
    
    return signature;
  } catch (error: any) {
    console.error(`❌ ${label} failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing AI Agent Features\n');
  console.log(`Target merchant: ${TARGET_MERCHANT}\n`);

  const connection = new Connection(RPC_URL, 'confirmed');
  const targetPubkey = new PublicKey(TARGET_MERCHANT);

  // Use platform wallet from .env
  const platformKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!platformKey) {
    console.error('❌ PLATFORM_WALLET_PRIVATE_KEY not found in .env');
    return;
  }

  const testWallet = Keypair.fromSecretKey(bs58.decode(platformKey));
  console.log(`🔑 Test wallet: ${testWallet.publicKey.toBase58()}\n`);

  await sleep(1000);

  // Check balance
  const balance = await connection.getBalance(testWallet.publicKey);
  console.log(`💰 Test wallet balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    console.log('❌ Insufficient balance for tests');
    return;
  }

  console.log('🚀 Starting test scenarios...\n');

  // TEST 1: Normal small payment (baseline)
  console.log('📝 TEST 1: Normal small payment (0.005 SOL)');
  console.log('Expected: Agent should convert normally\n');
  await sendTransaction(connection, testWallet, targetPubkey, 0.005, 'Test 1 - Normal');
  await sleep(5000);

  // TEST 2: Large payment (fraud alert trigger)
  console.log('📝 TEST 2: Large payment (0.1 SOL)');
  console.log('Expected: Agent should flag as unusually large, may increase confidence for immediate conversion\n');
  await sendTransaction(connection, testWallet, targetPubkey, 0.1, 'Test 2 - Large Payment');
  await sleep(5000);

  // TEST 3: Multiple rapid payments
  console.log('📝 TEST 3: Multiple rapid payments (5 x 0.01 SOL within 30 seconds)');
  console.log('Expected: Agent should detect rapid transaction pattern\n');
  for (let i = 1; i <= 5; i++) {
    await sendTransaction(connection, testWallet, targetPubkey, 0.01, `Test 3.${i} - Rapid Payment`);
    await sleep(6000); // 6 seconds between each
  }

  // TEST 4: Suspicious pattern - round number
  console.log('📝 TEST 4: Suspicious round number (0.05 SOL exactly)');
  console.log('Expected: Agent may flag round number as potentially suspicious\n');
  await sendTransaction(connection, testWallet, targetPubkey, 0.05, 'Test 4 - Round Number');
  await sleep(5000);

  // TEST 5: Very small payment (dust)
  console.log('📝 TEST 5: Very small payment (0.001 SOL)');
  console.log('Expected: Agent should handle micro-payment efficiently\n');
  await sendTransaction(connection, testWallet, targetPubkey, 0.001, 'Test 5 - Micro Payment');

  console.log('\n✅ All test scenarios completed!');
  console.log('\n📊 Check your merchant dashboard to see agent decisions:');
  console.log('   http://localhost:5000/');
  console.log('\n🔍 Monitor agent logs for decision reasoning');
}

main().catch(console.error);
