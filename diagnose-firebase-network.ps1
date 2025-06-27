# Firebase Network Diagnostic and Fix Script for Windows
# Run as Administrator for best results

Write-Host "🔥 Firebase Network Diagnostic Script" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator. Some fixes may not work." -ForegroundColor Yellow
    Write-Host "Consider running PowerShell as Administrator for full functionality." -ForegroundColor Yellow
    Write-Host ""
}

# Test 1: Basic network connectivity
Write-Host "1️⃣ Testing basic network connectivity..." -ForegroundColor Cyan
try {
    $google = Test-NetConnection -ComputerName "google.com" -Port 443 -InformationLevel Quiet
    if ($google) {
        Write-Host "✅ Internet connectivity: OK" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Internet connectivity: FAILED" -ForegroundColor Red
        Write-Host "Please check your internet connection before proceeding." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Network test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Firebase endpoints
Write-Host ""
Write-Host "2️⃣ Testing Firebase endpoints..." -ForegroundColor Cyan
$firebaseEndpoints = @(
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com", 
    "firestore.googleapis.com",
    "accounts.google.com"
)

$failedEndpoints = @()
foreach ($endpoint in $firebaseEndpoints) {
    try {
        $test = Test-NetConnection -ComputerName $endpoint -Port 443 -InformationLevel Quiet
        if ($test) {
            Write-Host "✅ $endpoint : Reachable" -ForegroundColor Green
        }
        else {
            Write-Host "❌ $endpoint : Not reachable" -ForegroundColor Red
            $failedEndpoints += $endpoint
        }
    }
    catch {
        Write-Host "❌ $endpoint : Error - $($_.Exception.Message)" -ForegroundColor Red
        $failedEndpoints += $endpoint
    }
}

# Test 3: DNS Resolution
Write-Host ""
Write-Host "3️⃣ Testing DNS resolution..." -ForegroundColor Cyan
try {
    $dnsTest = Resolve-DnsName -Name "firebase.googleapis.com" -Type A
    if ($dnsTest) {
        Write-Host "✅ DNS resolution: OK" -ForegroundColor Green
        Write-Host "   Firebase resolves to: $($dnsTest[0].IPAddress)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try flushing DNS cache: ipconfig /flushdns" -ForegroundColor Yellow
}

# Test 4: Windows Firewall
Write-Host ""
Write-Host "4️⃣ Checking Windows Firewall..." -ForegroundColor Cyan
try {
    $firewallProfiles = Get-NetFirewallProfile
    $enabledProfiles = $firewallProfiles | Where-Object { $_.Enabled -eq $true }
    
    if ($enabledProfiles.Count -gt 0) {
        Write-Host "⚠️  Windows Firewall is enabled on $($enabledProfiles.Count) profile(s)" -ForegroundColor Yellow
        Write-Host "   This might block Firebase connections." -ForegroundColor Yellow
        
        # Check if Node.js is allowed
        $nodeRules = Get-NetFirewallApplicationFilter | Where-Object { $_.Program -like "*node*" }
        if ($nodeRules.Count -eq 0) {
            Write-Host "❌ Node.js not found in firewall rules" -ForegroundColor Red
            Write-Host "💡 Add Node.js to Windows Firewall exceptions" -ForegroundColor Yellow
        }
        else {
            Write-Host "✅ Node.js found in firewall rules" -ForegroundColor Green
        }
    }
    else {
        Write-Host "✅ Windows Firewall is disabled" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Could not check firewall status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Proxy settings
Write-Host ""
Write-Host "5️⃣ Checking proxy settings..." -ForegroundColor Cyan
try {
    $proxySettings = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
    if ($proxySettings.ProxyEnable -eq 1) {
        Write-Host "⚠️  Proxy is enabled: $($proxySettings.ProxyServer)" -ForegroundColor Yellow
        Write-Host "   This might interfere with Firebase connections." -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ No proxy configured" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Could not check proxy settings: $($_.Exception.Message)" -ForegroundColor Red
}

# Automatic fixes
Write-Host ""
Write-Host "🛠️ Automatic fixes..." -ForegroundColor Cyan

# Fix 1: Flush DNS cache
Write-Host "Flushing DNS cache..."
try {
    ipconfig /flushdns | Out-Null
    Write-Host "✅ DNS cache flushed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to flush DNS cache" -ForegroundColor Red
}

# Fix 2: Reset network stack (if admin)
if ($isAdmin) {
    Write-Host "Resetting network stack..."
    try {
        netsh winsock reset | Out-Null
        Write-Host "✅ Network stack reset (restart required)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to reset network stack" -ForegroundColor Red
    }
}

# Summary and recommendations
Write-Host ""
Write-Host "📋 Summary and Recommendations:" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

if ($failedEndpoints.Count -gt 0) {
    Write-Host "❌ Failed to reach Firebase endpoints:" -ForegroundColor Red
    foreach ($endpoint in $failedEndpoints) {
        Write-Host "   - $endpoint" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔧 Recommended actions:" -ForegroundColor Yellow
    Write-Host "1. Temporarily disable Windows Firewall and test again" -ForegroundColor White
    Write-Host "2. Disable antivirus software temporarily" -ForegroundColor White
    Write-Host "3. Try using mobile hotspot" -ForegroundColor White
    Write-Host "4. Contact your network administrator" -ForegroundColor White
    Write-Host "5. Check if your ISP blocks Google/Firebase services" -ForegroundColor White
}
else {
    Write-Host "✅ All Firebase endpoints are reachable" -ForegroundColor Green
    Write-Host "The network issue might be application-specific." -ForegroundColor White
    Write-Host ""
    Write-Host "Try running: node test-firebase-network.mjs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed troubleshooting, see: NETWORK_REQUEST_FAILED_FIX.md" -ForegroundColor Cyan
