# Safe USDT Payment Tracking Fix Script
# This script ensures USDT payments appear in superadmin tracking WITHOUT deleting any fields

Write-Host "🔧 Starting safe USDT payment tracking fix..." -ForegroundColor Cyan
Write-Host "This script ONLY ADDS missing fields and never removes existing data." -ForegroundColor Green

# 1. Check for service account key
if (-not (Test-Path -Path "./serviceAccountKey.json")) {
    Write-Host "❌ Error: serviceAccountKey.json file is missing!" -ForegroundColor Red
    Write-Host "Please ensure you have the Firebase service account key file in the root directory." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get the service account key:" -ForegroundColor Cyan
    Write-Host "1. Go to Firebase Console -> Project Settings -> Service Accounts" -ForegroundColor White
    Write-Host "2. Click 'Generate new private key'" -ForegroundColor White
    Write-Host "3. Save the file as 'serviceAccountKey.json' in this directory" -ForegroundColor White
    exit 1
}

# 2. Run the safe tracking fix
Write-Host "🔄 Running safe USDT payment tracking fix..." -ForegroundColor Yellow
node safe-usdt-tracking-fix.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Safe tracking fix completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 To verify the fix:" -ForegroundColor Cyan
    Write-Host "1. Log in as a superadmin" -ForegroundColor White
    Write-Host "2. Go to the admin receipts page" -ForegroundColor White
    Write-Host "3. Check that both wallet and USDT payments appear in the 'All Receipts' section" -ForegroundColor White
    Write-Host "4. USDT payments should show without the 'Wallet' badge" -ForegroundColor White
    Write-Host "5. Wallet payments should show with a purple 'Wallet' badge" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Error occurred during the fix. Please check the output above." -ForegroundColor Red
    Write-Host "Make sure you have the correct serviceAccountKey.json file." -ForegroundColor Yellow
}
