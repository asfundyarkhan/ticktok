# Firebase Storage CORS Configuration Helper
# This PowerShell script helps update Firebase Storage CORS configuration
# It uses the Google Cloud SDK (gsutil) to update CORS settings

# Make sure you have gsutil installed and authenticated with Firebase project
# gcloud auth login

# Function to check if gsutil is installed
function Check-GsutilInstalled {
    try {
        $null = & gsutil version
        return $true
    }
    catch {
        Write-Host "❌ gsutil is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        return $false
    }
}

# Function to check if user is authenticated with gcloud
function Check-GcloudAuth {
    try {
        $auth = & gcloud auth list --format="value(account)"
        if ($auth) {
            Write-Host "✅ Authenticated as: $auth" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Not authenticated with gcloud" -ForegroundColor Red
            Write-Host "Please run: gcloud auth login" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking gcloud authentication" -ForegroundColor Red
        return $false
    }
}

# Main function to update CORS
function Update-FirebaseStorageCors {
    param (
        [string]$bucketName,
        [string]$corsFile = "firebase-storage-cors.json"
    )

    if (-not (Check-GsutilInstalled)) { return }
    if (-not (Check-GcloudAuth)) { return }

    # Ensure we have a bucket name
    if (-not $bucketName) {
        # Try to get from .env file
        if (Test-Path ".env.local") {
            $envContent = Get-Content ".env.local" -Raw
            if ($envContent -match 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=([^\r\n"]+)') {
                $bucketName = $matches[1]
                Write-Host "Found bucket name in .env.local: $bucketName" -ForegroundColor Blue
            }
        }
        
        if (-not $bucketName) {
            $bucketName = Read-Host "Enter your Firebase Storage bucket name (e.g., your-project-id.appspot.com)"
        }
    }

    # Verify the CORS file exists
    if (-not (Test-Path $corsFile)) {
        Write-Host "❌ CORS configuration file not found: $corsFile" -ForegroundColor Red
        return
    }

    Write-Host "Updating CORS configuration for bucket: $bucketName" -ForegroundColor Cyan
    Write-Host "Using CORS configuration from: $corsFile" -ForegroundColor Cyan

    try {
        # Apply CORS configuration
        & gsutil cors set $corsFile gs://$bucketName

        Write-Host "✅ CORS configuration successfully updated!" -ForegroundColor Green
        Write-Host "Firebase Storage bucket should now accept requests from your application domains." -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error updating CORS configuration: $_" -ForegroundColor Red
    }
}

# Check for Firebase storage bucket in project
function Get-FirebaseStorageBucket {
    # Try to get bucket from firebase.json
    if (Test-Path "firebase.json") {
        $firebaseConfig = Get-Content "firebase.json" | ConvertFrom-Json
        if ($firebaseConfig.storage -and $firebaseConfig.storage.bucket) {
            return $firebaseConfig.storage.bucket
        }
    }
    
    # Try to get from .env files
    $envFiles = @(".env", ".env.local", ".env.development", ".env.production")
    foreach ($envFile in $envFiles) {
        if (Test-Path $envFile) {
            $envContent = Get-Content $envFile -Raw
            if ($envContent -match 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=([^\r\n"]+)') {
                return $matches[1]
            }
        }
    }
    
    return $null
}

# Main execution
$bucketName = Get-FirebaseStorageBucket
if ($bucketName) {
    Write-Host "Found Firebase Storage bucket: $bucketName" -ForegroundColor Green
    $confirm = Read-Host "Do you want to update CORS settings for this bucket? (y/n)"
    if ($confirm -eq "y") {
        Update-FirebaseStorageCors -bucketName $bucketName -corsFile "firebase-storage-cors.json"
    }
}
else {
    Write-Host "No Firebase Storage bucket found in configuration files." -ForegroundColor Yellow
    $manualBucket = Read-Host "Enter your Firebase Storage bucket name manually (e.g., your-project-id.appspot.com)"
    if ($manualBucket) {
        Update-FirebaseStorageCors -bucketName $manualBucket -corsFile "firebase-storage-cors.json"
    }
}

Write-Host "`nTo test if CORS is working correctly, try uploading a receipt in your application." -ForegroundColor Cyan
Write-Host "If you still encounter CORS errors, make sure your application is using the correct bucket URL:" -ForegroundColor Cyan
Write-Host "  - Use .firebasestorage.app domain instead of .appspot.com" -ForegroundColor Yellow
Write-Host "  - Verify storage rules allow receipt uploads (.storage.rules)" -ForegroundColor Yellow
