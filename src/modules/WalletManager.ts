import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import * as crypto from 'crypto';
import { Merchant } from '../types';
import { logger } from '../utils/logger';

export class WalletManager {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Generate a new Solana wallet for a merchant
   */
  async createMerchantWallet(): Promise<{ publicKey: string; privateKey: string; }> {
    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();
      const privateKey = bs58.encode(keypair.secretKey);

      logger.info(`Generated new wallet: ${publicKey}`);
      
      return {
        publicKey,
        privateKey,
      };
    } catch (error) {
      logger.error('Failed to create merchant wallet', error);
      throw new Error('Wallet generation failed');
    }
  }

  /**
   * Encrypt private key with merchant password
   */
  encryptPrivateKey(privateKey: string, password: string): string {
    const algorithm = 'aes-256-gcm';
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: salt:iv:authTag:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt private key
   */
  decryptPrivateKey(encryptedData: string, password: string): string {
    try {
      const [saltHex, ivHex, authTagHex, encrypted] = encryptedData.split(':');
      
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt private key', error);
      throw new Error('Decryption failed - invalid password or corrupted data');
    }
  }

  /**
   * Get wallet balance in SOL
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      logger.error(`Failed to get balance for ${publicKey}`, error);
      throw error;
    }
  }

  /**
   * Verify wallet address is valid
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Derive a PDA for merchant payment tracking
   */
  async deriveMerchantPDA(merchantId: string, programId: PublicKey): Promise<string> {
    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('merchant'),
          Buffer.from(merchantId),
        ],
        programId
      );
      
      logger.info(`Derived PDA for merchant ${merchantId}: ${pda.toString()}`);
      return pda.toString();
    } catch (error) {
      logger.error(`Failed to derive PDA for merchant ${merchantId}`, error);
      throw error;
    }
  }

  /**
   * Create a Keypair from private key string
   */
  getKeypairFromPrivateKey(privateKey: string): Keypair {
    try {
      const decoded = bs58.decode(privateKey);
      return Keypair.fromSecretKey(decoded);
    } catch (error) {
      logger.error('Failed to create keypair from private key', error);
      throw new Error('Invalid private key format');
    }
  }

  /**
   * Request airdrop for testing (devnet only)
   */
  async requestAirdrop(publicKey: string, amount: number = 1): Promise<string> {
    try {
      const pubKey = new PublicKey(publicKey);
      const signature = await this.connection.requestAirdrop(
        pubKey,
        amount * 1e9 // Convert SOL to lamports
      );
      
      await this.connection.confirmTransaction(signature);
      logger.info(`Airdropped ${amount} SOL to ${publicKey}`);
      
      return signature;
    } catch (error) {
      logger.error(`Airdrop failed for ${publicKey}`, error);
      throw error;
    }
  }
}
