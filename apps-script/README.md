# Apps Script Development Workflow

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: NPM Script

```bash
npm run deploy
```

### Option 3: Manual Commands (Backup)

```bash
# Convert to .gs for deployment
mv CardBuilders.js CardBuilders.gs
mv CardCommon.js CardCommon.gs
mv CardExpenses.js CardExpenses.gs
mv CardJobs.js CardJobs.gs
mv CardPreProcessed.js CardPreProcessed.gs
mv CardTravel.js CardTravel.gs
mv Code.js Code.gs
mv Tests.js Tests.gs

# Deploy
clasp push

# Convert back to .js for development
mv CardBuilders.gs CardBuilders.js
mv CardCommon.gs CardCommon.js
mv CardExpenses.gs CardExpenses.js
mv CardJobs.gs CardJobs.js
mv CardPreProcessed.gs CardPreProcessed.js
mv CardTravel.gs CardTravel.js
mv Code.gs Code.js
mv Tests.gs Tests.js
```

## 📁 File Structure

- `*.js` - Development files (Git tracked, better syntax highlighting)
- `*.gs` - Deployment files (temporary, created during deployment)
- `deploy.sh` - The one and only deployment script that works!
- `appsscript.json` - Apps Script manifest (always .json)

## 💡 Tips

- Always develop in `.js` files for better IDE support
- Never commit `.gs` files to Git (except appsscript.json)
- Use `./deploy.sh` for worry-free deployment
- Script automatically handles file conversion both ways
