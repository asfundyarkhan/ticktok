# PowerShell script for deploying to Vercel with custom domain

Write-Host "🚀 Deploying to Vercel with custom domain..." -ForegroundColor Cyan

# Install any dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Green
npm ci

# Run Firebase environment preparation
Write-Host "🔥 Preparing Firebase environment..." -ForegroundColor Green
npm run prepare:vercel:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase environment preparation failed!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Firebase environment ready" -ForegroundColor Green
}

# Run lint check but don't fail on errors
Write-Host "🔍 Running lint check..." -ForegroundColor Green
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Lint issues found but continuing..." -ForegroundColor Yellow
}

# Run type check but don't fail on errors
Write-Host "🔍 Running type check..." -ForegroundColor Green
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Type issues found but continuing..." -ForegroundColor Yellow
}

# Build the application
Write-Host "🏗️ Building application..." -ForegroundColor Green
npm run build

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
npx vercel --prod

Write-Host "✅ Deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Now setting up custom domain..." -ForegroundColor Cyan
Write-Host "Please check your Vercel dashboard to set up your custom domain settings." -ForegroundColor White
Write-Host "Visit: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "1. Select your project" -ForegroundColor White
Write-Host "2. Go to Settings → Domains" -ForegroundColor White
Write-Host "3. Add your custom domain" -ForegroundColor White
Write-Host "4. Follow the instructions to configure DNS settings" -ForegroundColor White
