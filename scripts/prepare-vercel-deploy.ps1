# Vercel deployment preparation script for TikTok Shop (PowerShell version)
# This script prepares the environment for Firebase connection in production

# Echo environment status
Write-Host "⚙️ Preparing build for Vercel deployment..." -ForegroundColor Cyan

# Create production environment variable file if it doesn't exist
if (-not (Test-Path -Path ".env.production")) {
    Write-Host "📝 Creating .env.production file..." -ForegroundColor Yellow
    $envContent = @"
# Production Firebase Configuration
# These values are embedded in the client-side code and are safe to be public

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ticktokshop-5f1e9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ticktokshop-5f1e9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=155434252666
NEXT_PUBLIC_FIREBASE_APP_ID=1:155434252666:web:fa5051f4cb33f3a784bec3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5BRMHTMXHR

# Add your production domain here
NEXT_PUBLIC_APP_URL=https://yourproductiondomain.com
NEXT_PUBLIC_APP_ENV=production
"@
    Set-Content -Path ".env.production" -Value $envContent
    Write-Host "✅ Created .env.production file" -ForegroundColor Green
}
else {
    Write-Host "✅ .env.production already exists" -ForegroundColor Green
}

# Check for environment variable in PowerShell
Write-Host "🔍 Checking client environment variables..." -ForegroundColor Yellow
if (-not (Test-Path env:NEXT_PUBLIC_FIREBASE_API_KEY)) {
    Write-Host "⚠️ Warning: NEXT_PUBLIC_FIREBASE_API_KEY not found in environment" -ForegroundColor Yellow
    Write-Host "📝 Make sure to add Firebase environment variables to your Vercel project" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Firebase client environment variables found" -ForegroundColor Green
}

# Check Firebase Admin variables
Write-Host "🔍 Checking Firebase Admin environment variables..." -ForegroundColor Yellow
$firebaseAdminMissing = $false

if (-not (Test-Path env:FIREBASE_ADMIN_PROJECT_ID)) {
    Write-Host "⚠️ Warning: FIREBASE_ADMIN_PROJECT_ID not found in environment" -ForegroundColor Yellow
    $firebaseAdminMissing = $true
}

if (-not (Test-Path env:FIREBASE_ADMIN_CLIENT_EMAIL)) {
    Write-Host "⚠️ Warning: FIREBASE_ADMIN_CLIENT_EMAIL not found in environment" -ForegroundColor Yellow
    $firebaseAdminMissing = $true
}

if (-not (Test-Path env:FIREBASE_ADMIN_PRIVATE_KEY)) {
    Write-Host "⚠️ Warning: FIREBASE_ADMIN_PRIVATE_KEY not found in environment" -ForegroundColor Yellow
    $firebaseAdminMissing = $true
}

if ($firebaseAdminMissing) {
    Write-Host "⚠️ Some Firebase Admin environment variables are missing" -ForegroundColor Yellow
    Write-Host "📝 Server-side authentication features will not work correctly" -ForegroundColor Yellow
    Write-Host "📝 Run 'npm run setup:firebase-admin:win' to set up Firebase Admin" -ForegroundColor Yellow
    
    # Ask if the user wants to continue without Firebase Admin
    $continueDeploy = Read-Host "Do you want to continue with deployment anyway? (y/n)"
    if ($continueDeploy -ne "y" -and $continueDeploy -ne "Y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 1
    }
    Write-Host "⚠️ Continuing deployment with limited functionality..." -ForegroundColor Yellow
}
else {
    Write-Host "✅ Firebase Admin environment variables found" -ForegroundColor Green
}

# Show deployment info
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host "🔗 Firebase Configuration:" -ForegroundColor Cyan
Write-Host "   - Project: ticktokshop-5f1e9" -ForegroundColor White
Write-Host "   - Auth Domain: ticktokshop-5f1e9.firebaseapp.com" -ForegroundColor White
Write-Host "   - Storage: ticktokshop-5f1e9.appspot.com" -ForegroundColor White
