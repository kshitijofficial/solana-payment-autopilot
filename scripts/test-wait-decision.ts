// Test script to trigger "wait" decisions
import { db } from './src/database/supabase';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

const TARGET_MERCHANT = '2TDKAKC6aStvhiSQU4znZRq2SVkutU3RX8hovrZYwZrx';
const MERCHANT_ID = '4b687378-dbd3-4e97-838f-f8b8a364ebf5';
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
    console.log(`   https://solscan.io/tx/${signature}?cluster=devnet\n`);
    
    return signature;
  } catch (error: any) {
    console.error(`❌ ${label} failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing "wait" decision (Optimized strategy)\n');

  // Step 1: Change merchant risk profile to "aggressive"
  console.log('📝 Step 1: Updating merchant risk profile to "aggressive"...');
  
  const { error: updateError } = await db.getClient()
    .from('merchants')
    .update({ risk_profile: 'aggressive' })
    .eq('id', MERCHANT_ID);

  if (updateError) {
    console.error('❌ Failed to update risk profile:', updateError);
    return;
  }
  
  console.log('✅ Risk profile updated to "aggressive"\n');
  await sleep(2000);

  // Step 2: Send test transaction
  console.log('📝 Step 2: Sending test payment (0.02 SOL)...');
  console.log('Expected: Agent may decide to "wait" for better conversion rate\n');

  const connection = new Connection(RPC_URL, 'confirmed');
  const targetPubkey = new PublicKey(TARGET_MERCHANT);

  const platformKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!platformKey) {
    console.error('❌ PLATFORM_WALLET_PRIVATE_KEY not found');
    return;
  }

  const testWallet = Keypair.fromSecretKey(bs58.decode(platformKey));
  
  await sendTransaction(connection, testWallet, targetPubkey, 0.02, 'Test - Wait Decision');

  console.log('\n⏰ Waiting 20 seconds for agent to process...\n');
  await sleep(20000);

  // Step 3: Check agent decision
  console.log('📊 Step 3: Checking agent decision...\n');
  
  const decisionsRes = await fetch(`http://localhost:3000/api/agent/decisions/${MERCHANT_ID}?limit=1`);
  const decisionsData = await decisionsRes.json();
  
  if (decisionsData.success && decisionsData.data.length > 0) {
    const latestDecision = decisionsData.data[0];
    console.log('🧠 Latest Agent Decision:');
    console.log(`   Decision: ${latestDecision.decision}`);
    console.log(`   Confidence: ${Math.round(latestDecision.confidence * 100)}%`);
    console.log(`   Reasoning: ${latestDecision.reasoning}`);
    
    if (latestDecision.wait_duration) {
      console.log(`   Wait Duration: ${latestDecision.wait_duration} minutes`);
    }
    if (latestDecision.target_price) {
      console.log(`   Target Price: $${latestDecision.target_price}`);
    }
  } else {
    console.log('⚠️  No decision found yet (agent may still be processing)');
  }

  // Step 4: Restore risk profile
  console.log('\n📝 Step 4: Restoring merchant risk profile to "conservative"...');
  
  const { error: restoreError } = await db.getClient()
    .from('merchants')
    .update({ risk_profile: 'conservative' })
    .eq('id', MERCHANT_ID);

  if (restoreError) {
    console.error('❌ Failed to restore risk profile:', restoreError);
  } else {
    console.log('✅ Risk profile restored to "conservative"\n');
  }

  console.log('🎯 Test complete! Check dashboard for "Optimized" count.');
  console.log('   http://localhost:5000/\n');
}

main().catch(console.error);
