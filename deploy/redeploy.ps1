#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Redeploy Azure DevOps Dashboard Web App to Azure

.DESCRIPTION
    This script redeploys the Azure DevOps Dashboard using the same configuration
    as the previous deployment. It can be used for updates, fixes, or redeployments.

.PARAMETER Force
    Force redeployment even if resources already exist

.PARAMETER SkipInfrastructure
    Skip infrastructure deployment and only deploy the web application

.PARAMETER ApiUrl
    Override the API URL from the previous deployment

.PARAMETER Environment
    Override the environment from the previous deployment (dev, staging, prod)

.PARAMETER UseMockApi
    Deploy with mock API instead of connecting to real backend (default: true for frontend-only deployment)

.EXAMPLE
    .\redeploy.ps1
    # Redeploy using previous configuration

.EXAMPLE
    .\redeploy.ps1 -Force
    # Force complete redeployment

.EXAMPLE
    .\redeploy.ps1 -SkipInfrastructure
    # Only redeploy the web application

.EXAMPLE
    .\redeploy.ps1 -ApiUrl "https://my-new-api.azurewebsites.net/api"
    # Redeploy with a new API URL
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$Force,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipInfrastructure,
    
    [Parameter(Mandatory = $false)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [bool]$UseMockApi = $true
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Configuration from previous deployment
$DefaultConfig = @{
    Environment = "dev"
    ResourceGroupName = "rg-azdevops-dashboard-dev-uks"
    WebAppName = "azdevops-dashboard-web-dev-br6x2kylgrk3g"
    ApiUrl = "https://your-external-api-url.com/api"
    AppServicePlanSku = "B1"
    Location = "UK South"
}

# Override with provided parameters
if ($Environment) {
    $DefaultConfig.Environment = $Environment
    $DefaultConfig.ResourceGroupName = "rg-azdevops-dashboard-$Environment-uks"
}
if ($ApiUrl) {
    $DefaultConfig.ApiUrl = $ApiUrl
}

Write-Host "🔄 Azure DevOps Dashboard - Redeployment" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Magenta
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "   Environment: $($DefaultConfig.Environment)" -ForegroundColor White
Write-Host "   Resource Group: $($DefaultConfig.ResourceGroupName)" -ForegroundColor White
Write-Host "   Web App: $($DefaultConfig.WebAppName)" -ForegroundColor White
Write-Host "   API URL: $($DefaultConfig.ApiUrl)" -ForegroundColor White
Write-Host "   Location: $($DefaultConfig.Location)" -ForegroundColor White
Write-Host ""

# Check if user is logged into Azure
Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Blue
try {
    $account = az account show --query "name" -o tsv 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Authenticated as: $account" -ForegroundColor Green
}
catch {
    Write-Host "❌ Not authenticated to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Check if resources exist
Write-Host "🔍 Checking existing resources..." -ForegroundColor Blue
$resourcesExist = $false
try {
    $webApp = az webapp show --resource-group $DefaultConfig.ResourceGroupName --name $DefaultConfig.WebAppName --query "name" -o tsv 2>$null
    if ($LASTEXITCODE -eq 0 -and $webApp) {
        $resourcesExist = $true
        Write-Host "✅ Found existing resources" -ForegroundColor Green
    }
}
catch {
    Write-Host "ℹ️  No existing resources found" -ForegroundColor Yellow
}

# Determine what to deploy
$deployInfrastructure = $Force -or -not $resourcesExist -or -not $SkipInfrastructure
$deployWebApp = $true

if ($SkipInfrastructure -and $resourcesExist) {
    $deployInfrastructure = $false
    Write-Host "⏭️  Skipping infrastructure deployment" -ForegroundColor Yellow
}

if ($Force) {
    Write-Host "⚠️  Force flag detected - will redeploy everything" -ForegroundColor Yellow
}

Write-Host ""

# Step 1: Deploy Infrastructure (if needed)
if ($deployInfrastructure) {
    Write-Host "🏗️  STEP 1: Deploying Infrastructure" -ForegroundColor Cyan
    Write-Host "-" * 30 -ForegroundColor Gray
    
    try {
        & "$scriptDir\deploy.ps1" `
            -Environment $DefaultConfig.Environment `
            -ApiUrl $DefaultConfig.ApiUrl `
            -AppServicePlanSku $DefaultConfig.AppServicePlanSku `
            -ResourceGroupName $DefaultConfig.ResourceGroupName `
            -Location $DefaultConfig.Location
        
        if ($LASTEXITCODE -ne 0) {
            throw "Infrastructure deployment failed"
        }
        
        Write-Host "✅ Infrastructure deployment completed!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Infrastructure deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
} else {
    Write-Host "⏭️  STEP 1: Skipping Infrastructure (already exists)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Deploy Web Application
if ($deployWebApp) {
    Write-Host "🚀 STEP 2: Deploying Web Application" -ForegroundColor Cyan
    Write-Host "-" * 30 -ForegroundColor Gray
    
    try {
        & "$scriptDir\deploy-web.ps1" `
            -ResourceGroupName $DefaultConfig.ResourceGroupName `
            -WebAppName $DefaultConfig.WebAppName `
            -UseMockApi $UseMockApi
        
        if ($LASTEXITCODE -ne 0) {
            throw "Web application deployment failed"
        }
        
        Write-Host "✅ Web application deployment completed!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Web application deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 You can retry with:" -ForegroundColor Blue
        Write-Host "   .\deploy-web.ps1 -ResourceGroupName $($DefaultConfig.ResourceGroupName) -WebAppName $($DefaultConfig.WebAppName)" -ForegroundColor White
        exit 1
    }
    
    Write-Host ""
}

# Final Summary
$webAppUrl = "https://$($DefaultConfig.WebAppName).azurewebsites.net"

Write-Host "🎉 REDEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Blue
Write-Host "   Environment: $($DefaultConfig.Environment)" -ForegroundColor White
Write-Host "   Resource Group: $($DefaultConfig.ResourceGroupName)" -ForegroundColor White
Write-Host "   Web App: $($DefaultConfig.WebAppName)" -ForegroundColor White
Write-Host "   API URL: $($DefaultConfig.ApiUrl)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your application is available at:" -ForegroundColor Blue
Write-Host "   $webAppUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 What was deployed:" -ForegroundColor Blue
if ($deployInfrastructure) {
    Write-Host "   ✅ Infrastructure (App Service, Application Insights, etc.)" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  Infrastructure (skipped - already exists)" -ForegroundColor Yellow
}
if ($deployWebApp) {
    Write-Host "   ✅ Web Application (React frontend)" -ForegroundColor Green
}
Write-Host ""
Write-Host "🛠️  Useful Commands:" -ForegroundColor Blue
Write-Host "   # View logs: az webapp log tail --resource-group $($DefaultConfig.ResourceGroupName) --name $($DefaultConfig.WebAppName)" -ForegroundColor Gray
Write-Host "   # Restart app: az webapp restart --resource-group $($DefaultConfig.ResourceGroupName) --name $($DefaultConfig.WebAppName)" -ForegroundColor Gray
Write-Host "   # Update API URL: az webapp config appsettings set --resource-group $($DefaultConfig.ResourceGroupName) --name $($DefaultConfig.WebAppName) --settings REACT_APP_API_URL='https://your-api.com/api'" -ForegroundColor Gray
