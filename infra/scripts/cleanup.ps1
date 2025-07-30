param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-azdevops-dashboard",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

Write-Host "🗑️ Azure Resource Cleanup Script" -ForegroundColor Red
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow

if (-not $Force) {
    Write-Host "" -ForegroundColor White
    Write-Host "⚠️ WARNING: This will DELETE all resources in the resource group!" -ForegroundColor Red
    Write-Host "This action cannot be undone." -ForegroundColor Red
    Write-Host "" -ForegroundColor White
    
    $confirmation = Read-Host "Are you sure you want to continue? Type 'DELETE' to confirm"
    if ($confirmation -ne "DELETE") {
        Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
}

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

    # Check if resource group exists
    $resourceGroup = az group show --name $ResourceGroupName --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ℹ️ Resource group '$ResourceGroupName' does not exist" -ForegroundColor Yellow
        exit 0
    }

    # List resources that will be deleted
    Write-Host "📋 Resources to be deleted:" -ForegroundColor Blue
    az resource list --resource-group $ResourceGroupName --output table

    Write-Host "" -ForegroundColor White
    Write-Host "🗑️ Deleting resource group and all resources..." -ForegroundColor Red
    
    # Delete the resource group
    az group delete --name $ResourceGroupName --yes --no-wait
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deletion initiated successfully" -ForegroundColor Green
        Write-Host "ℹ️ Resources are being deleted in the background" -ForegroundColor Yellow
        Write-Host "ℹ️ Check Azure Portal to monitor deletion progress" -ForegroundColor Yellow
    } else {
        throw "Failed to initiate resource group deletion"
    }

} catch {
    Write-Host "❌ Cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
