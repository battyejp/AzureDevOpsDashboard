param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-azdevops-dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "azdevops-dashboard-prod"
)

Write-Host "🔑 Retrieving Azure Deployment Secrets" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Static Web App: $StaticWebAppName" -ForegroundColor Yellow

try {
    # Check if Azure CLI is installed
    $azVersion = az version --output table 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI is not installed or not in PATH"
    }

    # Check if logged in
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged into Azure. Please run 'az login'" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Logged into Azure as: $($account.user.name)" -ForegroundColor Green

    # Get subscription info
    Write-Host "" -ForegroundColor White
    Write-Host "📋 Azure Subscription Info:" -ForegroundColor Blue
    Write-Host "Subscription ID: $($account.id)" -ForegroundColor Cyan
    Write-Host "Tenant ID: $($account.tenantId)" -ForegroundColor Cyan

    # Get Static Web Apps API token
    Write-Host "" -ForegroundColor White
    Write-Host "🔑 Retrieving Static Web Apps API token..." -ForegroundColor Blue
    $apiToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" --output tsv 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $apiToken) {
        Write-Host "✅ API Token retrieved successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to retrieve API token. Check if the Static Web App exists." -ForegroundColor Red
        $apiToken = "Not found - deploy infrastructure first"
    }

    # Get Static Web App URL
    Write-Host "🌐 Retrieving Static Web App URL..." -ForegroundColor Blue
    $webAppInfo = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName --output json 2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0 -and $webAppInfo) {
        $webAppUrl = "https://" + $webAppInfo.defaultHostname
        Write-Host "✅ URL retrieved successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to retrieve Static Web App info" -ForegroundColor Red
        $webAppUrl = "Not found - deploy infrastructure first"
    }

    # Display all secrets needed for GitHub
    Write-Host "" -ForegroundColor White
    Write-Host "🔐 GitHub Secrets Configuration:" -ForegroundColor Magenta
    Write-Host "=================================" -ForegroundColor Magenta
    Write-Host "" -ForegroundColor White
    
    Write-Host "Required Azure Secrets:" -ForegroundColor Yellow
    Write-Host "AZURE_SUBSCRIPTION_ID: $($account.id)" -ForegroundColor White
    Write-Host "AZURE_TENANT_ID: $($account.tenantId)" -ForegroundColor White
    Write-Host "AZURE_CLIENT_ID: [Get from service principal creation]" -ForegroundColor Gray
    Write-Host "" -ForegroundColor White
    
    Write-Host "Static Web Apps Secret:" -ForegroundColor Yellow
    Write-Host "AZURE_STATIC_WEB_APPS_API_TOKEN: $apiToken" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    
    Write-Host "Application Secrets (customize these):" -ForegroundColor Yellow
    Write-Host "REACT_APP_AZDEVOPS_ORGANIZATION: [Your Azure DevOps org name]" -ForegroundColor Gray
    Write-Host "REACT_APP_API_URL: [Your API URL when deployed]" -ForegroundColor Gray
    Write-Host "" -ForegroundColor White
    
    Write-Host "📱 Application Info:" -ForegroundColor Blue
    Write-Host "Static Web App URL: $webAppUrl" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor White
    
    Write-Host "📋 Next Steps:" -ForegroundColor Green
    Write-Host "1. Copy the secrets above to GitHub Repository Settings > Secrets" -ForegroundColor White
    Write-Host "2. Create a service principal if you haven't already (see DEPLOYMENT_GUIDE.md)" -ForegroundColor White
    Write-Host "3. Update the application secrets with your actual values" -ForegroundColor White
    Write-Host "4. Push to main branch to trigger deployment" -ForegroundColor White

} catch {
    Write-Host "❌ Failed to retrieve secrets: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
