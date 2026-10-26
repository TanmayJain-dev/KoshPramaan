$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting KoshPramaan (कोष-प्रमाण) Full Stack Portal" -ForegroundColor Yellow
Write-Host " AICTE Security Deposit & FDR Portal" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in background
$backendDir = Join-Path $root "backend"
$uvicornExe = Join-Path $backendDir ".venv\Scripts\uvicorn.exe"

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
$backendJob = Start-Process -FilePath $uvicornExe `
    -ArgumentList "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" `
    -WorkingDirectory $backendDir `
    -PassThru

Start-Sleep -Seconds 2

# 2. Start Vite Frontend
$frontendDir = Join-Path $root "frontend"
Write-Host "[2/2] Starting Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Cyan

try {
    Set-Location $frontendDir
    cmd.exe /c "npm.cmd run dev -- --host 127.0.0.1 --port 5173"
}
finally {
    if ($backendJob -and -not $backendJob.HasExited) {
        Write-Host "Stopping backend server..." -ForegroundColor Yellow
        Stop-Process -Id $backendJob.Id -Force
    }
}
