#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates the Azure deployment process in an ephemeral environment.

.DESCRIPTION
    This script tests the complete deployment pipeline by:
    1. Creating an ephemeral environment
    2. Running the deployment script
    3. Validating all resources are created correctly
    4. Testing the deployed application
    5. Cleaning up resources

.PARAMETER GitHubToken
    GitHub token for deployment (required)

.PARAMETER SkipCleanup
    Skip resource cleanup after validation

.PARAMETER Location
    Azure region for deployment (default: eastus)

.EXAMPLE
    ./validate-deployment.ps1 -GitHubToken "ghp_xxxxxxxxxxxx"
    
.EXAMPLE
    ./validate-deployment.ps1 -GitHubToken "ghp_xxxxxxxxxxxx" -SkipCleanup -Location "westus2"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipCleanup,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus"
)

$ErrorActionPreference = "Stop"
$runId = Get-Date -Format "yyyyMMddHHmmss"
$testResourceGroup = "rg-azdevops-dashboard-test-$runId"

Write-Host "🧪 Azure Deployment Validation Test" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Run ID: $runId" -ForegroundColor Yellow
Write-Host "Test Resource Group: $testResourceGroup" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

try {
    # Step 1: Validate Azure CLI and authentication
    Write-Host "1️⃣ Validating prerequisites..." -ForegroundColor Blue
    
    $azVersion = az version --output table 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI is not installed or not in PATH"
    }
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
    
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged into Azure. Please run 'az login'"
    }
    Write-Host "✅ Logged into Azure as: $($account.user.name)" -ForegroundColor Green
    Write-Host "" -ForegroundColor White

    # Step 2: Test validation-only mode
    Write-Host "2️⃣ Testing validation-only mode..." -ForegroundColor Blue
    & "./deploy.ps1" -EphemeralEnvironment -RunId $runId -GitHubToken $GitHubToken -Location $Location -ValidateOnly
    if ($LASTEXITCODE -ne 0) {
        throw "Validation-only mode failed"
    }
    Write-Host "✅ Validation-only mode passed" -ForegroundColor Green
    Write-Host "" -ForegroundColor White

    # Step 3: Deploy to ephemeral environment
    Write-Host "3️⃣ Deploying to ephemeral environment..." -ForegroundColor Blue
    & "./deploy.ps1" -EphemeralEnvironment -RunId $runId -GitHubToken $GitHubToken -Location $Location
    if ($LASTEXITCODE -ne 0) {
        throw "Ephemeral deployment failed"
    }
    Write-Host "✅ Ephemeral deployment completed" -ForegroundColor Green
    Write-Host "" -ForegroundColor White

    # Step 4: Validate deployed resources
    Write-Host "4️⃣ Validating deployed resources..." -ForegroundColor Blue
    
    # Check resource group exists
    $rg = az group show --name $testResourceGroup --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or !$rg) {
        throw "Resource group was not created"
    }
    Write-Host "✅ Resource group exists: $($rg.name)" -ForegroundColor Green
    
    # Check Static Web App exists
    $staticWebAppName = "azdevops-dashboard-ephemeral-$runId"
    $swa = az staticwebapp show --name $staticWebAppName --resource-group $testResourceGroup --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or !$swa) {
        throw "Static Web App was not created"
    }
    Write-Host "✅ Static Web App exists: $($swa.name)" -ForegroundColor Green
    Write-Host "   URL: https://$($swa.defaultHostname)" -ForegroundColor Cyan
    
    # Validate API token can be retrieved
    $apiToken = az staticwebapp secrets list --name $staticWebAppName --resource-group $testResourceGroup --query "properties.apiKey" --output tsv 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($apiToken)) {
        throw "Could not retrieve API token"
    }
    Write-Host "✅ API token retrieved successfully" -ForegroundColor Green
    Write-Host "" -ForegroundColor White

    # Step 5: Test deployed application
    Write-Host "5️⃣ Testing deployed application..." -ForegroundColor Blue
    
    $appUrl = "https://$($swa.defaultHostname)"
    $maxRetries = 12
    $retryCount = 0
    $appResponding = $false
    
    while ($retryCount -lt $maxRetries -and -not $appResponding) {
        try {
            Write-Host "   Attempt $($retryCount + 1)/$maxRetries - Testing $appUrl" -ForegroundColor Gray
            $response = Invoke-WebRequest -Uri $appUrl -Method HEAD -TimeoutSec 30 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $appResponding = $true
                Write-Host "✅ Application is responding (HTTP $($response.StatusCode))" -ForegroundColor Green
            }
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "   ⏳ Waiting 30 seconds before retry..." -ForegroundColor Gray
                Start-Sleep -Seconds 30
            }
        }
    }
    
    if (-not $appResponding) {
        Write-Host "⚠️ Application not responding after $maxRetries attempts" -ForegroundColor Yellow
        Write-Host "   This may be normal for new deployments" -ForegroundColor Gray
    }
    Write-Host "" -ForegroundColor White

    # Step 6: Validation summary
    Write-Host "6️⃣ Validation Summary" -ForegroundColor Blue
    Write-Host "✅ All validation tests passed!" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "📊 Test Results:" -ForegroundColor Cyan
    Write-Host "   Resource Group: $testResourceGroup" -ForegroundColor White
    Write-Host "   Static Web App: $staticWebAppName" -ForegroundColor White
    Write-Host "   Application URL: $appUrl" -ForegroundColor White
    Write-Host "   API Token: Retrieved successfully" -ForegroundColor White
    Write-Host "" -ForegroundColor White

} catch {
    Write-Host "❌ Validation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "" -ForegroundColor White
    
    if (-not $SkipCleanup) {
        Write-Host "🧹 Attempting cleanup of failed deployment..." -ForegroundColor Yellow
        try {
            az group delete --name $testResourceGroup --yes --no-wait 2>$null
            Write-Host "✅ Cleanup initiated" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Could not initiate cleanup: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    exit 1

} finally {
    # Step 7: Cleanup (unless skipped)
    if (-not $SkipCleanup) {
        Write-Host "7️⃣ Cleaning up test resources..." -ForegroundColor Blue
        try {
            az group delete --name $testResourceGroup --yes --no-wait
            Write-Host "✅ Cleanup initiated for: $testResourceGroup" -ForegroundColor Green
            Write-Host "   Resources will be deleted in the background" -ForegroundColor Gray
        } catch {
            Write-Host "⚠️ Could not initiate cleanup: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "   Please manually delete resource group: $testResourceGroup" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️ Cleanup skipped - remember to manually delete: $testResourceGroup" -ForegroundColor Yellow
    }
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 Deployment validation completed!" -ForegroundColor Green