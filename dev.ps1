# One-command developer launcher for KoshPramaan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting KoshPramaan (कोष-प्रमाण) Full Stack Portal" -ForegroundColor Yellow
Write-Host " AICTE Security Deposit & FDR Portal" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend FastAPI
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
$backendJob = Start-Process -FilePath "backend\.venv\Scripts\uvicorn.exe" -ArgumentList "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" -PassThru

Start-Sleep -Seconds 2

# 2. Start Frontend Vite
Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
Set-Location frontend
cmd.exe /c "npm.cmd run dev"

# Cleanup when stopped
Stop-Process -Id $backendJob.Id -Force
