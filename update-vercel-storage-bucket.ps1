# PowerShell script to update Firebase Storage Bucket in Vercel
# This script updates the NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable to use the correct .firebasestorage.app format

Write-Host "Updating Firebase Storage Bucket URL in Vercel Environment Variables..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Vercel CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Set the correct storage bucket URL
$STORAGE_BUCKET = "ticktokshop-5f1e9.firebasestorage.app"

Write-Host "Setting NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to: $STORAGE_BUCKET" -ForegroundColor Cyan

# Update the environment variable in Vercel
try {
    vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
    Write-Host "Please enter the value: $STORAGE_BUCKET" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: You can also update it directly in the Vercel dashboard:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
    Write-Host "4. Find NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" -ForegroundColor White
    Write-Host "5. Update the value to: $STORAGE_BUCKET" -ForegroundColor Green
    Write-Host ""
    Write-Host "After updating, redeploy your application:" -ForegroundColor Cyan
    Write-Host "vercel --prod" -ForegroundColor Yellow
}
catch {
    Write-Host "Error updating Vercel environment variable: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please manually update the environment variable in Vercel dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
    Write-Host "4. Find NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" -ForegroundColor White
    Write-Host "5. Update the value to: $STORAGE_BUCKET" -ForegroundColor Green
}
