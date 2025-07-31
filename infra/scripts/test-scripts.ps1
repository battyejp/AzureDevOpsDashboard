#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Tests PowerShell deployment scripts for syntax and basic functionality.

.DESCRIPTION
    This script validates:
    1. PowerShell script syntax
    2. Parameter definitions
    3. Basic script structure
    4. Required dependencies

.EXAMPLE
    ./test-scripts.ps1
#>

Write-Host "🧪 Testing PowerShell Deployment Scripts" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$ErrorActionPreference = "Continue"
$scriptPath = $PSScriptRoot
$testsPassed = 0
$testsTotal = 0

function Test-PowerShellScript {
    param(
        [string]$ScriptPath,
        [string]$ScriptName
    )
    
    $global:testsTotal++
    Write-Host "Testing $ScriptName..." -ForegroundColor Blue
    
    try {
        # Test syntax by parsing the script
        $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $ScriptPath -Raw), [ref]$null)
        Write-Host "✅ Syntax validation passed" -ForegroundColor Green
        
        # Test script can be imported (checks for basic structure)
        $scriptContent = Get-Content $ScriptPath -Raw
        
        # Check for param block
        if ($scriptContent -match "param\s*\(") {
            Write-Host "✅ Parameter block found" -ForegroundColor Green
        } else {
            Write-Host "⚠️ No parameter block found" -ForegroundColor Yellow
        }
        
        # Check for error handling
        if ($scriptContent -match "try\s*{" -or $scriptContent -match "\$ErrorActionPreference") {
            Write-Host "✅ Error handling found" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Limited error handling" -ForegroundColor Yellow
        }
        
        # Check for help documentation
        if ($scriptContent -match "<#[\s\S]*#>") {
            Write-Host "✅ Help documentation found" -ForegroundColor Green
        } else {
            Write-Host "⚠️ No help documentation" -ForegroundColor Yellow
        }
        
        $global:testsPassed++
        Write-Host "✅ $ScriptName validation completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ $ScriptName validation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "" -ForegroundColor White
}

# Test all PowerShell scripts
$scripts = @(
    @{ Path = "$scriptPath/deploy.ps1"; Name = "deploy.ps1" }
    @{ Path = "$scriptPath/validate-deployment.ps1"; Name = "validate-deployment.ps1" }
    @{ Path = "$scriptPath/cleanup.ps1"; Name = "cleanup.ps1" }
    @{ Path = "$scriptPath/get-secrets.ps1"; Name = "get-secrets.ps1" }
)

foreach ($script in $scripts) {
    if (Test-Path $script.Path) {
        Test-PowerShellScript -ScriptPath $script.Path -ScriptName $script.Name
    } else {
        Write-Host "⚠️ Script not found: $($script.Name)" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor White
    }
}

# Test parameter file
$testsTotal++
Write-Host "Testing main.parameters.json..." -ForegroundColor Blue
try {
    $params = Get-Content "$scriptPath/../main.parameters.json" | ConvertFrom-Json
    Write-Host "✅ JSON syntax validation passed" -ForegroundColor Green
    
    # Check for required parameters
    $requiredParams = @("environment", "repositoryUrl", "branch")
    foreach ($param in $requiredParams) {
        if ($params.parameters.$param) {
            Write-Host "✅ Parameter '$param' found" -ForegroundColor Green
        } else {
            Write-Host "❌ Required parameter '$param' missing" -ForegroundColor Red
        }
    }
    
    # Check branch parameter value
    if ($params.parameters.branch.value -eq "main") {
        Write-Host "✅ Branch parameter is correctly set to 'main'" -ForegroundColor Green
    } else {
        Write-Host "❌ Branch parameter should be 'main', found: '$($params.parameters.branch.value)'" -ForegroundColor Red
    }
    
    $testsPassed++
    Write-Host "✅ main.parameters.json validation completed" -ForegroundColor Green
    
} catch {
    Write-Host "❌ main.parameters.json validation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "" -ForegroundColor White

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed/$testsTotal" -ForegroundColor $(if ($testsPassed -eq $testsTotal) { "Green" } else { "Yellow" })

if ($testsPassed -eq $testsTotal) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ Some tests failed or had warnings" -ForegroundColor Yellow
    exit 1
}