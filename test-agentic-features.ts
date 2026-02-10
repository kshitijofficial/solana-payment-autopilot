/**
 * Agentic Features Test Suite
 * Creates realistic scenarios to demonstrate AI agent capabilities
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { db } from './src/database/supabase';
import { agenticConverter } from './src/services/AgenticConverter';
import { merchantChatAgent } from './src/services/MerchantChatAgent';
import { agentInsightsService } from './src/services/AgentInsightsService';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

async function createTestScenarios() {
  console.log('🎬 Creating Test Scenarios for Hackathon Demo\n');

  // Get or create test merchant
  const testMerchant = await getTestMerchant();
  console.log(`✅ Test Merchant: ${testMerchant.business_name} (${testMerchant.id})\n`);

  // Scenario 1: Normal payment - Agent decides immediately
  console.log('📝 Scenario 1: Normal Small Payment');
  await testScenario1(testMerchant.id);

  // Scenario 2: Large payment - Agent detects fraud risk
  console.log('\n📝 Scenario 2: Large Suspicious Payment');
  await testScenario2(testMerchant.id);

  // Scenario 3: Multiple rapid payments - Pattern detection
  console.log('\n📝 Scenario 3: Rapid Payment Spike');
  await testScenario3(testMerchant.id);

  // Scenario 4: Chat with agent
  console.log('\n📝 Scenario 4: Merchant Chat');
  await testScenario4(testMerchant.id);

  // Scenario 5: Agent insights
  console.log('\n📝 Scenario 5: Agent Insights & Recommendations');
  await testScenario5(testMerchant.id);

  console.log('\n✅ All test scenarios created!');
  console.log('\n📊 View results at: http://localhost:5000/index.html');
  console.log('💬 Test chat at: http://localhost:5000/agent-chat.html\n');
}

async function getTestMerchant() {
  // Check if test merchant exists
  const merchants = await db.getAllMerchants();
  let merchant = merchants.find((m: any) => m.business_name === 'Demo Coffee Shop');

  if (!merchant) {
    // Create test merchant
    const wallet = Keypair.generate();
    merchant = await db.createMerchant({
      business_name: 'Demo Coffee Shop',
      email: 'demo@coffeeshop.com',
      wallet_address: wallet.publicKey.toString(),
      notification_email: 'demo@coffeeshop.com',
      auto_convert_enabled: true,
      risk_profile: 'conservative'
    });
  }

  return merchant;
}

// Scenario 1: Normal payment - Agent decides conversion strategy
async function testScenario1(merchantId: string) {
  console.log('  Creating normal payment (0.05 SOL)...');
  
  const tx = await db.createTransaction({
    merchant_id: merchantId,
    signature: `test-sig-${Date.now()}-normal`,
    from_address: Keypair.generate().publicKey.toString(),
    to_address: 'merchant-wallet',
    amount: 0.05,
    token: 'SOL',
    status: 'confirmed',
    confirmations: 32,
    block_time: new Date()
  });

  // Simulate agent decision
  const context = {
    transactionId: tx?.id || 'test-1',
    merchantId,
    merchantName: 'Demo Coffee Shop',
    amountSOL: 0.05,
    currentPrice: 152.50,
    merchantRiskProfile: 'conservative' as const,
    timeSincePayment: 0,
    recentVolatility: 'low' as const,
    transactionSize: 'small' as const
  };

  const decision = await agenticConverter.decideConversion(context);
  
  console.log(`  ✅ Agent Decision: ${decision.decision}`);
  console.log(`  💭 Reasoning: ${decision.reasoning}`);
  console.log(`  📊 Confidence: ${Math.round(decision.confidence * 100)}%`);
}

// Scenario 2: Large payment triggering fraud alert
async function testScenario2(merchantId: string) {
  console.log('  Creating large payment (5.0 SOL - 100x normal)...');
  
  await db.createTransaction({
    merchant_id: merchantId,
    signature: `test-sig-${Date.now()}-large`,
    from_address: Keypair.generate().publicKey.toString(),
    to_address: 'merchant-wallet',
    amount: 5.0,
    token: 'SOL',
    status: 'confirmed',
    confirmations: 32,
    block_time: new Date()
  });

  console.log('  ⚠️  Large payment will trigger fraud detection alert');
  console.log('  📊 Check dashboard for "Unusual Payment Detected" alert');
}

// Scenario 3: Multiple rapid payments
async function testScenario3(merchantId: string) {
  console.log('  Creating 6 payments in quick succession...');
  
  for (let i = 0; i < 6; i++) {
    await db.createTransaction({
      merchant_id: merchantId,
      signature: `test-sig-${Date.now()}-rapid-${i}`,
      from_address: Keypair.generate().publicKey.toString(),
      to_address: 'merchant-wallet',
      amount: 0.03 + (i * 0.01),
      token: 'SOL',
      status: 'confirmed',
      confirmations: 32,
      block_time: new Date()
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('  ✅ Created 6 rapid payments');
  console.log('  📊 Check dashboard for "High Activity Detected" alert');
}

// Scenario 4: Chat with agent
async function testScenario4(merchantId: string) {
  const questions = [
    "Why did you convert my last payment immediately?",
    "How much have I made this week?",
    "Should I change my risk profile?"
  ];

  console.log('  Testing chat responses...\n');
  
  for (const question of questions) {
    console.log(`  Q: ${question}`);
    const answer = await merchantChatAgent.chat(merchantId, question);
    console.log(`  A: ${answer.substring(0, 120)}...\n`);
  }
}

// Scenario 5: Generate insights
async function testScenario5(merchantId: string) {
  console.log('  Generating agent insights...\n');
  
  const insights = await agentInsightsService.generateInsights(merchantId);
  
  insights.forEach(insight => {
    const icon = insight.priority === 'high' ? '🚨' : insight.priority === 'medium' ? '⚠️' : 'ℹ️';
    console.log(`  ${icon} ${insight.title}`);
    console.log(`     ${insight.message}`);
    console.log('');
  });

  console.log(`  ✅ Generated ${insights.length} insights`);
}

// Run all scenarios
createTestScenarios().catch(console.error);
