# PowerShell script to deploy Firestore rules for admin buy page

Write-Host "Deploying Firestore rules for admin and superadmin dashboard buy permissions..." -ForegroundColor Green

# Check if Firebase CLI is installed
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Firebase CLI not found. Please install it using 'npm install -g firebase-tools'" -ForegroundColor Red
    exit 1
}

# Check if user is logged in
$loginStatus = firebase login:list | Select-String -Pattern "No authorized accounts"
if ($loginStatus) {
    Write-Host "You're not logged in to Firebase. Please run 'firebase login' first." -ForegroundColor Yellow
    firebase login
}

# Deploy Firestore rules
Write-Host "Deploying Firestore rules..." -ForegroundColor Blue
firebase deploy --only firestore:rules

Write-Host "Firestore rules deployment complete!" -ForegroundColor Green
Write-Host "Admins and superadmins can now buy seller products from the dashboard buy page." -ForegroundColor Green
