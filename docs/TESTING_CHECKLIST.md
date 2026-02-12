# End-to-End Testing Checklist

## Quick Start (Windows PowerShell)

### Terminal 1: API Server
```powershell
cd C:\Projects\hackathon\solana-payment-autopilot
npm run api
```
✅ Should start on http://localhost:3000

### Terminal 2: Merchant Dashboard
```powershell
cd C:\Projects\hackathon\solana-payment-autopilot
npm run dashboard
```
✅ Should start on http://localhost:3001

### Terminal 3: Demo Merchant Site
```powershell
cd C:\Projects\hackathon\solana-payment-autopilot\demo
python -m http.server 8080
```
✅ Should start on http://localhost:8080

---

## Testing Steps

### ☑️ Step 1: Open Merchant Dashboard
1. Go to http://localhost:3001
2. You should see existing transactions and conversions
3. Keep this tab open

### ☑️ Step 2: Open Demo Site
1. Go to http://localhost:8080
2. You should see "Blockchain Mastery Course" landing page
3. Beautiful gradient design with "Pay with Crypto" button

### ☑️ Step 3: Initiate Payment
1. Click **"Pay with Crypto"** button
2. Enter email: `student@example.com` (or any email)
3. Wait for redirect to checkout page

### ☑️ Step 4: Checkout Page
You should see:
- [ ] QR code displayed
- [ ] Payment amount in SOL
- [ ] "Waiting for payment..." status
- [ ] Merchant name: "check"
- [ ] Order description

### ☑️ Step 5: Make Payment
**Using Phantom Mobile:**
1. Open Phantom app
2. Scan QR code
3. Approve transaction (devnet)
4. Wait ~15 seconds

**Or using Phantom Browser Extension:**
1. Copy merchant wallet: `GFpZSWUjLdPwnvewNTJrrZZFWx115EzvRFGZC2J1AXDi`
2. Send SOL to that address
3. Wait ~15 seconds

### ☑️ Step 6: Verify Payment Detection
After payment:
- [ ] Checkout page updates to "Payment Confirmed!" ✅
- [ ] Green success message appears
- [ ] Transaction signature shown

### ☑️ Step 7: Check Merchant Dashboard
Switch to http://localhost:3001
- [ ] New transaction appears at top of list
- [ ] Shows correct amount (SOL)
- [ ] Status: "confirmed"
- [ ] Transaction signature visible
- [ ] Conversion record created (SOL → USDC)

### ☑️ Step 8: Verify Emails
Check inbox for `srivastavakshitijprofessional@gmail.com`
- [ ] "Payment Received" email (merchant notification)
- [ ] "Conversion Complete" email (after ~5 seconds)

**Customer email** (`student@example.com` or whatever you entered):
- [ ] "Payment Confirmed" email
  - ⚠️ Only works if email is verified in Resend
  - See `VERIFY_CUSTOMER_EMAIL.md` for instructions

### ☑️ Step 9: Test Dashboard Features
In merchant dashboard:
- [ ] Filter transactions by status
- [ ] Search by signature
- [ ] View conversion details
- [ ] Export CSV for accounting

---

## Success Criteria

### Minimum Viable Demo ✅
- [x] Demo site loads and looks professional
- [x] Payment button creates request via SDK
- [x] Checkout page displays QR code
- [x] Payment is detected automatically (~15s)
- [x] Transaction appears in dashboard
- [x] Auto-conversion works (SOL → USDC)
- [x] Merchant receives email notification

### Bonus Points 🌟
- [ ] Customer email works (needs Resend verification)
- [ ] CSV export downloads correctly
- [ ] Multiple payments work in sequence
- [ ] Dashboard updates in real-time (refresh)

---

## Demo Video Checklist

Record a 2-3 minute walkthrough:

1. **[0:00-0:20]** Show problem
   - "Merchants want to accept crypto but it's too complex..."
   
2. **[0:20-0:40]** Show solution
   - "3 lines of JavaScript SDK..."
   - Show code in demo/index.html
   
3. **[0:40-1:00]** Show demo site
   - Beautiful course landing page
   - Click "Pay with Crypto"
   
4. **[1:00-1:20]** Show checkout
   - QR code appears
   - Scan with Phantom
   - Payment confirms
   
5. **[1:20-1:40]** Show dashboard
   - Transaction appears
   - Conversion happens
   - Email notifications
   
6. **[1:40-2:00]** Show features
   - Auto-conversion to USDC
   - Accounting export
   - Email notifications
   
7. **[2:00-2:20]** Show agent autonomy
   - "Agent runs 24/7..."
   - "Detects payments automatically..."
   - "No manual intervention needed..."

---

## Troubleshooting

### "Failed to create payment request"
- Check API server is running (Terminal 1)
- Check browser console for errors
- Verify merchant ID in demo/index.html

### "QR code not loading"
- Check checkout folder exists
- Verify payment request was created
- Check API server logs

### "Payment not detected"
- Wait up to 30 seconds
- Check payment monitor is running
- Verify correct merchant wallet used
- Check logs: `tail -f logs/combined.log`

### "Transaction not in dashboard"
- Refresh the page
- Check API server logs
- Verify database connection

---

## Quick Commands

```powershell
# Check database
npx tsx check-database.ts

# Check recent activity
npx tsx check-recent-activity.ts

# Get merchant ID
npx tsx get-merchant-id.ts

# Test customer email
npx tsx test-customer-email.ts
```

---

**Ready to test? Follow the steps above and check off each item!** ✅
