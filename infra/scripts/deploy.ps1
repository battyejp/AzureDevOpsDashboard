param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-azdevops-dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken
)

Write-Host "🚀 Starting Azure deployment..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow

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
    az group create --name $ResourceGroupName --location $Location --tags Environment=$Environment Application=azdevops-dashboard
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Resource group created/updated" -ForegroundColor Green
    } else {
        throw "Failed to create resource group"
    }

    # Deploy infrastructure
    Write-Host "🏗️ Deploying infrastructure..." -ForegroundColor Blue
    $deploymentResult = az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file "../main.bicep" `
        --parameters environment=$Environment `
        --parameters repositoryUrl="https://github.com/battyejp/AzureDevOpsDashboard" `
        --parameters repositoryToken="$GitHubToken" `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
        
        # Extract outputs
        $staticWebAppName = $deploymentResult.properties.outputs.staticWebAppName.value
        $staticWebAppUrl = "https://" + $deploymentResult.properties.outputs.staticWebAppUrl.value
        
        Write-Host "" -ForegroundColor White
        Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
        Write-Host "Static Web App Name: $staticWebAppName" -ForegroundColor Cyan
        Write-Host "URL: $staticWebAppUrl" -ForegroundColor Cyan
        Write-Host "" -ForegroundColor White
        
        # Get API token for Static Web Apps
        Write-Host "🔑 Retrieving Static Web Apps API token..." -ForegroundColor Blue
        $apiToken = az staticwebapp secrets list --name $staticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" --output tsv
        
        if ($LASTEXITCODE -eq 0 -and $apiToken) {
            Write-Host "✅ API Token retrieved" -ForegroundColor Green
            Write-Host "" -ForegroundColor White
            Write-Host "🔐 Add this as AZURE_STATIC_WEB_APPS_API_TOKEN secret in GitHub:" -ForegroundColor Yellow
            Write-Host $apiToken -ForegroundColor White
            Write-Host "" -ForegroundColor White
        } else {
            Write-Host "⚠️ Could not retrieve API token automatically" -ForegroundColor Yellow
        }
        
        Write-Host "📋 Next Steps:" -ForegroundColor Magenta
        Write-Host "1. Add the API token as a GitHub secret" -ForegroundColor White
        Write-Host "2. Push to main branch to trigger automatic deployment" -ForegroundColor White
        Write-Host "3. Visit your deployed application at: $staticWebAppUrl" -ForegroundColor White
        
    } else {
        throw "Infrastructure deployment failed"
    }

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
