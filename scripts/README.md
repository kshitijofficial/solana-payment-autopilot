# Scripts Directory 🛠️

Utility scripts for testing, debugging, and maintenance. Not required for production deployment.

---

## 📂 Categories

### 🔍 Database Inspection
| Script | Purpose |
|--------|---------|
| `check-database.ts` | Verify database connection + table schemas |
| `check-merchant.ts` | Look up merchant details by ID |
| `check-recent-activity.ts` | Show recent transactions |

### ✉️ Email Testing
| Script | Purpose |
|--------|---------|
| `check-conversion-emails.ts` | Test conversion notification emails |
| `test-customer-email.ts` | Test customer receipt emails |
| `test-email-notifications.ts` | Test all notification types |
| `test-email.ts` | Basic email sending test |
| `manually-test-conversion-email.ts` | Send test conversion email |

### 🧪 Integration Tests
| Script | Purpose |
|--------|---------|
| `test-integration.ts` | Full end-to-end payment flow |
| `test-end-to-end.ts` | Payment → conversion → notification |
| `test-payment-flow.ts` | Payment detection only |
| `test-payment-request-system.ts` | Payment request + webhook flow |

### 🔄 Conversion Testing
| Script | Purpose |
|--------|---------|
| `test-jupiter.ts` | Test Jupiter API integration |
| `test-jupiter-simple.ts` | Simple Jupiter quote test |
| `verify-payment-sync.ts` | Verify payment monitor sync |

### 🤖 Agent Testing
| Script | Purpose |
|--------|---------|
| `test-agent-features.ts` | Test AI agent decisions |
| `test-agentic-features.ts` | Test autonomous behavior |
| `test-wait-decision.ts` | Test conversion timing logic |

### 🎨 Dashboard Testing
| Script | Purpose |
|--------|---------|
| `test-dashboard-filtering.ts` | Test dashboard filters |
| `show-merchant-view.ts` | Display merchant dashboard data |

### 🔧 Utilities
| Script | Purpose |
|--------|---------|
| `generate-platform-wallet.ts` | Create platform wallet for fees |
| `get-merchant-id.ts` | Look up merchant ID by email |
| `fix-notifications.ts` | Fix notification settings |
| `fix-wallet-tx.ts` | Repair stuck transactions |
| `update-all-merchant-emails.ts` | Bulk update merchant emails |
| `manual-process-tx.ts` | Manually process a transaction |

### 🚀 Deployment
| Script | Purpose |
|--------|---------|
| `demo.ts` | Run demo scenario |
| `day1-complete-test.ts` | Day 1 feature validation |
| `start-all.bat` | Windows startup script |
| `start-all.ps1` | PowerShell startup script |
| `start-demo.bat` | Windows demo launcher |

### ⚙️ Environment
| File | Purpose |
|------|---------|
| `.env.platform` | Platform-specific env vars |
| `.env.windows` | Windows-specific env vars |

---

## 🏃 Running Scripts

Most scripts are TypeScript and require compilation:

```bash
# Using ts-node (recommended)
npx ts-node scripts/check-database.ts

# Or compile first
npm run build
node dist/scripts/check-database.js
```

---

## 📝 Notes

- These scripts are for **development/testing only**
- Not included in production builds
- Some scripts require environment variables from `.env`
- Use `scripts/check-database.ts` first to verify setup

---

**For production deployment, see [SETUP_GUIDE.md](../SETUP_GUIDE.md)**
