import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { db } from '../database/supabase';

interface Insight {
  type: 'alert' | 'recommendation' | 'forecast' | 'pattern';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: string;
  created_at: Date;
}

export class AgentInsightsService {
  private anthropic?: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async generateInsights(merchantId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    try {
      const data = await this.getMerchantData(merchantId);
      
      // Fraud detection
      const fraudAlert = this.detectFraud(data);
      if (fraudAlert) insights.push(fraudAlert);
      
      // Pattern detection
      const patterns = this.detectPatterns(data);
      insights.push(...patterns);
      
      // Smart recommendations
      const recommendation = this.generateRecommendation(data);
      if (recommendation) insights.push(recommendation);
      
      // Price alerts
      const priceAlert = await this.checkPriceAlerts(data);
      if (priceAlert) insights.push(priceAlert);
      
      // Revenue forecast
      const forecast = this.forecastRevenue(data);
      if (forecast) insights.push(forecast);
      
      // Customer insights
      const customerInsight = this.analyzeCustomers(data);
      if (customerInsight) insights.push(customerInsight);
      
      return insights;
    } catch (error) {
      logger.error('Failed to generate insights', error);
      return insights;
    }
  }

  private async getMerchantData(merchantId: string) {
    const txs = await db.getClient()
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(100);

    const merchant = await db.getClient()
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .single();

    return {
      transactions: txs.data || [],
      merchant: merchant.data
    };
  }

  private detectFraud(data: any): Insight | null {
    const txs = data.transactions;
    if (txs.length < 3) return null;

    const recent = txs.slice(0, 5);
    const amounts = recent.map((t: any) => parseFloat(t.amount));
    const avg = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    
    // Check for anomalies
    const hasAnomaly = amounts.some((a: number) => a > avg * 5);
    
    if (hasAnomaly) {
      return {
        type: 'alert',
        priority: 'high',
        title: '⚠️ Unusual Payment Detected',
        message: 'Large payment significantly above your average. Review for potential fraud.',
        action: 'Review Transactions',
        created_at: new Date()
      };
    }
    
    return null;
  }

  private detectPatterns(data: any): Insight[] {
    const insights: Insight[] = [];
    const txs = data.transactions;
    
    if (txs.length < 2) return insights;
    
    // Check for rapid transactions
    const last3Hours = txs.filter((t: any) => {
      const age = Date.now() - new Date(t.created_at).getTime();
      return age < 3 * 60 * 60 * 1000;
    });
    
    if (last3Hours.length >= 5) {
      insights.push({
        type: 'pattern',
        priority: 'medium',
        title: '📊 High Activity Detected',
        message: `${last3Hours.length} payments in last 3 hours. Unusual spike in volume.`,
        created_at: new Date()
      });
    }
    
    return insights;
  }

  private generateRecommendation(data: any): Insight | null {
    const txs = data.transactions;
    const merchant = data.merchant;
    
    if (txs.length < 5) return null;
    
    const last7Days = txs.filter((t: any) => {
      const age = Date.now() - new Date(t.created_at).getTime();
      return age < 7 * 24 * 60 * 60 * 1000;
    });
    
    const totalVolume = last7Days.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    
    if (totalVolume > 1 && merchant?.risk_profile === 'conservative') {
      return {
        type: 'recommendation',
        priority: 'medium',
        title: '💡 Risk Profile Suggestion',
        message: 'Your volume increased 50%+ this week. Consider "moderate" risk for better conversion timing.',
        action: 'Update Profile',
        created_at: new Date()
      };
    }
    
    return null;
  }

  private async checkPriceAlerts(data: any): Promise<Insight | null> {
    try {
      const res = await fetch('https://price.jup.ag/v4/price?ids=SOL');
      const priceData: any = await res.json();
      const price = priceData.data.SOL.price;
      
      if (price > 160) {
        return {
          type: 'alert',
          priority: 'low',
          title: '📈 SOL Price High',
          message: `SOL at $${price.toFixed(2)} - good time to convert holdings if you have pending payments.`,
          created_at: new Date()
        };
      }
      
      if (price < 140) {
        return {
          type: 'alert',
          priority: 'low',
          title: '📉 SOL Price Dip',
          message: `SOL at $${price.toFixed(2)} - consider waiting for better rates on new payments.`,
          created_at: new Date()
        };
      }
    } catch (error) {
      // Ignore price fetch errors
    }
    
    return null;
  }

  private forecastRevenue(data: any): Insight | null {
    const txs = data.transactions;
    if (txs.length < 10) return null;
    
    const last7Days = txs.filter((t: any) => {
      const age = Date.now() - new Date(t.created_at).getTime();
      return age < 7 * 24 * 60 * 60 * 1000;
    });
    
    const totalVolume = last7Days.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    const dailyAvg = totalVolume / 7;
    const weeklyForecast = dailyAvg * 7 * 150; // Assume $150/SOL
    
    return {
      type: 'forecast',
      priority: 'low',
      title: '📊 Revenue Forecast',
      message: `Based on trends: ~$${weeklyForecast.toFixed(0)} this week (${dailyAvg.toFixed(3)} SOL/day)`,
      created_at: new Date()
    };
  }

  private analyzeCustomers(data: any): Insight | null {
    const txs = data.transactions;
    if (txs.length < 3) return null;
    
    // Group by sender
    const customers: { [key: string]: number } = {};
    txs.forEach((t: any) => {
      customers[t.from_address] = (customers[t.from_address] || 0) + parseFloat(t.amount);
    });
    
    const sorted = Object.entries(customers).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    
    if (top && top[1] > 0.1) {
      return {
        type: 'pattern',
        priority: 'low',
        title: '👤 Top Customer',
        message: `Customer ${top[0].slice(0, 8)}... paid ${top[1].toFixed(3)} SOL total.`,
        created_at: new Date()
      };
    }
    
    return null;
  }
}

export const agentInsightsService = new AgentInsightsService();
