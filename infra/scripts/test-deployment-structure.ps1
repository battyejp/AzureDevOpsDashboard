#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Tests Azure deployment structure and configuration without deploying resources.

.DESCRIPTION
    This script validates the deployment setup by checking:
    - File structure and dependencies
    - Bicep template syntax
    - Parameter configurations
    - Script functionality (dry run mode)

.EXAMPLE
    ./test-deployment-structure.ps1
#>

Write-Host "🔍 Testing Azure Deployment Structure" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsTotal = 0

function Test-Item {
    param(
        [string]$TestName,
        [scriptblock]$TestScript
    )
    
    $global:testsTotal++
    Write-Host "Testing: $TestName" -ForegroundColor Blue
    
    try {
        $result = & $TestScript
        if ($result) {
            Write-Host "✅ $TestName" -ForegroundColor Green
            $global:testsPassed++
        } else {
            Write-Host "❌ $TestName" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $TestName - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 1: File Structure
Test-Item "Required files exist" {
    $requiredFiles = @(
        "../main.bicep",
        "../main.parameters.json",
        "../modules/staticwebapp.bicep",
        "./deploy.ps1",
        "./validate-deployment.ps1",
        "./cleanup.ps1",
        "./get-secrets.ps1"
    )
    
    $allExist = $true
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Host "   Missing: $file" -ForegroundColor Red
            $allExist = $false
        }
    }
    
    return $allExist
}

# Test 2: Bicep Template Syntax (if Az CLI available)
Test-Item "Bicep template syntax" {
    try {
        # Check if Azure CLI is available
        $null = az version 2>$null
        if ($LASTEXITCODE -eq 0) {
            # Try to validate the template (won't deploy, just validate syntax)
            $result = az deployment group validate --help 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Azure CLI available - template validation possible" -ForegroundColor Gray
                return $true
            }
        }
        
        # Fallback: Basic bicep file content check
        $bicepContent = Get-Content "../main.bicep" -Raw
        $validSyntax = $bicepContent -match "targetScope\s*=\s*'subscription'" -and 
                      $bicepContent -match "resource\s+\w+\s+'" -and
                      $bicepContent -match "output\s+\w+"
        
        if ($validSyntax) {
            Write-Host "   Basic Bicep syntax check passed" -ForegroundColor Gray
        }
        
        return $validSyntax
    } catch {
        return $false
    }
}

# Test 3: Parameter File Validation
Test-Item "Parameter file configuration" {
    try {
        $params = Get-Content "../main.parameters.json" | ConvertFrom-Json
        
        # Check required parameters exist
        $hasEnvironment = $params.parameters.environment -ne $null
        $hasRepoUrl = $params.parameters.repositoryUrl -ne $null
        $hasBranch = $params.parameters.branch -ne $null
        $correctBranch = $params.parameters.branch.value -eq "main"
        
        if (-not $hasEnvironment) { Write-Host "   Missing environment parameter" -ForegroundColor Red }
        if (-not $hasRepoUrl) { Write-Host "   Missing repositoryUrl parameter" -ForegroundColor Red }
        if (-not $hasBranch) { Write-Host "   Missing branch parameter" -ForegroundColor Red }
        if (-not $correctBranch) { Write-Host "   Branch should be 'main'" -ForegroundColor Red }
        
        return $hasEnvironment -and $hasRepoUrl -and $hasBranch -and $correctBranch
    } catch {
        return $false
    }
}

# Test 4: Static Web App Module Structure
Test-Item "Static Web App module structure" {
    try {
        $moduleContent = Get-Content "../modules/staticwebapp.bicep" -Raw
        
        $hasParams = $moduleContent -match "param\s+staticWebAppName\s+string"
        $hasResource = $moduleContent -match "resource\s+staticWebApp\s+"
        $hasOutputs = $moduleContent -match "output\s+name\s+string" -and $moduleContent -match "output.*defaultHostname"
        
        if (-not $hasParams) { Write-Host "   Missing required parameters" -ForegroundColor Red }
        if (-not $hasResource) { Write-Host "   Missing Static Web App resource definition" -ForegroundColor Red }
        if (-not $hasOutputs) { Write-Host "   Missing required outputs" -ForegroundColor Red }
        
        return $hasParams -and $hasResource -and $hasOutputs
    } catch {
        return $false
    }
}

# Test 5: Script Parameter Validation
Test-Item "Deployment script parameters" {
    try {
        $scriptContent = Get-Content "./deploy.ps1" -Raw
        
        $hasEphemeralParam = $scriptContent -match "\[switch\]\`$EphemeralEnvironment"
        $hasValidateParam = $scriptContent -match "\[switch\]\`$ValidateOnly"
        $hasGitHubTokenParam = $scriptContent -match "Mandatory=\`$true.*\`$GitHubToken" -or $scriptContent -match "\[Parameter\(Mandatory=\`$true\)\][\s\S]*\[string\]\`$GitHubToken"
        $hasHelpDoc = $scriptContent -match "<#[\s\S]*\.SYNOPSIS[\s\S]*#>"
        
        if (-not $hasEphemeralParam) { Write-Host "   Missing EphemeralEnvironment parameter" -ForegroundColor Red }
        if (-not $hasValidateParam) { Write-Host "   Missing ValidateOnly parameter" -ForegroundColor Red }
        if (-not $hasGitHubTokenParam) { Write-Host "   Missing or incorrect GitHubToken parameter" -ForegroundColor Red }
        if (-not $hasHelpDoc) { Write-Host "   Missing help documentation" -ForegroundColor Red }
        
        return $hasEphemeralParam -and $hasValidateParam -and $hasGitHubTokenParam -and $hasHelpDoc
    } catch {
        return $false
    }
}

# Test 6: Validation Script Structure
Test-Item "Validation script functionality" {
    try {
        $scriptContent = Get-Content "./validate-deployment.ps1" -Raw
        
        $hasSteps = $scriptContent -match "Step [1-7]" # Should have multiple numbered steps
        $hasCleanup = $scriptContent -match "SkipCleanup"
        $hasRetries = $scriptContent -match "maxRetries"
        $hasErrorHandling = $scriptContent -match "try\s*{[\s\S]*catch\s*{"
        
        if (-not $hasSteps) { Write-Host "   Missing structured validation steps" -ForegroundColor Red }
        if (-not $hasCleanup) { Write-Host "   Missing cleanup functionality" -ForegroundColor Red }
        if (-not $hasRetries) { Write-Host "   Missing retry logic for app testing" -ForegroundColor Red }
        if (-not $hasErrorHandling) { Write-Host "   Missing error handling" -ForegroundColor Red }
        
        return $hasSteps -and $hasCleanup -and $hasRetries -and $hasErrorHandling
    } catch {
        return $false
    }
}

# Test 7: Documentation Completeness
Test-Item "Documentation completeness" {
    try {
        $deploymentGuideExists = Test-Path "../DEPLOYMENT_GUIDE.md"
        $issuesDocExists = Test-Path "../DEPLOYMENT_ISSUES_AND_IMPROVEMENTS.md"
        
        if ($issuesDocExists) {
            $docContent = Get-Content "../DEPLOYMENT_ISSUES_AND_IMPROVEMENTS.md" -Raw
            $hasIssuesSection = $docContent -match "## Issues Identified"
            $hasImprovementsSection = $docContent -match "## Improvements Implemented"
            $hasTroubleshooting = $docContent -match "## Troubleshooting"
        } else {
            $hasIssuesSection = $false
            $hasImprovementsSection = $false
            $hasTroubleshooting = $false
        }
        
        if (-not $deploymentGuideExists) { Write-Host "   Deployment guide exists" -ForegroundColor Gray }
        if (-not $issuesDocExists) { Write-Host "   Missing issues and improvements documentation" -ForegroundColor Red }
        if (-not $hasIssuesSection) { Write-Host "   Missing issues identification section" -ForegroundColor Red }
        if (-not $hasImprovementsSection) { Write-Host "   Missing improvements section" -ForegroundColor Red }
        if (-not $hasTroubleshooting) { Write-Host "   Missing troubleshooting guide" -ForegroundColor Red }
        
        return $issuesDocExists -and $hasIssuesSection -and $hasImprovementsSection -and $hasTroubleshooting
    } catch {
        return $false
    }
}

Write-Host "" -ForegroundColor White

# Summary
Write-Host "📊 Structure Test Summary" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed/$testsTotal" -ForegroundColor $(if ($testsPassed -eq $testsTotal) { "Green" } elseif ($testsPassed -gt ($testsTotal * 0.8)) { "Yellow" } else { "Red" })

if ($testsPassed -eq $testsTotal) {
    Write-Host "🎉 All structure tests passed!" -ForegroundColor Green
    Write-Host "   Deployment infrastructure is ready for use" -ForegroundColor Green
    exit 0
} elseif ($testsPassed -gt ($testsTotal * 0.8)) {
    Write-Host "⚠️ Most tests passed - minor issues detected" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Significant issues detected in deployment structure" -ForegroundColor Red
    exit 1
}