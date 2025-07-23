# Deploy Receipt Indexes Only Script
# This script only deploys the Firestore indexes to restore data access

Write-Host "🔄 Deploying Firestore indexes to restore receipt tracking..." -ForegroundColor Cyan

# Deploy the indexes
Write-Host "📦 Deploying Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# Wait for indexes to be created (they take some time)
Write-Host "⏳ Waiting for indexes to be created (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "✅ Index deployment complete! Your receipt data should now be accessible again." -ForegroundColor Green
Write-Host ""
Write-Host "🔍 To verify the fix:" -ForegroundColor Cyan
Write-Host "1. Log in as a superadmin" -ForegroundColor White
Write-Host "2. Check the receipts history page" -ForegroundColor White
Write-Host "3. Verify that both USDT and wallet receipts are now visible in the history." -ForegroundColor White
Write-Host "4. If some payment types are still missing, run the full fix script: .\deploy-receipt-fixes.ps1" -ForegroundColor White
