# Admin Redirection Fix Deployment Script
# This script deploys the Ticktok application to Vercel
# and provides verification steps for the admin redirection fix

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  ADMIN REDIRECTION FIX DEPLOYMENT & VERIFICATION   " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure all changes are committed before deployment
Write-Host "Checking for uncommitted changes..." -ForegroundColor Yellow
git status --porcelain

$changes = (git status --porcelain)
if ($changes) {
    Write-Host "You have uncommitted changes. Please commit them before deploying." -ForegroundColor Red
    Write-Host "Changes:"
    Write-Host $changes
    
    $shouldContinue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($shouldContinue -ne "y") {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 1
    }
}

# Run the pre-deployment verification
Write-Host "Running pre-deployment verification..." -ForegroundColor Yellow
Write-Host "Checking that all auth redirection logic uses window.location.href:" -ForegroundColor Yellow

# Count the number of redirections using router.push/replace vs window.location.href
$routerPushCount = (Select-String -Path "src\app\**\*.tsx" -Pattern "router\.push\(" | Measure-Object).Count
$routerReplaceCount = (Select-String -Path "src\app\**\*.tsx" -Pattern "router\.replace\(" | Measure-Object).Count
$windowLocationCount = (Select-String -Path "src\app\**\*.tsx" -Pattern "window\.location\.href" | Measure-Object).Count

Write-Host "Found $routerPushCount router.push() calls" -ForegroundColor $(if ($routerPushCount -gt 0) { "Yellow" } else { "Green" })
Write-Host "Found $routerReplaceCount router.replace() calls" -ForegroundColor $(if ($routerReplaceCount -gt 0) { "Yellow" } else { "Green" })
Write-Host "Found $windowLocationCount window.location.href calls" -ForegroundColor Green

# Execute the deployment to Vercel
Write-Host "`nDeploying to Vercel..." -ForegroundColor Yellow
# Call the existing deployment script
& "$PSScriptRoot\pre-deploy-vercel.ps1"
& "$PSScriptRoot\deploy-to-vercel.ps1"

Write-Host "`nDeployment completed!" -ForegroundColor Green

# Verification instructions
Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION STEPS FOR ADMIN REDIRECTION FIX   " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open your deployed Vercel URL in an incognito/private window" -ForegroundColor White
Write-Host "2. Log in with an admin user account" -ForegroundColor White
Write-Host "3. Check if you're automatically redirected to /dashboard/admin" -ForegroundColor White
Write-Host "4. If not, try running the verification script in browser console:" -ForegroundColor White
Write-Host "   - Open browser console (F12)" -ForegroundColor White
Write-Host "   - Copy and paste the contents of scripts\verify-admin-redirect.js" -ForegroundColor White
Write-Host "   - Press Enter to run the script" -ForegroundColor White
Write-Host ""
Write-Host "5. If redirection is still failing, check browser console for errors" -ForegroundColor White
Write-Host "6. Try accessing these debug endpoints:" -ForegroundColor White
Write-Host "   - /api/debug/check-admin-redirect" -ForegroundColor White
Write-Host "   - /dashboard/debug/admin-redirect-test" -ForegroundColor White
Write-Host "   - /dashboard/debug/auth-debug" -ForegroundColor White
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
