# Simple Firebase Network Test
Write-Host "Firebase Network Test" -ForegroundColor Yellow

# Test basic connectivity
Write-Host "Testing internet connection..."
$ping = Test-NetConnection -ComputerName "google.com" -Port 443 -InformationLevel Quiet
if ($ping) {
    Write-Host "✅ Internet: OK" -ForegroundColor Green
}
else {
    Write-Host "❌ Internet: Failed" -ForegroundColor Red
}

# Test Firebase endpoints
Write-Host "Testing Firebase endpoints..."
$endpoints = @("firebase.googleapis.com", "identitytoolkit.googleapis.com")
foreach ($endpoint in $endpoints) {
    $test = Test-NetConnection -ComputerName $endpoint -Port 443 -InformationLevel Quiet
    if ($test) {
        Write-Host "✅ $endpoint : OK" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $endpoint : Failed" -ForegroundColor Red
    }
}

Write-Host "Test complete. If any endpoints failed, check firewall/antivirus settings."
