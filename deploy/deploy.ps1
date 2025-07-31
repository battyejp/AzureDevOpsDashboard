#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Azure DevOps Dashboard infrastructure to Azure using Bicep

.DESCRIPTION
    This script deploys the Azure infrastructure for the Azure DevOps Dashboard
    using Azure Bicep templates.

.PARAMETER Environment
    The environment to deploy to (dev, staging, prod)

.PARAMETER ApiUrl
    The external API URL endpoint

.PARAMETER AppServicePlanSku
    The SKU for the App Service Plan (F1, B1, B2, etc.)

.PARAMETER ResourceGroupName
    The name of the resource group to deploy to

.PARAMETER Location
    The Azure region to deploy to

.EXAMPLE
    .\deploy.ps1 -Environment "dev" -ApiUrl "https://api.example.com/api" -ResourceGroupName "rg-myapp-dev"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("F1", "B1", "B2", "B3", "S1", "S2", "S3", "P1V2", "P2V2", "P3V2")]
    [string]$AppServicePlanSku = "B1",
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "UK South"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🏗️  Deploying Azure infrastructure..." -ForegroundColor Blue
Write-Host "   Environment: $Environment" -ForegroundColor White
Write-Host "   Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "   Location: $Location" -ForegroundColor White
Write-Host "   API URL: $ApiUrl" -ForegroundColor White
Write-Host "   App Service Plan SKU: $AppServicePlanSku" -ForegroundColor White
Write-Host ""

# Check if resource group exists, create if not
Write-Host "🔍 Checking resource group..." -ForegroundColor Blue
$rgExists = az group exists --name $ResourceGroupName --output tsv
if ($rgExists -eq "false") {
    Write-Host "📦 Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create resource group"
    }
    Write-Host "✅ Resource group created successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group already exists" -ForegroundColor Green
}

# Deploy Bicep template
Write-Host "🚀 Deploying Bicep template..." -ForegroundColor Blue
$deploymentName = "azdevops-dashboard-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

try {
    $deployment = az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file "$scriptDir\main.bicep" `
        --parameters environment=$Environment `
        --parameters apiUrl=$ApiUrl `
        --parameters appServicePlanSku=$AppServicePlanSku `
        --parameters location=$Location `
        --name $deploymentName `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        throw "Bicep deployment failed"
    }

    Write-Host "✅ Infrastructure deployment completed successfully!" -ForegroundColor Green
    
    # Output deployment results
    $outputs = $deployment.properties.outputs
    if ($outputs) {
        Write-Host ""
        Write-Host "📋 Deployment Outputs:" -ForegroundColor Blue
        if ($outputs.webAppName) {
            Write-Host "   Web App Name: $($outputs.webAppName.value)" -ForegroundColor White
        }
        if ($outputs.webAppUrl) {
            Write-Host "   Web App URL: $($outputs.webAppUrl.value)" -ForegroundColor White
        }
        if ($outputs.resourceGroupName) {
            Write-Host "   Resource Group: $($outputs.resourceGroupName.value)" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "❌ Infrastructure deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get deployment error details
    Write-Host "🔍 Getting deployment error details..." -ForegroundColor Yellow
    try {
        az deployment group show --resource-group $ResourceGroupName --name $deploymentName --query "properties.error" --output table
    }
    catch {
        Write-Host "Could not retrieve deployment error details" -ForegroundColor Gray
    }
    
    exit 1
}

Write-Host ""
