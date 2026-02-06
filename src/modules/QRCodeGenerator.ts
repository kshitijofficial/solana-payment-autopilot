import QRCode from 'qrcode';
import { encodeURL } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface PaymentQRCodeOptions {
  recipient: string;
  amount: number;
  label: string;
  message?: string;
  memo?: string;
}

export interface QRCodeResult {
  url: string;
  qrCodeDataURL: string;
  qrCodeFilePath?: string;
}

export class QRCodeGenerator {
  private outputDir: string;

  constructor(outputDir: string = 'qr-codes') {
    this.outputDir = outputDir;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Generate Solana Pay QR code
   */
  async generatePaymentQR(options: PaymentQRCodeOptions): Promise<QRCodeResult> {
    try {
      logger.info('Generating Solana Pay QR code', options);

      // Create Solana Pay URL
      const url = encodeURL({
        recipient: new PublicKey(options.recipient),
        amount: new BigNumber(options.amount),
        label: options.label,
        message: options.message,
        memo: options.memo,
      });

      logger.info(`Payment URL: ${url}`);

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(url.toString(), {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Also save as PNG file
      const timestamp = Date.now();
      const fileName = `payment-${timestamp}.png`;
      const filePath = path.join(this.outputDir, fileName);

      await QRCode.toFile(filePath, url.toString(), {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      logger.info(`QR code saved to: ${filePath}`);

      return {
        url: url.toString(),
        qrCodeDataURL,
        qrCodeFilePath: filePath,
      };
    } catch (error) {
      logger.error('Failed to generate QR code', error);
      throw error;
    }
  }

  /**
   * Generate QR code for a custom URL (terminal display)
   */
  async generateQRTerminal(url: string): Promise<string> {
    try {
      // Generate QR code as ASCII art for terminal
      const qrAscii = await QRCode.toString(url, {
        type: 'terminal',
        small: true,
      });

      return qrAscii;
    } catch (error) {
      logger.error('Failed to generate terminal QR code', error);
      throw error;
    }
  }

  /**
   * Generate QR code as SVG
   */
  async generateQRSVG(options: PaymentQRCodeOptions): Promise<string> {
    try {
      const url = encodeURL({
        recipient: new PublicKey(options.recipient),
        amount: new BigNumber(options.amount),
        label: options.label,
        message: options.message,
        memo: options.memo,
      });

      const svg = await QRCode.toString(url.toString(), {
        type: 'svg',
        width: 400,
        margin: 2,
      });

      // Save SVG to file
      const timestamp = Date.now();
      const fileName = `payment-${timestamp}.svg`;
      const filePath = path.join(this.outputDir, fileName);

      fs.writeFileSync(filePath, svg);
      logger.info(`QR code SVG saved to: ${filePath}`);

      return svg;
    } catch (error) {
      logger.error('Failed to generate SVG QR code', error);
      throw error;
    }
  }

  /**
   * Generate multiple QR codes for different amounts
   */
  async generateBatchQRCodes(
    recipient: string,
    amounts: number[],
    label: string
  ): Promise<QRCodeResult[]> {
    const results: QRCodeResult[] = [];

    for (const amount of amounts) {
      const result = await this.generatePaymentQR({
        recipient,
        amount,
        label: `${label} - $${amount}`,
      });
      results.push(result);
    }

    logger.info(`Generated ${results.length} QR codes`);
    return results;
  }

  /**
   * Get payment details from Solana Pay URL
   */
  parsePaymentURL(url: string): {
    recipient?: string;
    amount?: string;
    label?: string;
    message?: string;
  } {
    try {
      const urlObj = new URL(url);
      
      return {
        recipient: urlObj.pathname.replace('solana:', ''),
        amount: urlObj.searchParams.get('amount') || undefined,
        label: urlObj.searchParams.get('label') || undefined,
        message: urlObj.searchParams.get('message') || undefined,
      };
    } catch (error) {
      logger.error('Failed to parse payment URL', error);
      throw error;
    }
  }
}
