# Check Development Environment Status
Write-Host "Azure DevOps Dashboard - Status Check" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check API Process
$apiProcess = Get-Process -Name "AzDevOpsApi" -ErrorAction SilentlyContinue
if ($apiProcess) {
    Write-Host "✅ API Server: Running (PID: $($apiProcess.Id))" -ForegroundColor Green
    
    # Test API endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5031/api/projects" -TimeoutSec 5
        $projectCount = $response.Count
        Write-Host "✅ API Endpoint: Responding ($projectCount projects found)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ API Endpoint: Not responding" -ForegroundColor Red
    }
} else {
    Write-Host "❌ API Server: Not running" -ForegroundColor Red
}

# Check React Process
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ React Client: Running ($($nodeProcesses.Count) Node.js processes)" -ForegroundColor Green
    
    # Check if port 3000 is listening
    $port3000 = netstat -an | findstr ":3000.*LISTENING"
    if ($port3000) {
        Write-Host "✅ React Port 3000: Listening" -ForegroundColor Green
    } else {
        Write-Host "❌ React Port 3000: Not listening" -ForegroundColor Red
    }
} else {
    Write-Host "❌ React Client: Not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "API:      http://localhost:5031" -ForegroundColor White
Write-Host "API Docs: http://localhost:5031/swagger" -ForegroundColor White
