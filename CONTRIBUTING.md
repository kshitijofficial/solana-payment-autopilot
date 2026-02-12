# Contributing to Solana Payment Autopilot 🤝

Thank you for your interest in contributing! This project was built for the Colosseum Agent Hackathon, and we welcome contributions from the community.

---

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/solana-payment-autopilot.git
   cd solana-payment-autopilot
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up environment**
   ```bash
   cp .env.example .env
   # Add your API keys
   ```
5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 💻 Development Workflow

### Running Locally
```bash
npm run dev        # Start agent + API
npm run api        # API server only
npm run agent      # Agent only
```

### Testing
```bash
npm run test              # Run all tests
npm run test:integration  # Integration tests
npm run test:agent        # Agent tests
npm run db:check          # Verify database
```

### Code Quality
```bash
npm run lint       # Check code style
npm run format     # Auto-format code
npm run build      # Compile TypeScript
```

---

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Follow existing code structure
- Add types for all functions
- Avoid `any` types when possible

### Style
- Use Prettier for formatting (configured)
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic

### Commits
- Use clear, descriptive commit messages
- Format: `feat: add payment webhook support`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**
```
feat: add Jupiter auto-conversion
fix: resolve payment detection race condition
docs: update README with deployment steps
refactor: simplify webhook retry logic
test: add integration tests for conversion
chore: update dependencies
```

---

## 🐛 Reporting Bugs

**Before submitting:**
1. Check existing issues
2. Test on latest `main` branch
3. Gather reproduction steps

**Bug report should include:**
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, network)
- Logs (if applicable)

---

## ✨ Requesting Features

**Feature requests should include:**
- Clear use case
- Why it's valuable
- How it might work
- Any alternatives considered

---

## 🔀 Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Make your changes**
   - Write clean, tested code
   - Update documentation if needed
   - Add tests for new features

3. **Test thoroughly**
   ```bash
   npm run test:all
   npm run build
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Use a clear title
   - Describe what changed and why
   - Reference any related issues
   - Add screenshots/videos for UI changes

6. **Respond to feedback**
   - Address review comments
   - Push updates to the same branch

---

## 📂 Project Structure

```
src/
├── agent/          # AI agent logic
├── services/       # Business logic
├── modules/        # Reusable components
├── api/            # REST API
├── database/       # Database client
└── utils/          # Helpers

scripts/            # Utility scripts
docs/               # Documentation
merchant-dashboard/ # Merchant UI
checkout/           # Hosted checkout
sdk/                # JavaScript SDK
demo/               # Demo site
```

**Add new features in the appropriate directory.**

---

## 🧪 Testing Guidelines

### Unit Tests
- Test individual functions/modules
- Mock external dependencies
- Use Jest

### Integration Tests
- Test full workflows
- Use test database
- Clean up after tests

### Manual Testing
```bash
npm run demo       # Run demo scenario
npm run test:db    # Check database
```

---

## 🌟 Areas We Need Help

- [ ] **Shopify plugin** - E-commerce integration
- [ ] **WooCommerce plugin** - WordPress integration
- [ ] **Multi-token support** - BONK, USDT, etc.
- [ ] **Tax reporting** - Export for tax software
- [ ] **Mobile app** - React Native merchant app
- [ ] **Better error handling** - More robust error recovery
- [ ] **Performance optimization** - Reduce API calls, optimize queries
- [ ] **Documentation** - Improve guides, add tutorials
- [ ] **Tests** - Increase coverage

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Every contribution, big or small, helps make crypto payments more accessible to merchants worldwide.

Questions? Open an issue or reach out:
- GitHub: [@kshitijofficial](https://github.com/kshitijofficial)
- Telegram: [@KshitijWeb3](https://t.me/KshitijWeb3)

---

**Happy coding! 🚀**
