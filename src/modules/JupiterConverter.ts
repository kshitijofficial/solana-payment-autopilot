import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';
import axios from 'axios';
import bs58 from 'bs58';

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  inputAmount: number;
  outputAmount: number;
  error?: string;
}

export class JupiterConverter {
  private connection: Connection;
  private jupiterApiUrl: string;
  
  // Token addresses
  private readonly SOL_MINT = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
  private readonly USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mainnet
  private readonly USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // USDC devnet

  constructor(rpcUrl: string, jupiterApiUrl: string = 'https://quote-api.jup.ag/v6') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.jupiterApiUrl = jupiterApiUrl;
  }

  /**
   * Get quote for SOL → USDC swap
   */
  async getQuote(
    amountSol: number,
    slippageBps: number = 50, // 0.5% slippage
    isDevnet: boolean = true
  ): Promise<SwapQuote | null> {
    try {
      const amountLamports = Math.floor(amountSol * 1e9);
      const usdcMint = isDevnet ? this.USDC_DEVNET_MINT : this.USDC_MINT;

      logger.info(`Getting Jupiter quote: ${amountSol} SOL → USDC`);

      const response = await axios.get(`${this.jupiterApiUrl}/quote`, {
        params: {
          inputMint: this.SOL_MINT,
          outputMint: usdcMint,
          amount: amountLamports,
          slippageBps,
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
        },
      });

      const quote = response.data;
      const outputAmountUsdc = parseInt(quote.outAmount) / 1e6; // USDC has 6 decimals

      logger.info(`Quote received: ${outputAmountUsdc} USDC (${quote.priceImpactPct}% impact)`);

      return quote;
    } catch (error: any) {
      logger.error('Failed to get Jupiter quote', {
        error: error.message,
        response: error.response?.data,
      });
      return null;
    }
  }

  /**
   * Execute SOL → USDC swap
   */
  async executeSwap(
    wallet: Keypair,
    amountSol: number,
    slippageBps: number = 50,
    isDevnet: boolean = true
  ): Promise<SwapResult> {
    try {
      // Get quote
      const quote = await this.getQuote(amountSol, slippageBps, isDevnet);
      if (!quote) {
        return {
          success: false,
          inputAmount: amountSol,
          outputAmount: 0,
          error: 'Failed to get quote from Jupiter',
        };
      }

      // Get swap transaction
      logger.info('Requesting swap transaction from Jupiter...');
      
      const swapResponse = await axios.post(`${this.jupiterApiUrl}/swap`, {
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      });

      const { swapTransaction } = swapResponse.data;

      // Deserialize and sign transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      transaction.sign([wallet]);

      // Send transaction
      logger.info('Sending swap transaction...');
      
      const rawTransaction = transaction.serialize();
      const txid = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 3,
      });

      logger.info(`Swap transaction sent: ${txid}`);

      // Confirm transaction
      const confirmation = await this.connection.confirmTransaction(txid, 'confirmed');

      if (confirmation.value.err) {
        return {
          success: false,
          inputAmount: amountSol,
          outputAmount: 0,
          error: `Transaction failed: ${confirmation.value.err}`,
        };
      }

      const outputAmountUsdc = parseInt(quote.outAmount) / 1e6;

      logger.info(`✅ Swap successful: ${amountSol} SOL → ${outputAmountUsdc} USDC`);

      return {
        success: true,
        signature: txid,
        inputAmount: amountSol,
        outputAmount: outputAmountUsdc,
      };

    } catch (error: any) {
      logger.error('Swap execution failed', {
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        inputAmount: amountSol,
        outputAmount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Simulate swap for devnet (Jupiter doesn't support devnet)
   */
  async simulateSwap(amountSol: number): Promise<SwapResult> {
    logger.info(`🎭 Simulating swap: ${amountSol} SOL → USDC (devnet mock)`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock conversion rate (1 SOL ≈ $150)
    const mockRate = 150;
    const outputAmountUsdc = amountSol * mockRate;

    // Generate mock signature
    const mockSignature = bs58.encode(Buffer.from(Array(64).fill(0).map(() => Math.floor(Math.random() * 256))));

    logger.info(`✅ Simulated swap complete: ${outputAmountUsdc} USDC`);

    return {
      success: true,
      signature: mockSignature,
      inputAmount: amountSol,
      outputAmount: outputAmountUsdc,
    };
  }
}
