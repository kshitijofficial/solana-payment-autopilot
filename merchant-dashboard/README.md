# Merchant Dashboard - Single Merchant View

## 🎯 Purpose

This is the **merchant-facing dashboard** - what small business owners actually see and use.

**Key Differences from Port 3001 Dashboard:**
- ❌ No merchant dropdown (single merchant only)
- ❌ No "create merchant" button
- ✅ Clean, focused on ONE merchant's data
- ✅ Easy to understand for non-technical users

---

## 🚀 How to Use

### 1. Serve the Dashboard

**Option A: Python**
```bash
cd merchant-dashboard
python -m http.server 5000
```

**Option B: Node.js**
```bash
cd merchant-dashboard
npx http-server -p 5000
```

**Option C: VS Code Live Server**
- Right-click `index.html`
- Select "Open with Live Server"

### 2. Open in Browser

Navigate to: **http://localhost:5000**

---

## ⚙️ Configuration

Edit `index.html` line ~310 to set your merchant ID:

```javascript
const MERCHANT_ID = 'be87c918-36a4-4d59-9566-cad574c4e370'; // Replace with your merchant
```

**Your current merchants:**
- `be87c918-36a4-4d59-9566-cad574c4e370` - "check" (4 transactions)
- `adf9f513-45f1-4d11-8fd8-d940d977bcec` - "Kshitij" (1 transaction)

---

## 🎨 What Merchants See

### Top Stats
- 💰 **Total Received** - Total SOL received from customers
- 📊 **Transactions** - Number of payments
- 📈 **Converted to USDC** - Auto-converted stable funds

### Wallet Address
- See payment wallet address
- Copy to clipboard (one click)
- View on Solscan

### QR Code Generator
- Enter amount (e.g., 0.05 SOL)
- Generate QR code
- Print/display at register
- Customers scan to pay

### Transaction History
- All payments listed
- Time, amount, status
- Conversion details (SOL→USDC)
- Links to blockchain
- Export CSV for accounting

---

## 🔄 Auto-Refresh

Dashboard automatically refreshes every 15 seconds to show new payments in real-time.

**Manual refresh:** Click "Refresh" button in top-right

---

## 📱 Mobile Responsive

Works great on:
- Desktop computers
- Tablets
- Mobile phones

Perfect for checking payments on-the-go!

---

## 🆚 Comparison

| Feature | Port 3001 (Admin) | Port 5000 (Merchant) |
|---------|-------------------|----------------------|
| **Who uses it?** | Platform operator | Small business owner |
| **Multiple merchants?** | Yes (dropdown) | No (single merchant) |
| **Create merchants?** | Yes | No |
| **Target user?** | Technical | Non-technical |
| **Purpose?** | Platform management | Daily operations |

---

## 🎥 Demo Script

**For hackathon video, show BOTH dashboards:**

### 1. Customer Experience (Port 8080)
> "Joe wants to buy a course for $1..."
- Show demo site
- Click "Pay with Crypto"
- Scan QR code

### 2. Merchant Experience (Port 5000) ⭐
> "The merchant immediately sees the payment..."
- **Open merchant dashboard** (localhost:5000)
- Show payment appear in real-time
- Show auto-conversion: 0.00666 SOL → $1.00 USDC
- Show CSV export for accounting

### 3. Platform View (Port 3001)
> "As a platform, we can manage multiple merchants..."
- Show admin dashboard
- Select different merchants
- Show platform-level stats

This shows you've built:
1. ✅ Customer-facing checkout
2. ✅ **Merchant-facing dashboard** (what matters!)
3. ✅ Platform admin tools

---

## 🔐 Production Roadmap

### Phase 1: Add Login
```
merchant-login.html
  ↓ Enter email/password
Validate credentials
  ↓ Store session
Load merchant dashboard with their merchant_id
```

### Phase 2: Onboarding Flow
```
signup.html
  ↓ Business name, email, password
Create merchant account
  ↓ Generate wallet
Send welcome email with credentials
  ↓
merchant-dashboard.html (auto-login)
```

---

## 💡 Key Insight

**This is what makes your project valuable:**
- Not just accepting crypto (anyone can do that)
- **Making it EASY for small merchants** (this is your innovation!)
- Clean UI, auto-conversion, accounting exports
- Non-technical business owners can use it

---

## 🚀 Quick Test

1. Start API server: `npm run api` (port 3000)
2. Start merchant dashboard: `python -m http.server 5000` (port 5000)
3. Open: http://localhost:5000
4. You should see "check" merchant's 4 transactions
5. Generate a QR code
6. Click "Export CSV"

Everything works without authentication - perfect for demo!

---

**This is the dashboard merchants will actually use!** 🛍️
