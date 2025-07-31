#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Azure DevOps Dashboard web application to Azure App Service

.DESCRIPTION
    This script builds and deploys the React frontend application to an existing
    Azure App Service. The App Service must already exist.

.PARAMETER ResourceGroupName
    The name of the resource group containing the web app

.PARAMETER WebAppName
    The name of the Azure App Service to deploy to

.EXAMPLE
    .\deploy-web.ps1 -ResourceGroupName "rg-myapp-dev" -WebAppName "myapp-web-dev-abc123"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$WebAppName
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get script directory and workspace root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $scriptDir
$clientDir = Join-Path $workspaceRoot "client"

Write-Host "🚀 Deploying web application..." -ForegroundColor Blue
Write-Host "   Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "   Web App Name: $WebAppName" -ForegroundColor White
Write-Host "   Client Directory: $clientDir" -ForegroundColor White
Write-Host ""

# Verify client directory exists
if (-not (Test-Path $clientDir)) {
    Write-Host "❌ Client directory not found: $clientDir" -ForegroundColor Red
    exit 1
}

# Verify package.json exists
$packageJsonPath = Join-Path $clientDir "package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Host "❌ package.json not found in client directory" -ForegroundColor Red
    exit 1
}

# Change to client directory
Push-Location $clientDir

try {
    # Check if web app exists
    Write-Host "🔍 Verifying web app exists..." -ForegroundColor Blue
    $webApp = az webapp show --resource-group $ResourceGroupName --name $WebAppName --query "name" --output tsv 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $webApp) {
        throw "Web app '$WebAppName' not found in resource group '$ResourceGroupName'"
    }
    Write-Host "✅ Web app found: $webApp" -ForegroundColor Green

    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

    # Build the application
    Write-Host "🔨 Building React application..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm build failed"
    }
    Write-Host "✅ Build completed successfully" -ForegroundColor Green

    # Verify build directory exists
    $buildDir = Join-Path $clientDir "build"
    if (-not (Test-Path $buildDir)) {
        throw "Build directory not found after build"
    }

    # Create deployment package
    Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
    $zipPath = Join-Path $clientDir "deploy.zip"
    $tempDeployDir = Join-Path $clientDir "temp-deploy"
    
    # Remove existing files if they exist
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    if (Test-Path $tempDeployDir) {
        Remove-Item $tempDeployDir -Recurse -Force
    }

    # Create temporary deployment directory
    New-Item -ItemType Directory -Path $tempDeployDir -Force | Out-Null
    
    # Copy build files to temp directory
    Copy-Item -Path "$buildDir\*" -Destination $tempDeployDir -Recurse -Force
    
    # Copy server files
    Copy-Item -Path (Join-Path $clientDir "server.js") -Destination $tempDeployDir -Force
    Copy-Item -Path (Join-Path $clientDir "package.json") -Destination $tempDeployDir -Force
    
    # Create web.config for Azure App Service
    $webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>
"@
    $webConfig | Out-File -FilePath (Join-Path $tempDeployDir "web.config") -Encoding UTF8

    # Create zip file from temp directory
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDeployDir, $zipPath)
    
    # Clean up temp directory
    Remove-Item $tempDeployDir -Recurse -Force
    
    if (-not (Test-Path $zipPath)) {
        throw "Failed to create deployment package"
    }
    Write-Host "✅ Deployment package created: $zipPath" -ForegroundColor Green

    # Deploy to Azure App Service
    Write-Host "🚀 Deploying to Azure App Service..." -ForegroundColor Blue
    az webapp deployment source config-zip `
        --resource-group $ResourceGroupName `
        --name $WebAppName `
        --src $zipPath
    
    if ($LASTEXITCODE -ne 0) {
        throw "Azure deployment failed"
    }
    Write-Host "✅ Deployment to Azure completed successfully" -ForegroundColor Green

    # Clean up deployment package
    Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
    Remove-Item $zipPath -Force
    Write-Host "✅ Cleanup completed" -ForegroundColor Green

    # Get web app URL
    $webAppUrl = az webapp show --resource-group $ResourceGroupName --name $WebAppName --query "defaultHostName" --output tsv
    if ($webAppUrl) {
        Write-Host ""
        Write-Host "🌐 Application deployed successfully!" -ForegroundColor Green
        Write-Host "   URL: https://$webAppUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Note: It may take a few minutes for the application to start up." -ForegroundColor Blue
    }
}
catch {
    Write-Host "❌ Web application deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Return to original directory
    Pop-Location
}

Write-Host ""
