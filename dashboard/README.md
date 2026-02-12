# Platform Admin Dashboard 👨‍💼

**React-based admin panel for platform operators to manage multiple merchants.**

---

## 🎯 Purpose

This is the **platform admin view**, not a merchant dashboard. It allows:
- ✅ View all registered merchants
- ✅ Switch between merchant accounts
- ✅ Monitor transactions across the platform
- ✅ Export data for accounting/analysis
- ✅ Real-time updates (10-second polling)

**For individual merchant dashboards**, see: `/merchant-dashboard/` (port 5000)

---

## 🚀 Setup

### 1. Install Dependencies
```bash
cd dashboard
npm install
```

### 2. Start API Server
```bash
# From root directory
npm run api
```
API runs on: http://localhost:3000

### 3. Start Admin Dashboard
```bash
# From dashboard/ directory
npm run dev
```
Admin panel runs on: **http://localhost:3001**

---

## 📊 Features

### Platform Overview
- Total merchants count
- Total transactions across platform
- Total converted amounts (USDC)

### Merchant Management
- Dropdown selector to view any merchant
- View wallet address + Solscan link
- Copy merchant ID for sharing

### Transaction Monitoring
- Real-time transaction updates
- Filter by status (confirmed/pending/failed)
- Search by signature or address
- Conversion tracking (SOL → USDC)

### Data Export
- CSV export for accounting
- QuickBooks-compatible format
- Filter + export specific data

---

## 🆚 Admin vs Merchant Dashboard

| Feature | Admin Dashboard (port 3001) | Merchant Dashboard (port 5000) |
|---------|----------------------------|-------------------------------|
| **View** | All merchants | Single merchant only |
| **Auth** | Platform operator | Merchant ID login |
| **Technology** | React + Vite | Static HTML |
| **Use Case** | Platform management | Merchant self-service |
| **Deployment** | Build required | Serve static files |

---

## 🛠️ Development

```bash
npm run dev      # Start dev server (port 3001)
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 📦 Tech Stack

- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: REST endpoints on port 3000

---

## 🔐 Security Notes

**⚠️ This admin panel has no authentication!**

For production:
- Add authentication (JWT, OAuth, etc.)
- Restrict access by IP/network
- Add role-based permissions
- Implement audit logging

**Current setup is for demo/hackathon only.**

---

## 🚀 Production Deployment

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

Serve with:
- Vercel/Netlify (auto-deploy from GitHub)
- Nginx/Apache (static hosting)
- Express.js (serve build files)

---

**For hackathon judges:** This demonstrates a complete platform with both merchant-facing and admin-facing interfaces.
