# Start Development Environment
Write-Host "Starting Azure DevOps Dashboard Development Environment..." -ForegroundColor Green

# Start API in background
Write-Host "Starting API server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd 'api\AzDevOpsApi'; dotnet run" -WindowStyle Minimized

# Wait a moment for API to start
Start-Sleep -Seconds 5

# Start React client
Write-Host "Starting React client..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd 'client'; npm start" -WindowStyle Normal

Write-Host "Development environment started!" -ForegroundColor Green
Write-Host "API: http://localhost:5031" -ForegroundColor Cyan
Write-Host "Client: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Yellow
Read-Host
