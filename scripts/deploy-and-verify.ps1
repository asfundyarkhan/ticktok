# deploy-and-verify.ps1
# A PowerShell script to deploy to Vercel and verify CSP headers

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "┌─────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│   TikTok Shop Deployment & CSP Verify   │" -ForegroundColor Cyan
Write-Host "└─────────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    $vercelVersion = & vercel --version
    Write-Host "✅ Vercel CLI detected: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Please install it with 'npm install -g vercel'" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = & node --version
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check if axios is installed (needed for verify-csp.js)
try {
    $checkAxios = & npm list axios
    if (!$checkAxios.Contains("axios")) {
        Write-Host "Installing axios package for CSP verification..." -ForegroundColor Yellow
        & npm install axios --save-dev
    } else {
        Write-Host "✅ axios package detected" -ForegroundColor Green
    }
} catch {
    Write-Host "Installing axios package for CSP verification..." -ForegroundColor Yellow
    & npm install axios --save-dev
}

# Prepare environment for Vercel
Write-Host "🔧 Preparing Firebase environment for Vercel..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File .\scripts\prepare-vercel-deploy.ps1

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
& vercel --prod

# Wait for deployment to complete
Write-Host "⏳ Waiting for deployment to propagate (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verify CSP headers
Write-Host "🔍 Verifying CSP headers..." -ForegroundColor Yellow
& node scripts\verify-csp.js

Write-Host ""
Write-Host "✅ Deployment and verification process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Check if verification found any missing CSP domains" -ForegroundColor Yellow
Write-Host "2. Test Firebase authentication in production" -ForegroundColor Yellow
Write-Host "3. Verify Firestore operations are working" -ForegroundColor Yellow
Write-Host "4. Check Analytics events are being tracked" -ForegroundColor Yellow
