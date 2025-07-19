# Stop Development Environment
Write-Host "Stopping Azure DevOps Dashboard Development Environment..." -ForegroundColor Red

# Stop API processes
Write-Host "Stopping API server..." -ForegroundColor Yellow
Get-Process -Name "AzDevOpsApi" -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop Node processes (React dev server)
Write-Host "Stopping React client..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

Write-Host "Development environment stopped!" -ForegroundColor Green
