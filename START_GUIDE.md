# Quick Start Guide - One Command to Rule Them All! 🚀

## 🎯 TL;DR - Run Everything at Once

No more opening 5 terminals! Use ONE command to start all servers.

---

## 🪟 Windows Users

### Option 1: Batch File (Easiest)
```cmd
start-all.bat
```
Opens 5 separate command windows, one for each server.

### Option 2: PowerShell Script
```powershell
.\start-all.ps1
```
Opens 5 separate PowerShell windows.

### Option 3: npm Script (Cross-platform)
```bash
npm run start:all
```
Runs all servers in one terminal with colors!

---

## 🐧 Mac/Linux Users

### Option 1: npm Script (Recommended)
```bash
npm run start:all
```

### Option 2: Bash Script
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 📋 Available Start Commands

### 1. Start Everything (All Features)
```bash
npm run start:all
```
**Starts:**
- ✅ API Server (port 3000)
- ✅ Admin Dashboard (port 3001)
- ✅ Merchant Dashboard (port 5000)
- ✅ Signup Page (port 8888)
- ✅ Demo Site (port 8080)

**Use when:** Full system demo, testing all features

---

### 2. Start Demo Mode (Hackathon Demo)
```bash
npm run start:demo
```
**Starts:**
- ✅ API Server (port 3000)
- ✅ Merchant Dashboard (port 5000)
- ✅ Demo Site (port 8080)

**Use when:** Recording demo video, showing judges

---

### 3. Start Merchant Mode (Production-Like)
```bash
npm run start:merchant
```
**Starts:**
- ✅ API Server (port 3000)
- ✅ Merchant Dashboard (port 5000)

**Use when:** Merchant-only testing, minimal setup

---

## 🎨 What You'll See

### Using npm Scripts:
```
[API] API Server listening on port 3000
[MERCHANT] Serving HTTP on 0.0.0.0 port 5000
[DEMO] Serving HTTP on 0.0.0.0 port 8080
```
Colored output, all in one terminal!

### Using Batch Files:
5 separate windows pop up, each running one server.

---

## 🌐 URLs After Starting

Once servers are running, open these in your browser:

| Service | URL | Purpose |
|---------|-----|---------|
| **API Server** | http://localhost:3000 | Backend API |
| **Admin Panel** | http://localhost:3001 | Platform management |
| **Merchant Dashboard** | http://localhost:5000 | Merchant login & dashboard |
| **Signup Page** | http://localhost:8888 | New merchant registration |
| **Demo Site** | http://localhost:8080 | Customer checkout demo |

---

## 🛑 How to Stop

### If using npm scripts:
Press `Ctrl+C` in the terminal

### If using batch files:
Close each command window individually

### Kill all node/python processes:
**Windows:**
```powershell
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

**Mac/Linux:**
```bash
killall node
killall python
```

---

## 🧪 Quick Test Flow

### 1. Start everything:
```bash
npm run start:demo
```

### 2. Test the flow:
1. Open http://localhost:8080 (demo site)
2. Click "Pay with Crypto"
3. Make payment
4. Open http://localhost:5000 (merchant dashboard)
5. Login and see transaction!

---

## ⚙️ Customization

### Change Ports
Edit the scripts in `package.json`:

```json
"start:all": "concurrently ... \"cd merchant-dashboard && python -m http.server 5000\" ..."
```

Change `5000` to your desired port.

### Add More Services
```json
"start:custom": "concurrently ... \"your-command-here\" ..."
```

---

## 🐛 Troubleshooting

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Python Not Found
```
Error: 'python' is not recognized
```

**Solution:**
- Install Python 3
- Or use `python3` instead of `python` in scripts

### npm command not found
```
Error: 'npm' is not recognized
```

**Solution:**
- Install Node.js from nodejs.org
- Restart terminal

---

## 📦 Dependencies

### Required:
- ✅ Node.js (v18+)
- ✅ npm
- ✅ Python 3

### Auto-installed:
- ✅ concurrently (dev dependency)

---

## 🎯 Best Practice

### For Development:
```bash
npm run start:merchant
```
Just API + Merchant Dashboard (minimal)

### For Demo:
```bash
npm run start:demo
```
API + Merchant + Demo Site (perfect for showing)

### For Testing Everything:
```bash
npm run start:all
```
All 5 servers (comprehensive testing)

---

## 💡 Pro Tips

### Tip 1: Keep One Terminal Open
Using npm scripts keeps everything in one terminal window = easier to manage!

### Tip 2: Use Demo Mode for Videos
`npm run start:demo` gives you exactly what you need for hackathon videos.

### Tip 3: Windows Users - Use Batch Files
Double-click `start-all.bat` from File Explorer = instant startup!

### Tip 4: Check Server Status
Open http://localhost:3000/api/health to verify API is running.

---

## 🎬 Demo Day Workflow

**Morning of Demo:**
```bash
1. git pull origin main
2. npm install
3. npm run start:demo
4. Open browser tabs
5. Test the flow
6. Record video!
```

**During Presentation:**
```bash
1. Servers already running
2. Show signup → payment → dashboard
3. Minimize terminal (running in background)
4. Focus on browser demos
```

---

## 📊 Performance Notes

### Memory Usage:
- All 5 servers: ~500MB RAM
- Demo mode (3 servers): ~300MB RAM
- Merchant mode (2 servers): ~200MB RAM

### Startup Time:
- All servers: ~5-10 seconds
- Demo mode: ~3-5 seconds
- Merchant mode: ~2-3 seconds

---

## 🚀 Quick Start Comparison

| Method | Terminals | Complexity | Cross-Platform |
|--------|-----------|------------|----------------|
| `npm run start:all` | 1 | ⭐ Easy | ✅ Yes |
| `start-all.bat` | 5 | ⭐⭐ Medium | ❌ Windows only |
| Manual (old way) | 5 | ⭐⭐⭐⭐⭐ Hard | ✅ Yes |

---

## ✅ Summary

**Before:**
```
1. Open terminal 1 → npm run api
2. Open terminal 2 → cd dashboard && npm run dev
3. Open terminal 3 → cd merchant-dashboard && python -m http.server 5000
4. Open terminal 4 → cd signup && python -m http.server 8888
5. Open terminal 5 → cd demo && python -m http.server 8080
```
😫 5 steps, 5 terminals, lots of typing

**After:**
```
npm run start:demo
```
😊 1 command, 1 terminal, done!

---

## 🎉 You're Ready!

Pick your favorite method and start building! 🚀

**Recommended for most users:**
```bash
npm run start:demo
```

**Have fun!** 🎊
