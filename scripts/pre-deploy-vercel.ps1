# Pre-deployment checks for Vercel

Write-Host "Starting pre-deployment checks for Vercel..." -ForegroundColor Green
Write-Host ""

# Check for environment variables
Write-Host "Checking for required environment variables..." -ForegroundColor Yellow

# Array of required env vars
$requiredVars = @(
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY"
)

# Array of optional vars (warn if not set, but don't fail)
$optionalVars = @(
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
)

# Check if variables are set in environment
$envIssues = 0
foreach ($var in $requiredVars) {
  $value = [Environment]::GetEnvironmentVariable($var)
  if ([string]::IsNullOrEmpty($value)) {
    Write-Host "✗ $var is not set" -ForegroundColor Red
    $envIssues++
  } else {
    # Specific validation for private key
    if ($var -eq "FIREBASE_ADMIN_PRIVATE_KEY") {
      if ($value -match "-----BEGIN PRIVATE KEY-----" -and $value -match "-----END PRIVATE KEY-----") {
        Write-Host "✓ $var is set and appears to be properly formatted" -ForegroundColor Green
      } else {
        Write-Host "✗ $var is set but does not appear to be properly formatted" -ForegroundColor Red
        Write-Host "   Private key should include BEGIN/END PRIVATE KEY markers" -ForegroundColor Yellow
        $envIssues++
      }
    } else {
      Write-Host "✓ $var is set" -ForegroundColor Green
    }
  }
}

# Check optional variables
foreach ($var in $optionalVars) {
  if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($var))) {
    Write-Host "⚠ $var is not set (optional)" -ForegroundColor Yellow
  } else {
    Write-Host "✓ $var is set" -ForegroundColor Green
  }
}

if ($envIssues -gt 0) {
  Write-Host "Found $envIssues environment variable issues that may affect deployment" -ForegroundColor Red
}

# Check for Firebase credentials file
Write-Host ""
Write-Host "Checking Firebase credentials..." -ForegroundColor Yellow

$credentialsPath = "./src/lib/firebase/credentials/service-account.json"
if (Test-Path $credentialsPath) {
  Write-Host "✓ Firebase credentials file exists" -ForegroundColor Green
  
  # Check if the file is in .gitignore and .vercelignore
  $gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
  $vercelignoreContent = Get-Content .vercelignore -ErrorAction SilentlyContinue
  
  if ($gitignoreContent -match "service-account.json" -and $vercelignoreContent -match "service-account.json") {
    Write-Host "✓ Firebase credentials are properly excluded from git and Vercel" -ForegroundColor Green
  } else {
    Write-Host "✗ WARNING: Firebase credentials might not be properly excluded in .gitignore or .vercelignore" -ForegroundColor Red
  }
} else {
  Write-Host "⚠ Firebase credentials file not found, will need to use environment variables" -ForegroundColor Yellow
}

# Check for build issues
Write-Host ""
Write-Host "Running test build..." -ForegroundColor Yellow

try {
  $buildOutput = npm run build --no-lint 2>&1
  Write-Host "✓ Build successful" -ForegroundColor Green
} catch {
  Write-Host "✗ Build failed, check for errors" -ForegroundColor Red
  Write-Host "Re-running build with detailed output..." -ForegroundColor Yellow
  npm run build --no-lint
  exit 1
}

# Final check summary
Write-Host ""
Write-Host "Pre-deployment checks complete" -ForegroundColor Green
if ($envIssues -gt 0) {
  Write-Host "⚠ Some environment variables may be missing. Consider setting them in Vercel." -ForegroundColor Yellow
} else {
  Write-Host "✓ All required environment variables are set" -ForegroundColor Green
}

Write-Host "You are ready to deploy to Vercel!" -ForegroundColor Green
Write-Host "Run 'vercel --prod' to deploy, or push to your Github repository." -ForegroundColor Yellow
