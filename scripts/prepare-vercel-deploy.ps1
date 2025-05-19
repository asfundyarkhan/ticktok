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
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path env:NEXT_PUBLIC_FIREBASE_API_KEY)) {
    Write-Host "⚠️ Warning: NEXT_PUBLIC_FIREBASE_API_KEY not found in environment" -ForegroundColor Yellow
    Write-Host "📝 Make sure to add Firebase environment variables to your Vercel project" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Firebase environment variables found" -ForegroundColor Green
}

# Show deployment info
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host "🔗 Firebase Configuration:" -ForegroundColor Cyan
Write-Host "   - Project: ticktokshop-5f1e9" -ForegroundColor White
Write-Host "   - Auth Domain: ticktokshop-5f1e9.firebaseapp.com" -ForegroundColor White
Write-Host "   - Storage: ticktokshop-5f1e9.appspot.com" -ForegroundColor White
