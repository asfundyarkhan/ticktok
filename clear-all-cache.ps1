# Comprehensive Cache Clearing Script for Windows PowerShell
# Run this script to clear all server-side and build caches

Write-Host "🧹 Starting comprehensive cache clearing..." -ForegroundColor Green

# Change to project directory
Set-Location "c:\Ticktok\ticktok"

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Blue

# 1. Clear Next.js build cache
Write-Host "🔄 Clearing Next.js build cache..." -ForegroundColor Yellow
try {
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next" -ErrorAction Stop
        Write-Host "✅ .next directory removed" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  .next directory doesn't exist" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Failed to remove .next directory: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Clear npm cache
Write-Host "🔄 Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✅ npm cache cleared" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to clear npm cache: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Verify npm cache
Write-Host "🔍 Verifying npm cache..." -ForegroundColor Yellow
npm cache verify

# 4. Clear node_modules cache directories
Write-Host "🔄 Clearing node_modules cache..." -ForegroundColor Yellow
$cachePaths = @(
    "node_modules\.cache",
    "node_modules\.next",
    "node_modules\@next",
    "node_modules\.bin\.cache"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "✅ Removed $path" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to remove $path" -ForegroundColor Red
        }
    }
}

# 5. Clear TypeScript cache
Write-Host "🔄 Clearing TypeScript cache..." -ForegroundColor Yellow
$tscachePaths = @(
    "tsconfig.tsbuildinfo",
    ".tsbuildinfo"
)

foreach ($path in $tscachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Force $path -ErrorAction Stop
            Write-Host "✅ Removed $path" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to remove $path" -ForegroundColor Red
        }
    }
}

# 6. Clear ESLint cache
Write-Host "🔄 Clearing ESLint cache..." -ForegroundColor Yellow
if (Test-Path ".eslintcache") {
    try {
        Remove-Item -Force ".eslintcache" -ErrorAction Stop
        Write-Host "✅ ESLint cache cleared" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to clear ESLint cache" -ForegroundColor Red
    }
}

# 7. Fresh build
Write-Host "🔨 Creating fresh build..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Fresh build completed successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Cache clearing completed!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Blue
Write-Host "   ✅ Next.js build cache cleared" -ForegroundColor Gray
Write-Host "   ✅ npm cache cleared and verified" -ForegroundColor Gray
Write-Host "   ✅ node_modules cache cleared" -ForegroundColor Gray
Write-Host "   ✅ TypeScript cache cleared" -ForegroundColor Gray
Write-Host "   ✅ ESLint cache cleared" -ForegroundColor Gray
Write-Host "   ✅ Fresh build created" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "🌐 For client-side cache clearing:" -ForegroundColor Blue
Write-Host "   1. Open your browser's developer tools (F12)" -ForegroundColor Gray
Write-Host "   2. Go to Application/Storage tab" -ForegroundColor Gray
Write-Host "   3. Click 'Clear storage' or use the provided clear-client-cache.js script" -ForegroundColor Gray
Write-Host "   4. Hard refresh the page (Ctrl+Shift+R)" -ForegroundColor Gray
