# Resend Email Configuration

## Quick Start (Demo/Testing)

For hackathon demo, you can use Resend's **onboarding domain** without verification:

**Sender Email:** `onboarding@resend.dev`

Update `.env`:
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

This works immediately but emails may go to spam. Perfect for demo/testing.

---

## Production Setup (Optional - After Hackathon)

For production, add your custom domain:

### Step 1: Add Domain in Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `paymentautopilot.com`)

### Step 2: Add DNS Records

Resend will give you DNS records to add:

```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

### Step 3: Verify Domain

- Wait 5-15 minutes for DNS propagation
- Click "Verify" in Resend dashboard
- Once verified, update `.env`:

```bash
RESEND_FROM_EMAIL=noreply@paymentautopilot.com
```

---

## Testing Emails

Run the test script:

```bash
npx tsx test-email-notifications.ts
```

This will:
1. Send a test payment notification
2. Send a test conversion notification
3. Show success/failure status

---

## Troubleshooting

### Emails Not Sending

1. Check API key is valid:
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"onboarding@resend.dev","to":"test@example.com","subject":"test","html":"test"}'
   ```

2. Check logs:
   - API server console shows "Email sent successfully"
   - Or error messages with details

3. Check Resend dashboard:
   - https://resend.com/emails
   - Shows all sent emails and delivery status

### Emails Going to Spam

- Use the onboarding domain for demo (acceptable for hackathon)
- For production, verify your custom domain
- Add SPF/DKIM/DMARC records (Resend provides these)

---

## Rate Limits (Free Tier)

- **3,000 emails/month**
- **10 emails/second**

Perfect for hackathon demo - you have 75x buffer for testing.

---

## Current Status

- ✅ API key configured: `re_2R9UD87E_DevdaXWv1y1PHAHg6DvNzhYe`
- ✅ EmailService implemented
- ✅ Integrated with payment monitor
- ✅ Integrated with conversion service
- ⏳ **Need to set sender email** (use `onboarding@resend.dev` for demo)
