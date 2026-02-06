export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  walletAddress: string;
  encryptedPrivateKey?: string;
  pdaAddress?: string;
  autoConversionEnabled: boolean;
  notificationSettings: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  phoneNumber?: string;
  webhook?: string;
}

export interface PaymentRequest {
  id: string;
  merchantId: string;
  orderId?: string;
  amount: number;
  currency: 'SOL' | 'USDC' | 'USDT';
  expectedUsdValue: number;
  label: string;
  message?: string;
  paymentUrl: string;
  qrCodeData: string;
  status: PaymentStatus;
  expiresAt?: Date;
  createdAt: Date;
}

export type PaymentStatus = 'pending' | 'detected' | 'confirmed' | 'converting' | 'completed' | 'failed' | 'expired';

export interface Transaction {
  id: string;
  merchantId: string;
  paymentRequestId?: string;
  orderId?: string;
  signature: string;
  fromAddress: string;
  toAddress: string;
  amountIn: number;
  tokenIn: string;
  amountOut?: number;
  tokenOut?: string;
  usdValue: number;
  fee: number;
  status: PaymentStatus;
  confirmedAt?: Date;
  createdAt: Date;
}

export interface ConversionJob {
  transactionId: string;
  inputMint: string;
  outputMint: string;
  amountIn: number;
  slippageBps: number;
  maxRetries: number;
  attempt: number;
}

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

export interface AgentConfig {
  solanaNetwork: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcUrl: string;
  heliusApiKey: string;
  heliusWebSocketUrl: string;
  jupiterApiUrl: string;
  autoConversionEnabled: boolean;
  defaultSlippageBps: number;
  confirmationWaitTime: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface WebSocketMessage {
  type: 'transaction' | 'account' | 'logs' | 'blockUpdate';
  signature?: string;
  account?: string;
  transaction?: any;
  slot?: number;
  error?: string;
}

export interface AccountingExport {
  merchantId: string;
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
  totalVolumeUSD: number;
  totalFees: number;
  transactionCount: number;
  format: 'csv' | 'json';
}
