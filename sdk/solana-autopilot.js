/**
 * Solana Payment Autopilot SDK
 * 
 * Simple integration for merchants to accept crypto payments
 * 
 * Usage:
 * <script src="https://cdn.solanaautopilot.com/sdk.js"></script>
 * <script>
 *   const autopilot = new SolanaAutopilot({
 *     apiKey: 'YOUR_API_KEY',
 *     merchantId: 'YOUR_MERCHANT_ID'
 *   });
 *   
 *   autopilot.createPayment({
 *     amount: 50,
 *     orderId: 'ORDER-123',
 *     customerEmail: 'customer@example.com'
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  class SolanaAutopilot {
    constructor(config) {
      if (!config.merchantId) {
        throw new Error('merchantId is required');
      }

      this.merchantId = config.merchantId;
      this.apiKey = config.apiKey;
      this.apiBase = config.apiBase || 'http://localhost:3000';
      this.onSuccess = config.onSuccess || (() => {});
      this.onError = config.onError || (() => {});
      this.onCancel = config.onCancel || (() => {});
    }

    /**
     * Create a payment and redirect to checkout
     */
    async createPayment(options) {
      const {
        amount,
        orderId,
        customerEmail,
        customerName,
        description,
        callbackUrl,
        metadata,
        expiresInMinutes = 15
      } = options;

      if (!amount || amount <= 0) {
        throw new Error('amount must be greater than 0');
      }

      try {
        const response = await fetch(`${this.apiBase}/api/payment-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          body: JSON.stringify({
            merchant_id: this.merchantId,
            amount_usd: amount,
            order_id: orderId,
            customer_email: customerEmail,
            customer_name: customerName,
            description: description,
            callback_url: callbackUrl,
            metadata: metadata,
            expires_in_minutes: expiresInMinutes
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment');
        }

        // Redirect to checkout page
        window.location.href = result.data.payment_url;

        return result.data;
      } catch (error) {
        this.onError(error);
        throw error;
      }
    }

    /**
     * Get payment URL without redirecting
     */
    async getPaymentUrl(options) {
      const result = await this.createPaymentRequest(options);
      return result.payment_url;
    }

    /**
     * Create payment request and return data (no redirect)
     */
    async createPaymentRequest(options) {
      const {
        amount,
        orderId,
        customerEmail,
        customerName,
        description,
        callbackUrl,
        metadata,
        expiresInMinutes = 15
      } = options;

      if (!amount || amount <= 0) {
        throw new Error('amount must be greater than 0');
      }

      try {
        const response = await fetch(`${this.apiBase}/api/payment-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          body: JSON.stringify({
            merchant_id: this.merchantId,
            amount_usd: amount,
            order_id: orderId,
            customer_email: customerEmail,
            customer_name: customerName,
            description: description,
            callback_url: callbackUrl,
            metadata: metadata,
            expires_in_minutes: expiresInMinutes
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment');
        }

        return result.data;
      } catch (error) {
        this.onError(error);
        throw error;
      }
    }

    /**
     * Check payment status
     */
    async checkPaymentStatus(paymentId) {
      try {
        const response = await fetch(`${this.apiBase}/api/payment-requests/${paymentId}`, {
          headers: {
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          }
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to check payment status');
        }

        return result.data;
      } catch (error) {
        this.onError(error);
        throw error;
      }
    }

    /**
     * Create payment button
     */
    createButton(options) {
      const {
        amount,
        orderId,
        description,
        buttonText = `Pay $${amount} with Crypto`,
        buttonStyle = {}
      } = options;

      const button = document.createElement('button');
      button.textContent = buttonText;
      button.className = 'solana-autopilot-button';
      
      // Default styles
      Object.assign(button.style, {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '10px',
        cursor: 'pointer',
        ...buttonStyle
      });

      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Loading...';
        
        try {
          await this.createPayment({
            amount,
            orderId,
            description
          });
        } catch (error) {
          button.disabled = false;
          button.textContent = buttonText;
          alert('Payment failed. Please try again.');
        }
      });

      return button;
    }

    /**
     * Open payment in popup window
     */
    async openPaymentPopup(options) {
      const paymentData = await this.createPaymentRequest(options);
      
      const width = 600;
      const height = 700;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      const popup = window.open(
        paymentData.payment_url,
        'SolanaPayment',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Poll for payment completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.checkPaymentStatus(paymentData.payment_id);
          
          if (status.status === 'paid') {
            clearInterval(pollInterval);
            if (popup && !popup.closed) {
              popup.close();
            }
            this.onSuccess(status);
          } else if (status.status === 'expired' || status.status === 'failed') {
            clearInterval(pollInterval);
            if (popup && !popup.closed) {
              popup.close();
            }
            this.onError(new Error('Payment ' + status.status));
          }
        } catch (error) {
          // Ignore polling errors
        }
      }, 3000);

      // Stop polling if popup is closed
      const checkClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(pollInterval);
          clearInterval(checkClosed);
          this.onCancel();
        }
      }, 500);

      return paymentData;
    }
  }

  // Export to window
  window.SolanaAutopilot = SolanaAutopilot;

  // Also support module exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolanaAutopilot;
  }

})(typeof window !== 'undefined' ? window : this);
