# How to Verify Customer Email in Resend

## Problem
Resend free tier only sends emails to **verified email addresses**. Your customer email `srivask6022@gmail.com` needs to be verified.

## Solution Options

### Option 1: Verify the Email (Free Tier)
1. Go to [Resend Dashboard](https://resend.com/emails)
2. Click "Settings" → "Verified Emails"
3. Add `srivask6022@gmail.com`
4. Resend will send a verification email to that address
5. Open email and click verification link
6. ✅ Done! Now you can send to that email

**Pros:**
- Free
- Quick (5 minutes)

**Cons:**
- Must verify each customer email individually
- Not scalable for production

---

### Option 2: Upgrade to Paid Plan
Resend paid plans allow sending to **any email address** without verification.

**Pricing:**
- **Pro Plan:** $20/month - 50,000 emails
- **Business Plan:** $85/month - 500,000 emails

**When to upgrade:**
- You have multiple customers
- You want automatic customer notifications
- You're ready for production

---

## For Demo/Testing Only

If you just want to test the customer email flow **right now**, you can temporarily:

1. Update the payment request to use your verified email:
   ```bash
   cd /root/.openclaw/workspace/solana-payment-autopilot
   
   # Quick SQL update
   cat << 'EOF' > update-customer-email.sql
   UPDATE payment_requests 
   SET customer_email = 'srivastavakshitijprofessional@gmail.com'
   WHERE customer_email = 'srivask6022@gmail.com';
   EOF
   ```

2. Then test again - you'll receive both emails (merchant + customer)

**Note:** This is just for testing. In production, customers should receive emails at their own addresses.

---

## Testing After Verification

Once email is verified, test the full flow:

```bash
# 1. Restart the payment monitor
npx tsx src/api/server-v2.ts

# 2. Create a test payment (use demo site)
# 3. Make payment
# 4. Check both inboxes:
#    - Merchant: srivastavakshitijprofessional@gmail.com
#    - Customer: srivask6022@gmail.com
```

Expected emails:
- ✅ Customer: "Payment Confirmed - [Merchant]"
- ✅ Merchant: "Payment Received: X SOL"
- ✅ Merchant: "Conversion Complete: X SOL → X USDC"
