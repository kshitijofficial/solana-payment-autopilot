import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface Merchant {
  id: string;
  business_name: string;
  email: string;
  wallet_address: string;
  notification_email?: string;
  auto_convert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id?: string;
  merchant_id: string;
  signature: string;
  from_address: string;
  to_address: string;
  amount: number;
  token: string;
  usd_value?: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  block_time?: Date;
  created_at?: string;
  updated_at?: string;
}

export interface Conversion {
  id?: string;
  transaction_id: string;
  from_token: string;
  to_token: string;
  from_amount: number;
  to_amount: number;
  swap_signature: string;
  jupiter_route_plan?: any;
  slippage_bps: number;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('Database service initialized with Supabase');
  }

  /**
   * Get Supabase client for direct queries
   */
  getClient() {
    return this.supabase;
  }

  // ===== MERCHANTS =====

  async getMerchantByWallet(walletAddress: string): Promise<Merchant | null> {
    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      logger.error('Failed to get merchant by wallet', error);
      return null;
    }

    return data;
  }

  async getAllMerchants(): Promise<Merchant[]> {
    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get all merchants', error);
      return [];
    }

    return data || [];
  }

  async createMerchant(merchant: Omit<Merchant, 'id' | 'created_at' | 'updated_at'>): Promise<Merchant | null> {
    const { data, error } = await this.supabase
      .from('merchants')
      .insert(merchant)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create merchant', error);
      return null;
    }

    logger.info(`Created merchant: ${data.business_name}`);
    return data;
  }

  // ===== TRANSACTIONS =====

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Duplicate signature - already processed
        logger.debug(`Transaction already exists: ${transaction.signature}`);
        return null;
      }
      logger.error('Failed to create transaction', error);
      return null;
    }

    logger.info(`Created transaction: ${data.signature.slice(0, 8)}... (${data.amount} ${data.token})`);
    return data;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update transaction', error);
      return null;
    }

    return data;
  }

  async getTransactionBySignature(signature: string): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('signature', signature)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      logger.error('Failed to get transaction by signature', error);
      return null;
    }

    return data;
  }

  async getTransactionsByMerchant(merchantId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to get transactions by merchant', error);
      return [];
    }

    return data || [];
  }

  // ===== CONVERSIONS =====

  async createConversion(conversion: Omit<Conversion, 'id' | 'created_at' | 'updated_at'>): Promise<Conversion | null> {
    const { data, error } = await this.supabase
      .from('conversions')
      .insert(conversion)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create conversion', error);
      return null;
    }

    logger.info(`Created conversion: ${conversion.from_amount} ${conversion.from_token} → ${conversion.to_amount} ${conversion.to_token}`);
    return data;
  }

  async updateConversion(id: string, updates: Partial<Conversion>): Promise<Conversion | null> {
    const { data, error } = await this.supabase
      .from('conversions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update conversion', error);
      return null;
    }

    return data;
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  /**
   * Subscribe to transaction updates for a merchant
   * Returns unsubscribe function
   */
  subscribeToTransactions(
    merchantId: string,
    callback: (transaction: Transaction) => void
  ): () => void {
    const channel = this.supabase
      .channel(`transactions:${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          logger.debug('Real-time transaction update', payload);
          callback(payload.new as Transaction);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}

// Singleton instance with lazy initialization
let _dbInstance: DatabaseService | null = null;

export function getDb(): DatabaseService {
  if (!_dbInstance) {
    _dbInstance = new DatabaseService();
  }
  return _dbInstance;
}

// Convenience export
export const db = new Proxy({} as DatabaseService, {
  get(target, prop) {
    return (getDb() as any)[prop];
  }
});
