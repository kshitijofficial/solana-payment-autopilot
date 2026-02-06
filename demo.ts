#!/usr/bin/env tsx
/**
 * Solana Payment Autopilot - MVP Demo
 * Run: npx tsx demo.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { encodeURL, createQR } from '@solana/pay';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const MERCHANT_FILE = 'merchant-wallet.json';

interface MerchantWallet {
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function createMerchantWallet(): Promise<MerchantWallet> {
  log('\n🔑 Creating merchant wallet...', colors.bright);
  
  const keypair = Keypair.generate();
  const wallet: MerchantWallet = {
    publicKey: keypair.publicKey.toString(),
    privateKey: bs58.encode(keypair.secretKey),
    createdAt: new Date().toISOString(),
  };

  // Save to file
  fs.writeFileSync(MERCHANT_FILE, JSON.stringify(wallet, null, 2));
  
  log(`✓ Wallet created: ${wallet.publicKey}`, colors.green);
  log(`✓ Saved to ${MERCHANT_FILE}`, colors.green);
  
  return wallet;
}

function loadMerchantWallet(): MerchantWallet | null {
  if (!fs.existsSync(MERCHANT_FILE)) {
    return null;
  }
  
  return JSON.parse(fs.readFileSync(MERCHANT_FILE, 'utf-8'));
}

async function requestAirdrop(connection: Connection, publicKey: PublicKey) {
  log('\n💧 Requesting devnet airdrop...', colors.bright);
  
  try {
    const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    
    log('✓ Received 2 SOL on devnet', colors.green);
  } catch (error: any) {
    log(`✗ Airdrop failed: ${error.message}`, colors.yellow);
    log('  You can also use: https://faucet.solana.com', colors.yellow);
  }
}

async function getBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

function generatePaymentQR(merchantAddress: string, amount: number, label: string) {
  log('\n📱 Generating Solana Pay QR Code...', colors.bright);
  
  const url = encodeURL({
    recipient: new PublicKey(merchantAddress),
    amount: amount,
    label: label,
    message: 'Payment via Solana Payment Autopilot',
  });

  log(`✓ Payment URL: ${url}`, colors.cyan);
  log(`✓ Amount: ${amount} SOL`, colors.cyan);
  log(`✓ Label: ${label}`, colors.cyan);
  
  // QR code can be generated for display
  log('\n📋 To pay, use this URL in a Solana wallet:', colors.bright);
  log(`   ${url}`, colors.blue);
  
  return url;
}

async function monitorPayments(connection: Connection, merchantAddress: PublicKey) {
  log('\n👀 Monitoring for payments...', colors.bright);
  log('   Send SOL to this address from any devnet wallet', colors.yellow);
  log(`   Address: ${merchantAddress.toString()}`, colors.cyan);
  log('   Press Ctrl+C to stop\n', colors.yellow);

  let lastSignature: string | null = null;

  // Poll for new transactions
  setInterval(async () => {
    try {
      const signatures = await connection.getSignaturesForAddress(merchantAddress, { limit: 1 });
      
      if (signatures.length > 0) {
        const signature = signatures[0].signature;
        
        // Check if this is a new transaction
        if (signature !== lastSignature) {
          lastSignature = signature;
          
          // Fetch transaction details
          const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (tx && tx.meta && !tx.meta.err) {
            // Check for SOL transfer
            const preBalance = tx.meta.preBalances[1] || 0;
            const postBalance = tx.meta.postBalances[1] || 0;
            const amount = (postBalance - preBalance) / LAMPORTS_PER_SOL;

            if (amount > 0) {
              log(`\n🎉 PAYMENT RECEIVED!`, colors.green);
              log(`   Amount: ${amount} SOL`, colors.green);
              log(`   Signature: ${signature}`, colors.cyan);
              log(`   View: https://solscan.io/tx/${signature}?cluster=devnet`, colors.blue);
              
              // In real version, this would trigger auto-conversion to USDC
              log(`\n💱 Auto-conversion would happen here (Jupiter SOL → USDC)`, colors.yellow);
              
              const balance = await getBalance(connection, merchantAddress);
              log(`   New balance: ${balance.toFixed(4)} SOL\n`, colors.cyan);
            }
          }
        }
      }
    } catch (error: any) {
      // Silent fail for polling errors
    }
  }, 5000); // Check every 5 seconds
}

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════╗', colors.bright);
  log('║   Solana Payment Autopilot - MVP Demo (Devnet)    ║', colors.bright);
  log('╚════════════════════════════════════════════════════╝', colors.bright);

  const connection = new Connection(DEVNET_RPC, 'confirmed');

  // Load or create merchant wallet
  let wallet = loadMerchantWallet();
  
  if (!wallet) {
    wallet = await createMerchantWallet();
    
    // Request airdrop for testing
    const pubKey = new PublicKey(wallet.publicKey);
    await requestAirdrop(connection, pubKey);
  } else {
    log(`\n✓ Loaded existing wallet: ${wallet.publicKey}`, colors.green);
  }

  const merchantPubKey = new PublicKey(wallet.publicKey);
  const balance = await getBalance(connection, merchantPubKey);
  
  log(`\n💰 Current balance: ${balance.toFixed(4)} SOL`, colors.cyan);

  // Generate payment QR
  const paymentAmount = 0.1; // 0.1 SOL
  const paymentLabel = 'Coffee Shop - Latte';
  generatePaymentQR(wallet.publicKey, paymentAmount, paymentLabel);

  // Start monitoring
  await monitorPayments(connection, merchantPubKey);
}

// Run
main().catch(console.error);
