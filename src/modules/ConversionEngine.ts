import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'node-fetch';
import { logger } from '../utils/logger';
import { JupiterQuote } from '../types';

export class ConversionEngine {
  private connection: Connection;
  private jupiterApiUrl: string;

  // Common token mints
  private readonly USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
  private readonly SOL_MINT = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
  private readonly USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'; // USDT

  constructor(rpcUrl: string, jupiterApiUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.jupiterApiUrl = jupiterApiUrl;
  }

  /**
   * Get a quote for swapping tokens
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 100
  ): Promise<JupiterQuote> {
    try {
      // Convert amount to smallest unit (lamports for SOL, base units for tokens)
      const amountInSmallestUnit = Math.floor(amount * 1e9);

      const url = `${this.jupiterApiUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInSmallestUnit}&slippageBps=${slippageBps}`;
      
      logger.info(`Getting Jupiter quote: ${inputMint} → ${outputMint}, amount: ${amount}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.statusText}`);
      }

      const quote = await response.json() as JupiterQuote;
      
      logger.info(`Quote received: ${quote.inAmount} → ${quote.outAmount}`);
      logger.info(`Price impact: ${quote.priceImpactPct}%`);
      
      return quote;
    } catch (error) {
      logger.error('Failed to get Jupiter quote', error);
      throw error;
    }
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    quote: JupiterQuote,
    userKeypair: Keypair,
    priorityFee: number = 0.0001
  ): Promise<string> {
    try {
      // Get swap transaction from Jupiter
      const swapResponse = await fetch(`${this.jupiterApiUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: userKeypair.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: Math.floor(priorityFee * 1e9),
        }),
      });

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap API error: ${swapResponse.statusText}`);
      }

      const { swapTransaction }: any = await swapResponse.json();
      
      // Deserialize the transaction
      const transactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuf);
      
      // Sign the transaction
      transaction.sign([userKeypair]);

      logger.info('Sending swap transaction...');
      
      // Send and confirm transaction
      const signature = await this.connection.sendTransaction(transaction, {
        skipPreflight: false,
        maxRetries: 3,
      });

      logger.info(`Swap transaction sent: ${signature}`);
      logger.info(`View on Solscan: https://solscan.io/tx/${signature}`);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      logger.info(`Swap confirmed: ${signature}`);
      
      return signature;
    } catch (error) {
      logger.error('Failed to execute swap', error);
      throw error;
    }
  }

  /**
   * Convert SOL to USDC
   */
  async convertSOLToUSDC(
    amount: number,
    userKeypair: Keypair,
    slippageBps: number = 100
  ): Promise<{ signature: string; amountOut: number }> {
    try {
      logger.info(`Converting ${amount} SOL to USDC`);

      // Get quote
      const quote = await this.getQuote(this.SOL_MINT, this.USDC_MINT, amount, slippageBps);
      
      // Calculate output amount (USDC has 6 decimals)
      const amountOut = parseInt(quote.outAmount) / 1e6;
      
      logger.info(`Expected output: ${amountOut} USDC`);

      // Execute swap
      const signature = await this.executeSwap(quote, userKeypair);

      return { signature, amountOut };
    } catch (error) {
      logger.error('SOL to USDC conversion failed', error);
      throw error;
    }
  }

  /**
   * Convert any token to USDC
   */
  async convertToUSDC(
    inputMint: string,
    amount: number,
    userKeypair: Keypair,
    slippageBps: number = 100
  ): Promise<{ signature: string; amountOut: number }> {
    try {
      logger.info(`Converting ${amount} tokens (${inputMint}) to USDC`);

      // If already USDC, no conversion needed
      if (inputMint === this.USDC_MINT) {
        logger.info('Input is already USDC, no conversion needed');
        return { signature: '', amountOut: amount };
      }

      // Get quote
      const quote = await this.getQuote(inputMint, this.USDC_MINT, amount, slippageBps);
      
      // Calculate output amount (USDC has 6 decimals)
      const amountOut = parseInt(quote.outAmount) / 1e6;
      
      logger.info(`Expected output: ${amountOut} USDC`);

      // Check price impact
      if (quote.priceImpactPct > 5) {
        logger.warn(`High price impact: ${quote.priceImpactPct}%`);
        // Could throw error or ask for confirmation here
      }

      // Execute swap
      const signature = await this.executeSwap(quote, userKeypair);

      return { signature, amountOut };
    } catch (error) {
      logger.error('Token to USDC conversion failed', error);
      throw error;
    }
  }

  /**
   * Retry conversion with increasing slippage
   */
  async convertWithRetry(
    inputMint: string,
    amount: number,
    userKeypair: Keypair,
    maxRetries: number = 3
  ): Promise<{ signature: string; amountOut: number }> {
    const slippageSteps = [100, 300, 500, 1000]; // 1%, 3%, 5%, 10%

    for (let i = 0; i < maxRetries && i < slippageSteps.length; i++) {
      try {
        const slippage = slippageSteps[i];
        logger.info(`Attempting conversion with ${slippage / 100}% slippage (attempt ${i + 1}/${maxRetries})`);
        
        return await this.convertToUSDC(inputMint, amount, userKeypair, slippage);
      } catch (error) {
        logger.warn(`Conversion failed with slippage ${slippageSteps[i] / 100}%`, error);
        
        if (i === maxRetries - 1) {
          throw new Error(`All conversion attempts failed after ${maxRetries} retries`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Conversion failed after all retries');
  }

  /**
   * Get estimated USD value for a token amount
   */
  async getUSDValue(tokenMint: string, amount: number): Promise<number> {
    try {
      // Get quote to USDC to determine USD value
      const quote = await this.getQuote(tokenMint, this.USDC_MINT, amount);
      
      // USDC has 6 decimals, so convert to dollars
      const usdValue = parseInt(quote.outAmount) / 1e6;
      
      return usdValue;
    } catch (error) {
      logger.error('Failed to get USD value', error);
      return 0;
    }
  }
}
