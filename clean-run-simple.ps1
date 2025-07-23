# Clean Run Script - Clear All Caches and Restart
# This script ensures a fresh start to see the updated receipt data

Write-Host "Clean run with cache clearing..." -ForegroundColor Cyan

# 1. Stop any running development servers
Write-Host "Stopping any running development servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Removed .next directory"
}

# 3. Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "   npm cache cleared"

# 4. Deploy Firestore indexes
Write-Host ""
Write-Host "Deploying Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# 5. Test database connection
Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor Yellow
node test-admin-receipt-fetching.js

Write-Host ""
Write-Host "Clean run completed!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache manually:" -ForegroundColor Cyan
Write-Host "1. Open your browser Developer Tools (F12)" -ForegroundColor White
Write-Host "2. Right-click refresh button and select Empty Cache and Hard Reload" -ForegroundColor White
Write-Host "3. Or use Ctrl+Shift+Delete to clear browsing data" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "2. Open browser in incognito mode" -ForegroundColor White
Write-Host "3. Navigate to admin receipts page" -ForegroundColor White
Write-Host "4. Check that both USDT and wallet receipts appear" -ForegroundColor White
