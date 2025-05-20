# Setup Firebase Environment Variables for Vercel Deployment
# This script helps you set up Firebase environment variables for Vercel deployment

Write-Host "Firebase Environment Variables Setup for Vercel" -ForegroundColor Blue
Write-Host "This script will help you prepare your Firebase environment variables for Vercel deployment.`n" -ForegroundColor White

# Check if service account file exists
$serviceAccountPath = ".\src\lib\firebase\credentials\service-account.json"
if (Test-Path $serviceAccountPath) {
    Write-Host "Found service account file at $serviceAccountPath" -ForegroundColor Green
    
    # Read and parse JSON file
    $serviceAccount = Get-Content $serviceAccountPath -Raw | ConvertFrom-Json
    # Extract values
    $projectId = $serviceAccount.project_id
    $clientEmail = $serviceAccount.client_email
    $privateKey = $serviceAccount.private_key
    
    # Validate private key format
    $privateKeyValid = $privateKey -match "-----BEGIN PRIVATE KEY-----" -and $privateKey -match "-----END PRIVATE KEY-----"
    
    Write-Host "`nFirebase Admin SDK Values:" -ForegroundColor Blue
    Write-Host "PROJECT_ID: $projectId" -ForegroundColor Green
    Write-Host "CLIENT_EMAIL: $clientEmail" -ForegroundColor Green
    
    if ($privateKeyValid) {
        Write-Host "PRIVATE_KEY: [Valid key found with BEGIN/END markers]" -ForegroundColor Green
    }
    else {
        Write-Host "PRIVATE_KEY: [Warning: Key found but may be missing BEGIN/END markers]" -ForegroundColor Red
        Write-Host "  The private key MUST include the BEGIN/END markers for Firebase Admin to work correctly" -ForegroundColor Yellow
    }
    
    # Create Vercel CLI command
    Write-Host "`nTo set these in Vercel via CLI, run:" -ForegroundColor Blue
    Write-Host "vercel env add FIREBASE_ADMIN_PROJECT_ID" -ForegroundColor Green
    Write-Host "vercel env add FIREBASE_ADMIN_CLIENT_EMAIL" -ForegroundColor Green
    Write-Host "vercel env add FIREBASE_ADMIN_PRIVATE_KEY" -ForegroundColor Green
    
    Write-Host "`nFor Vercel Dashboard:" -ForegroundColor Blue
    Write-Host "1. Go to your Vercel project dashboard"
    Write-Host "2. Navigate to Settings > Environment Variables"
    Write-Host "3. Add the following variables:"    Write-Host "   - Name: FIREBASE_ADMIN_PROJECT_ID" -ForegroundColor Green
    Write-Host "     Value: $projectId" -ForegroundColor Green
    Write-Host "   - Name: FIREBASE_ADMIN_CLIENT_EMAIL" -ForegroundColor Green
    Write-Host "     Value: $clientEmail" -ForegroundColor Green
    Write-Host "   - Name: FIREBASE_ADMIN_PRIVATE_KEY" -ForegroundColor Green
    
    if ($privateKeyValid) {
        # For clipboard copy convenience
        $privateKeyClipboard = $privateKey
        [System.Windows.Forms.Clipboard]::SetText($privateKeyClipboard)
        Write-Host "     Value: The private key has been copied to your clipboard" -ForegroundColor Green
        Write-Host "            (Includes BEGIN/END markers and proper formatting)" -ForegroundColor Green
        Write-Host "            Just paste directly into Vercel's environment variable input" -ForegroundColor Green
    }
    else {
        Write-Host "     Value: Open the service account JSON file and copy the entire private_key value" -ForegroundColor Yellow
        Write-Host "            Make sure it includes the BEGIN/END markers!" -ForegroundColor Red
    }
    
    Write-Host "`nIMPORTANT VERCEL NOTES:" -ForegroundColor Magenta
    Write-Host "1. Vercel handles newlines in private keys automatically - paste the key as-is" -ForegroundColor White
    Write-Host "2. For Production environment, check 'Production' and save" -ForegroundColor White
    Write-Host "3. For Preview environments, check 'Preview' if you want auth to work in PR previews" -ForegroundColor White
    Write-Host "4. For Development environment, local .env files are used instead" -ForegroundColor White
    
}
else {
    Write-Host "No service account file found at $serviceAccountPath" -ForegroundColor Red
    Write-Host "Please download your service account key from Firebase and place it at the path above."
    Write-Host "Or manually set the environment variables in your Vercel dashboard."
}

# Get Firebase Web Config
$webConfigFile = ".\src\lib\firebase\firebase.ts"
if (Test-Path $webConfigFile) {
    Write-Host "`nFirebase Web Configuration:" -ForegroundColor Blue
    Write-Host "Found Firebase web config at $webConfigFile"
    Write-Host "Extract these values for your NEXT_PUBLIC environment variables:"
    
    # Read file contents
    $webConfigContent = Get-Content $webConfigFile -Raw
    
    # Extract web config values using regex
    $apiKeyMatch = [regex]::Match($webConfigContent, 'apiKey:\s*"([^"]*)"')
    $authDomainMatch = [regex]::Match($webConfigContent, 'authDomain:\s*"([^"]*)"')
    $projectIdMatch = [regex]::Match($webConfigContent, 'projectId:\s*"([^"]*)"')
    $storageBucketMatch = [regex]::Match($webConfigContent, 'storageBucket:\s*"([^"]*)"')
    $messagingSenderIdMatch = [regex]::Match($webConfigContent, 'messagingSenderId:\s*"([^"]*)"')
    $appIdMatch = [regex]::Match($webConfigContent, 'appId:\s*"([^"]*)"')
    $measurementIdMatch = [regex]::Match($webConfigContent, 'measurementId:\s*"([^"]*)"')
    
    # Extract values from regex matches
    $apiKey = if ($apiKeyMatch.Success) { $apiKeyMatch.Groups[1].Value } else { "Not found" }
    $authDomain = if ($authDomainMatch.Success) { $authDomainMatch.Groups[1].Value } else { "Not found" }
    $projectId = if ($projectIdMatch.Success) { $projectIdMatch.Groups[1].Value } else { "Not found" }
    $storageBucket = if ($storageBucketMatch.Success) { $storageBucketMatch.Groups[1].Value } else { "Not found" }
    $messagingSenderId = if ($messagingSenderIdMatch.Success) { $messagingSenderIdMatch.Groups[1].Value } else { "Not found" }
    $appId = if ($appIdMatch.Success) { $appIdMatch.Groups[1].Value } else { "Not found" }
    $measurementId = if ($measurementIdMatch.Success) { $measurementIdMatch.Groups[1].Value } else { "Not found" }
    
    Write-Host "NEXT_PUBLIC_FIREBASE_API_KEY: $apiKey" -ForegroundColor Green
    Write-Host "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: $authDomain" -ForegroundColor Green
    Write-Host "NEXT_PUBLIC_FIREBASE_PROJECT_ID: $projectId" -ForegroundColor Green
    Write-Host "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: $storageBucket" -ForegroundColor Green
    Write-Host "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: $messagingSenderId" -ForegroundColor Green
    Write-Host "NEXT_PUBLIC_FIREBASE_APP_ID: $appId" -ForegroundColor Green
    Write-Host "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: $measurementId" -ForegroundColor Green
}
else {
    Write-Host "`nNo Firebase web config found at $webConfigFile" -ForegroundColor Red
}

Write-Host "`nAfter Setting Environment Variables:" -ForegroundColor Blue
Write-Host "1. Deploy your application to Vercel:"
Write-Host "   vercel --prod" -ForegroundColor Green
Write-Host "2. Test authentication in the deployed application"
Write-Host "3. Check Vercel Function Logs if you encounter any issues"

# Client-side Firebase configuration section
Write-Host "`n`n=============================================================" -ForegroundColor Yellow
Write-Host "CLIENT-SIDE FIREBASE CONFIGURATION" -ForegroundColor Yellow  
Write-Host "=============================================================" -ForegroundColor Yellow

# Check if .env.production file exists
$envProductionPath = ".\.env.production"
$envProductionExamplePath = ".\.env.production.example"

if (Test-Path $envProductionPath) {
    Write-Host "Found .env.production file. Reading Firebase client configuration..." -ForegroundColor Green
    
    # Parse environment variables from .env.production
    $envContent = Get-Content $envProductionPath
    $clientConfig = @{
    }
    
    foreach ($line in $envContent) {
        if ($line -match '^\s*NEXT_PUBLIC_FIREBASE_([^=]+)=(.+)\s*$') {
            $key = $Matches[1]
            $value = $Matches[2].Trim()
            $clientConfig[$key] = $value
        }
    }
    
    # Display client config
    Write-Host "`nClient-side Firebase configuration found:" -ForegroundColor Blue
    foreach ($key in $clientConfig.Keys) {
        $value = $clientConfig[$key]
        Write-Host "NEXT_PUBLIC_FIREBASE_$key = $value" -ForegroundColor Green
    }
    
    # Instructions for Vercel
    Write-Host "`nTo set these in Vercel via CLI or dashboard:" -ForegroundColor Blue
    foreach ($key in $clientConfig.Keys) {
        $value = $clientConfig[$key]
        Write-Host "vercel env add NEXT_PUBLIC_FIREBASE_$key" -ForegroundColor Green
    }
    
    Write-Host "`nNote: These values will be visible in client-side code, which is safe for Firebase client configuration" -ForegroundColor Yellow
} 
elseif (Test-Path $envProductionExamplePath) {
    Write-Host ".env.production not found, but found .env.production.example" -ForegroundColor Yellow
    Write-Host "Please copy .env.production.example to .env.production and update with your Firebase configuration" -ForegroundColor Yellow
    Write-Host "Command: Copy-Item .env.production.example .env.production" -ForegroundColor Green
}
else {
    Write-Host "Could not find Firebase client configuration files (.env.production or .env.production.example)" -ForegroundColor Red
    Write-Host "Please create these files with your Firebase configuration" -ForegroundColor Yellow
}

# Offer to update firebase.js file
Write-Host "`n=============================================================" -ForegroundColor Yellow
Write-Host "VERIFY FIREBASE STORAGE BUCKET FORMAT" -ForegroundColor Yellow
Write-Host "=============================================================" -ForegroundColor Yellow
Write-Host "Make sure your Firebase storage bucket URL has the correct format:" -ForegroundColor Blue
Write-Host "It should be: projectId.appspot.com (not projectId.firebasestorage.app)" -ForegroundColor Yellow

$firebaseConfigPath = ".\src\lib\firebase\firebase.ts"
if (Test-Path $firebaseConfigPath) {
    $firebaseContent = Get-Content $firebaseConfigPath -Raw
    
    if ($firebaseContent -match 'storageBucket: [^,]+firebasestorage\.app') {
        Write-Host "`nWarning: Your firebase.ts file may be using the wrong storage bucket format!" -ForegroundColor Red
        Write-Host "Consider updating to the 'projectId.appspot.com' format for Vercel compatibility" -ForegroundColor Yellow
    }
}
