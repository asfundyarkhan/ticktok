# setup-firebase-admin-vercel.ps1
# Script to automate setting up Firebase Admin credentials in Vercel

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Firebase Admin Credentials Setup for Vercel`n" -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    $vercelVersion = & vercel --version
    Write-Host "Vercel CLI detected: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "Vercel CLI is not installed. Please install it with 'npm i -g vercel'" -ForegroundColor Red
    exit 1
}

# Check if logged in to Vercel
try {
    $null = & vercel whoami 2>&1
} catch {
    Write-Host "You need to log in to Vercel first" -ForegroundColor Yellow
    & vercel login
}

# Check if service account file exists
$serviceAccountPath = Join-Path $PSScriptRoot "..\src\lib\firebase\credentials\service-account.json"
if (-not (Test-Path $serviceAccountPath)) {
    Write-Host "Service account file not found at $serviceAccountPath" -ForegroundColor Red
    Write-Host "Please download your service account key from Firebase Console:" -ForegroundColor Yellow
    Write-Host "1. Go to Firebase Console > Project Settings > Service Accounts"
    Write-Host "2. Click 'Generate New Private Key'"
    Write-Host "3. Save the file as $serviceAccountPath"
    
    # Ask if user wants to continue with manual input
    $manualInput = Read-Host "Do you want to enter the values manually instead? (y/n)"
    if ($manualInput -ne "y" -and $manualInput -ne "Y") {
        exit 1
    }
    
    # Manual input
    Write-Host "`nManual input of Firebase Admin credentials" -ForegroundColor Cyan
    $projectId = Read-Host "Enter Firebase Project ID"
    $clientEmail = Read-Host "Enter Firebase Client Email"
    Write-Host "Enter Firebase Private Key (paste the entire key including BEGIN/END markers):" -ForegroundColor Yellow
    $privateKey = @()
    while ($true) {
        $line = Read-Host
        if ($line -eq "") {
            break
        }
        $privateKey += $line
    }
    $privateKey = $privateKey -join "`n"
} else {
    # Extract values from service account JSON
    Write-Host "Found service account file at $serviceAccountPath" -ForegroundColor Green
    $serviceAccount = Get-Content $serviceAccountPath -Raw | ConvertFrom-Json
    
    $projectId = $serviceAccount.project_id
    $clientEmail = $serviceAccount.client_email
    $privateKey = $serviceAccount.private_key
    
    if (-not $privateKey) {
        Write-Host "Could not extract private key from service account JSON" -ForegroundColor Red
        exit 1
    }
}

# Display the values
Write-Host "`nFirebase Admin SDK Values:" -ForegroundColor Cyan
Write-Host "PROJECT_ID: $projectId" -ForegroundColor Green
Write-Host "CLIENT_EMAIL: $clientEmail" -ForegroundColor Green
Write-Host "PRIVATE_KEY: [Found - first/last characters: $($privateKey.Substring(0, [Math]::Min(10, $privateKey.Length)))...$($privateKey.Substring([Math]::Max(0, $privateKey.Length - 10)))]" -ForegroundColor Green

# Ask for confirmation before setting Vercel environment variables
Write-Host "`nReady to set these values as Vercel environment variables." -ForegroundColor Yellow
$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    exit 0
}

# Set environment variables in Vercel
Write-Host "`nSetting up Vercel environment variables..." -ForegroundColor Cyan

# Create temporary files
$projectIdFile = [System.IO.Path]::GetTempFileName()
$clientEmailFile = [System.IO.Path]::GetTempFileName()
$privateKeyFile = [System.IO.Path]::GetTempFileName()

# Write values to temporary files
Set-Content -Path $projectIdFile -Value $projectId -NoNewline
Set-Content -Path $clientEmailFile -Value $clientEmail -NoNewline
Set-Content -Path $privateKeyFile -Value $privateKey -NoNewline

# Add environment variables
Write-Host "Adding FIREBASE_ADMIN_PROJECT_ID..." -ForegroundColor Yellow
& vercel env add FIREBASE_ADMIN_PROJECT_ID < $projectIdFile

Write-Host "Adding FIREBASE_ADMIN_CLIENT_EMAIL..." -ForegroundColor Yellow
& vercel env add FIREBASE_ADMIN_CLIENT_EMAIL < $clientEmailFile

Write-Host "Adding FIREBASE_ADMIN_PRIVATE_KEY..." -ForegroundColor Yellow
& vercel env add FIREBASE_ADMIN_PRIVATE_KEY < $privateKeyFile

# Clean up temporary files
Remove-Item $projectIdFile, $clientEmailFile, $privateKeyFile -Force

Write-Host "`nFirebase Admin credentials have been added to Vercel!" -ForegroundColor Green
Write-Host "You can verify them in your Vercel project dashboard under Settings > Environment Variables" -ForegroundColor Cyan

# Ask if the user wants to deploy now
$deployNow = Read-Host "Do you want to deploy to Vercel now? (y/n)"
if ($deployNow -eq "y" -or $deployNow -eq "Y") {
    Write-Host "`nDeploying to Vercel..." -ForegroundColor Cyan
    & vercel --prod
} else {
    Write-Host "`nYou can deploy later using 'vercel --prod'" -ForegroundColor Cyan
}

Write-Host "`nSetup complete!" -ForegroundColor Green
