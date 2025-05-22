# PowerShell script to verify SuperAdmin route protection
# Check if Node.js is installed
$nodeInstalled = $null
try {
    $nodeInstalled = node --version
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js to run this script." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Verifying SuperAdminRoute protection..." -ForegroundColor Cyan
Write-Host "Running verification script to test access permissions for different user roles..." -ForegroundColor Yellow

# Run the verification script
node .\scripts\verify-superadmin-routes.js

# Check if there are any files that need to be manually tested
Write-Host "`n📋 To manually verify the fix:" -ForegroundColor Green
Write-Host "1. Log in as an admin user"
Write-Host "2. Verify the 'Seller Credit' menu item doesn't appear in the sidebar"
Write-Host "3. Try navigating directly to /dashboard/admin"
Write-Host "4. Confirm you're redirected to /dashboard instead"
Write-Host "5. Log in as a superadmin user"
Write-Host "6. Verify you can access the seller credit page without issues"

Write-Host "`n✅ Verification script completed." -ForegroundColor Green
