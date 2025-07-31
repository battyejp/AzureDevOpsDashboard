#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploys Azure DevOps Dashboard infrastructure to Azure.

.DESCRIPTION
    This script deploys the Azure DevOps Dashboard application infrastructure including:
    - Resource Group
    - Static Web App
    - Required configurations for GitHub integration
    
    Supports ephemeral environments for testing and validation-only mode for dry runs.

.PARAMETER Environment
    The deployment environment (prod, staging, dev). Default: prod

.PARAMETER ResourceGroupName
    Custom resource group name. If not provided, generates name based on environment.

.PARAMETER Location
    Azure region for deployment. Default: eastus

.PARAMETER GitHubToken
    GitHub token for Static Web App deployment integration (required)

.PARAMETER EphemeralEnvironment
    Enable ephemeral environment mode for testing

.PARAMETER RunId
    Custom identifier for ephemeral environments

.PARAMETER ValidateOnly
    Run validation without deploying resources

.EXAMPLE
    ./deploy.ps1 -GitHubToken "ghp_xxxxxxxxxxxx"
    Deploys to production environment
    
.EXAMPLE
    ./deploy.ps1 -Environment staging -GitHubToken "ghp_xxxxxxxxxxxx"
    Deploys to staging environment
    
.EXAMPLE
    ./deploy.ps1 -EphemeralEnvironment -GitHubToken "ghp_xxxxxxxxxxxx"
    Deploys to ephemeral test environment
    
.EXAMPLE
    ./deploy.ps1 -ValidateOnly -GitHubToken "ghp_xxxxxxxxxxxx"
    Validates templates without deployment
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [switch]$EphemeralEnvironment,
    
    [Parameter(Mandatory=$false)]
    [string]$RunId = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$ValidateOnly
)

Write-Host "🚀 Starting Azure deployment..." -ForegroundColor Green

# Setup environment-specific configuration
if ($EphemeralEnvironment) {
    if ([string]::IsNullOrEmpty($RunId)) {
        $RunId = Get-Date -Format "yyyyMMddHHmmss"
    }
    $Environment = "ephemeral-$RunId"
    Write-Host "🧪 Ephemeral environment mode enabled" -ForegroundColor Cyan
}

# Set default resource group name if not provided
if ([string]::IsNullOrEmpty($ResourceGroupName)) {
    $ResourceGroupName = "rg-azdevops-dashboard-$Environment"
}

Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
if ($ValidateOnly) {
    Write-Host "Mode: VALIDATION ONLY" -ForegroundColor Magenta
}

try {
    # Check if Azure CLI is installed
    $azVersion = az version --output table 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI is not installed or not in PATH"
    }
    Write-Host "✅ Azure CLI found" -ForegroundColor Green

    # Check if logged in
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged into Azure. Please run 'az login'" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Logged into Azure as: $($account.user.name)" -ForegroundColor Green

    # Create resource group
    Write-Host "📦 Creating resource group..." -ForegroundColor Blue
    if ($ValidateOnly) {
        Write-Host "✅ VALIDATION: Resource group creation would succeed" -ForegroundColor Green
    } else {
        az group create --name $ResourceGroupName --location $Location --tags Environment=$Environment Application=azdevops-dashboard
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Resource group created/updated" -ForegroundColor Green
        } else {
            throw "Failed to create resource group"
        }
    }

    # Validate Bicep template
    Write-Host "🔍 Validating Bicep template..." -ForegroundColor Blue
    $validationResult = az deployment group validate `
        --resource-group $ResourceGroupName `
        --template-file "../main.bicep" `
        --parameters environment=$Environment `
        --parameters repositoryUrl="https://github.com/battyejp/AzureDevOpsDashboard" `
        --parameters repositoryToken="$GitHubToken" `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Bicep template validation successful" -ForegroundColor Green
    } else {
        throw "Bicep template validation failed"
    }

    if ($ValidateOnly) {
        Write-Host "✅ VALIDATION COMPLETE: All checks passed" -ForegroundColor Green
        Write-Host "📋 Resources that would be created:" -ForegroundColor Cyan
        Write-Host "  - Resource Group: $ResourceGroupName" -ForegroundColor White
        Write-Host "  - Static Web App: azdevops-dashboard-$Environment" -ForegroundColor White
        return
    }

    # Deploy infrastructure
    Write-Host "🏗️ Deploying infrastructure..." -ForegroundColor Blue
    $deploymentName = "azdevops-dashboard-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $deploymentResult = az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file "../main.bicep" `
        --parameters environment=$Environment `
        --parameters repositoryUrl="https://github.com/battyejp/AzureDevOpsDashboard" `
        --parameters repositoryToken="$GitHubToken" `
        --name $deploymentName `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
        
        # Validate deployment outputs
        Write-Host "🔍 Validating deployment outputs..." -ForegroundColor Blue
        $staticWebAppName = $deploymentResult.properties.outputs.staticWebAppName.value
        $staticWebAppUrl = $deploymentResult.properties.outputs.staticWebAppUrl.value
        $staticWebAppToken = $deploymentResult.properties.outputs.staticWebAppToken.value
        $resourceGroupName = $deploymentResult.properties.outputs.resourceGroupName.value
        
        # Validate required outputs
        $validationErrors = @()
        if ([string]::IsNullOrEmpty($staticWebAppName)) {
            $validationErrors += "Static Web App name is missing"
        }
        if ([string]::IsNullOrEmpty($staticWebAppUrl)) {
            $validationErrors += "Static Web App URL is missing"
        }
        if ([string]::IsNullOrEmpty($staticWebAppToken)) {
            $validationErrors += "Static Web App token is missing"
        }
        if ([string]::IsNullOrEmpty($resourceGroupName)) {
            $validationErrors += "Resource group name is missing"
        }
        
        if ($validationErrors.Count -gt 0) {
            Write-Host "❌ Deployment output validation failed:" -ForegroundColor Red
            foreach ($error in $validationErrors) {
                Write-Host "  - $error" -ForegroundColor Red
            }
            throw "Deployment outputs are incomplete"
        }
        
        Write-Host "✅ All deployment outputs validated successfully" -ForegroundColor Green
        
        Write-Host "" -ForegroundColor White
        Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
        Write-Host "Static Web App Name: $staticWebAppName" -ForegroundColor Cyan
        Write-Host "URL: https://$staticWebAppUrl" -ForegroundColor Cyan
        Write-Host "Resource Group: $resourceGroupName" -ForegroundColor Cyan
        Write-Host "" -ForegroundColor White
        
        # Verify Static Web App is accessible
        Write-Host "🌐 Verifying Static Web App accessibility..." -ForegroundColor Blue
        try {
            $response = Invoke-WebRequest -Uri "https://$staticWebAppUrl" -Method HEAD -TimeoutSec 30 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Static Web App is accessible" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Static Web App returned status code: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ Could not verify Static Web App accessibility: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "   This is normal for new deployments - the app may take a few minutes to become available" -ForegroundColor Gray
        }
        
        # API token verification (moved from later section)
        Write-Host "🔑 Verifying API token..." -ForegroundColor Blue
        if ($staticWebAppToken -and $staticWebAppToken -ne "null") {
            Write-Host "✅ API Token retrieved from deployment outputs" -ForegroundColor Green
            Write-Host "" -ForegroundColor White
            Write-Host "🔐 Add this as AZURE_STATIC_WEB_APPS_API_TOKEN secret in GitHub:" -ForegroundColor Yellow
            Write-Host $staticWebAppToken -ForegroundColor White
            Write-Host "" -ForegroundColor White
        } else {
            Write-Host "⚠️ Could not retrieve API token from deployment outputs" -ForegroundColor Yellow
            Write-Host "🔑 Attempting to retrieve API token directly..." -ForegroundColor Blue
            $apiToken = az staticwebapp secrets list --name $staticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" --output tsv
            
            if ($LASTEXITCODE -eq 0 -and $apiToken) {
                Write-Host "✅ API Token retrieved directly" -ForegroundColor Green
                Write-Host "" -ForegroundColor White
                Write-Host "🔐 Add this as AZURE_STATIC_WEB_APPS_API_TOKEN secret in GitHub:" -ForegroundColor Yellow
                Write-Host $apiToken -ForegroundColor White
                Write-Host "" -ForegroundColor White
            } else {
                Write-Host "⚠️ Could not retrieve API token automatically" -ForegroundColor Yellow
            }
        }
        
        Write-Host "📋 Next Steps:" -ForegroundColor Magenta
        if ($EphemeralEnvironment) {
            Write-Host "1. This is an ephemeral environment for testing" -ForegroundColor White
            Write-Host "2. Visit your deployed application at: https://$staticWebAppUrl" -ForegroundColor White
            Write-Host "3. Run validation tests against the deployment" -ForegroundColor White
            Write-Host "4. Clean up resources when testing is complete using cleanup.ps1" -ForegroundColor White
            Write-Host "" -ForegroundColor White
            Write-Host "⚠️ Remember to clean up this ephemeral environment:" -ForegroundColor Yellow
            Write-Host "   ./cleanup.ps1 -ResourceGroupName '$ResourceGroupName' -Force" -ForegroundColor Gray
        } else {
            Write-Host "1. Add the API token as a GitHub secret" -ForegroundColor White
            Write-Host "2. Push to main branch to trigger automatic deployment" -ForegroundColor White
            Write-Host "3. Visit your deployed application at: https://$staticWebAppUrl" -ForegroundColor White
        }
        
    } else {
        throw "Infrastructure deployment failed"
    }

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
