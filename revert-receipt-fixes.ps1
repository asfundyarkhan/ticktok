# Revert Receipt History Fix Script
# This script reverts the Firestore indexes and restores data if possible

Write-Host "Emergency data restoration for receipt history tracking..." -ForegroundColor Red

# 1. First check if we have the service account key
if (-not (Test-Path -Path "./serviceAccountKey.json")) {
    Write-Host "Error: serviceAccountKey.json file is missing!" -ForegroundColor Red
    Write-Host "Please ensure you have the Firebase service account key file in the root directory." -ForegroundColor Yellow
    exit 1
}

# 2. Deploy the original Firestore indexes (remove any problematic indexes)
Write-Host "Reverting Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# 3. Wait for indexes to be applied
Write-Host "Waiting for indexes to be reverted (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 4. Run the restoration script
$runRestoration = Read-Host "Do you want to run the restoration script to fix receipt data? (y/n)"
if ($runRestoration -eq "y") {
    Write-Host "Running restoration script for receipt data..." -ForegroundColor Yellow
    node restore-receipt-data.js
}

Write-Host "Emergency restoration process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check your database to verify if data has been restored" -ForegroundColor White
Write-Host "2. If data is still missing, contact Firebase support for data recovery options" -ForegroundColor White
Write-Host "3. Make a complete backup of your database before making any more changes" -ForegroundColor White
