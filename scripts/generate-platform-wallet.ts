import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

console.log('\n🏦 Generating Platform Wallet for Merchant Signups\n');
console.log('This wallet will receive 0.1 SOL signup fees from merchants.\n');
console.log('━'.repeat(60));

const wallet = Keypair.generate();
const publicKey = wallet.publicKey.toString();
const privateKey = bs58.encode(wallet.secretKey);

console.log('\n✅ Platform Wallet Generated:\n');
console.log(`Public Address (share this):`);
console.log(`  ${publicKey}\n`);
console.log(`Private Key (keep secret!):`);
console.log(`  ${privateKey}\n`);
console.log('━'.repeat(60));

console.log('\n📝 Update .env file:\n');
console.log(`PLATFORM_WALLET_ADDRESS=${publicKey}`);
console.log(`PLATFORM_WALLET_PRIVATE_KEY=${privateKey}`);
console.log(`MERCHANT_SIGNUP_FEE=0.1\n`);

console.log('⚠️  IMPORTANT:');
console.log('   1. Add devnet SOL to this wallet via https://faucet.solana.com');
console.log('   2. Keep the private key secure');
console.log('   3. This wallet collects all merchant signup fees\n');

console.log('🔗 View on Solscan (Devnet):');
console.log(`   https://solscan.io/account/${publicKey}?cluster=devnet\n`);
