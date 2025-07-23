# Clean Run Script - Clear All Caches and Restart
# This script ensures a fresh start to see the updated receipt data

Write-Host "🧹 Starting clean run with cache clearing..." -ForegroundColor Cyan

# 1. Stop any running development servers
Write-Host "⏹️ Stopping any running development servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*next*" -or $_.CommandLine -like "*dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Clear Next.js cache
Write-Host "🗑️ Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed .next directory"
}

# 3. Clear npm cache
Write-Host "🗑️ Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "   ✅ npm cache cleared"

# 4. Clear node_modules cache (if needed)
$clearNodeModules = Read-Host "Do you want to clear node_modules and reinstall? (y/n)"
if ($clearNodeModules -eq "y") {
    Write-Host "🗑️ Clearing node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force
        Write-Host "   ✅ Removed node_modules"
    }
    
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "   ✅ Dependencies installed"
}

# 5. Clear browser data (instructions)
Write-Host ""
Write-Host "🌐 IMPORTANT: Clear your browser cache manually:" -ForegroundColor Cyan
Write-Host "   1. Open your browser Developer Tools (F12)" -ForegroundColor White
Write-Host "   2. Right-click the refresh button and select 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host "   3. Or go to Settings -> Privacy -> Clear browsing data" -ForegroundColor White
Write-Host "   4. Select 'Cached images and files' and 'Cookies and site data'" -ForegroundColor White
Write-Host "   5. Clear for 'All time'" -ForegroundColor White

# 6. Verify Firestore indexes are deployed
Write-Host ""
Write-Host "📦 Deploying Firestore indexes to ensure they're current..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# 7. Test database connection
Write-Host ""
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
node test-admin-receipt-fetching.js

# 8. Start development server
Write-Host ""
$startDev = Read-Host "Do you want to start the development server now? (y/n)"
if ($startDev -eq "y") {
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 After the server starts:" -ForegroundColor Cyan
    Write-Host "   1. Wait for the server to fully load" -ForegroundColor White
    Write-Host "   2. Open your browser in incognito/private mode" -ForegroundColor White
    Write-Host "   3. Navigate to your admin receipts page" -ForegroundColor White
    Write-Host "   4. Check both pending and approved receipts" -ForegroundColor White
    Write-Host ""
    
    # Start the development server
    npm run dev
} else {
    Write-Host ""
    Write-Host "✅ Clean run completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Start your development server: npm run dev" -ForegroundColor White
    Write-Host "   2. Open browser in incognito/private mode" -ForegroundColor White
    Write-Host "   3. Navigate to admin receipts page" -ForegroundColor White
    Write-Host "   4. Clear browser cache if needed (Ctrl+Shift+Delete)" -ForegroundColor White
    Write-Host "   5. Check that both USDT and wallet receipts appear" -ForegroundColor White
}
}
