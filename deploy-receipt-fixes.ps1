# Deploy Receipt History Fix Script
# This script deploys the Firestore indexes and fixes for deposit receipts

Write-Host "🔧 Deploying fixes for deposit receipt history tracking..." -ForegroundColor Cyan

# 1. Deploy the updated Firestore indexes
Write-Host "📦 Deploying Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# 2. Wait for indexes to be created (they take some time)
Write-Host "⏳ Waiting for indexes to be created (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 3. Run the deposit fix script if needed
$runDepositFix = Read-Host "Do you want to run the fix script for existing deposit receipts? (y/n)"
if ($runDepositFix -eq "y") {
    Write-Host "🔄 Running fix script for existing deposit receipts..." -ForegroundColor Yellow
    node fix-deposit-receipts.js
}

# 4. Run the safe USDT payment tracking fix
$runPaymentTypeFix = Read-Host "Do you want to run the SAFE fix for USDT payment tracking? (y/n)"
if ($runPaymentTypeFix -eq "y") {
    Write-Host "🔄 Running SAFE USDT payment tracking fix (no data deletion)..." -ForegroundColor Yellow
    node safe-usdt-tracking-fix.js
}

Write-Host "✅ Deployment complete! All receipts (USDT and wallet payments) should now appear correctly in history tracking." -ForegroundColor Green
Write-Host ""
Write-Host "🔍 To verify the fix:" -ForegroundColor Cyan
Write-Host "1. Log in as a superadmin" -ForegroundColor White
Write-Host "2. Check the receipts history page" -ForegroundColor White
Write-Host "3. Verify that both USDT and wallet receipts are now visible in the history." -ForegroundColor White
