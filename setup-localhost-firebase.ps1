# Firebase Localhost Setup Script for Windows PowerShell
# This script helps configure Firebase for localhost development

Write-Host "🔧 Firebase Localhost Development Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Write-Host "`n1️⃣ Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCli = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseCli) {
    Write-Host "❌ Firebase CLI not found. Install with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Firebase CLI found" -ForegroundColor Green

Write-Host "`n2️⃣ Checking Firebase project..." -ForegroundColor Yellow
try {
    $projectInfo = firebase projects:list --json | ConvertFrom-Json
    $projectId = "ticktokshop-5f1e9"
    Write-Host "✅ Using Firebase project: $projectId" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error accessing Firebase project. Please run 'firebase login' first" -ForegroundColor Red
    exit 1
}

Write-Host "`n3️⃣ Setting up localhost development configuration..." -ForegroundColor Yellow

# Create/update .env.local for development
$envContent = @"
# Firebase Development Configuration (Auto-generated)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ticktokshop-5f1e9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ticktokshop-5f1e9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=155434252666
NEXT_PUBLIC_FIREBASE_APP_ID=1:155434252666:web:fa5051f4cb33f3a784bec3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5BRMHTMXHR

# Development environment
NODE_ENV=development
NEXT_PUBLIC_DEV_MODE=true

# Localhost URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Created .env.local with Firebase configuration" -ForegroundColor Green

Write-Host "`n4️⃣ Windows-specific localhost setup:" -ForegroundColor Yellow
Write-Host "  • Check Windows Firewall settings for Node.js" -ForegroundColor White
Write-Host "  • Ensure no antivirus is blocking Firebase domains" -ForegroundColor White
Write-Host "  • Add localhost to Windows hosts file if needed" -ForegroundColor White

Write-Host "`n5️⃣ Firebase Console setup required:" -ForegroundColor Yellow
Write-Host "  1. Go to Firebase Console: https://console.firebase.google.com/project/$projectId" -ForegroundColor White
Write-Host "  2. Navigate to Authentication > Settings > Authorized domains" -ForegroundColor White
Write-Host "  3. Add these domains if not present:" -ForegroundColor White
Write-Host "     - localhost" -ForegroundColor Cyan
Write-Host "     - 127.0.0.1" -ForegroundColor Cyan
Write-Host "  4. For different ports, also add:" -ForegroundColor White
Write-Host "     - localhost:3000" -ForegroundColor Cyan
Write-Host "     - localhost:3001" -ForegroundColor Cyan

Write-Host "`n6️⃣ Test the setup:" -ForegroundColor Yellow
Write-Host "  • Start development server: npm run dev" -ForegroundColor White
Write-Host "  • Visit: http://localhost:3000/localhost-diagnostic" -ForegroundColor Cyan
Write-Host "  • Run diagnostics to verify Firebase connectivity" -ForegroundColor White

Write-Host "`n7️⃣ Common Windows localhost issues:" -ForegroundColor Yellow
Write-Host "  • Windows Defender SmartScreen may block Firebase" -ForegroundColor White
Write-Host "  • Corporate networks may block Firebase domains" -ForegroundColor White
Write-Host "  • VPN/Proxy settings may interfere" -ForegroundColor White
Write-Host "  • Try running PowerShell as Administrator if issues persist" -ForegroundColor White

Write-Host "`n✅ Localhost Firebase setup complete!" -ForegroundColor Green
Write-Host "If you still have issues, check the diagnostic page for detailed troubleshooting." -ForegroundColor White

# Open Firebase Console for user
$openConsole = Read-Host "`nOpen Firebase Console in browser? (y/n)"
if ($openConsole -eq 'y' -or $openConsole -eq 'Y') {
    Start-Process "https://console.firebase.google.com/project/$projectId/authentication/settings"
}
