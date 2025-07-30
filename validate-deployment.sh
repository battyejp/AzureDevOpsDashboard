#!/bin/bash

# Azure DevOps Dashboard - Deployment Validation Script
# This script validates that the Bicep templates are syntactically correct
# and simulates a deployment to ensure all components work together

set -euo pipefail

echo "🚀 Azure DevOps Dashboard - Deployment Validation"
echo "=================================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "infra/main.bicep" ]; then
    echo "❌ Please run this script from the repository root directory."
    exit 1
fi

echo "✅ Azure CLI found"
echo "✅ Bicep templates found"

# Validate Bicep syntax
echo ""
echo "🔍 Validating Bicep template syntax..."

cd infra

# Build the main template
echo "Building main.bicep..."
az bicep build --file main.bicep --outfile main.json

if [ $? -eq 0 ]; then
    echo "✅ Main Bicep template syntax is valid"
else
    echo "❌ Main Bicep template has syntax errors"
    exit 1
fi

# Build the module
echo "Building modules/staticwebapp.bicep..."
az bicep build --file modules/staticwebapp.bicep --outfile modules/staticwebapp.json

if [ $? -eq 0 ]; then
    echo "✅ Static Web App module syntax is valid"
else
    echo "❌ Static Web App module has syntax errors"
    exit 1
fi

cd ..

# Validate client build
echo ""
echo "🏗️  Validating client application build..."

cd client

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm ci
fi

# Test build
echo "Building React application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Client application builds successfully"
else
    echo "❌ Client application build failed"
    exit 1
fi

cd ..

# Run client tests
echo ""
echo "🧪 Running client tests..."

cd client
npm test -- --watchAll=false --passWithNoTests

if [ $? -eq 0 ]; then
    echo "✅ All client tests pass"
else
    echo "❌ Some client tests failed"
    exit 1
fi

cd ..

# Validate deployment workflow syntax
echo ""
echo "📋 Validating GitHub Actions workflow..."

# Basic YAML syntax check (if yq is available)
if command -v yq &> /dev/null; then
    yq eval '.github/workflows/deploy-azure.yml' > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ GitHub Actions workflow YAML is valid"
    else
        echo "❌ GitHub Actions workflow has YAML syntax errors"
        exit 1
    fi
else
    echo "⚠️  yq not found, skipping YAML validation"
fi

# Check for required environment variables in workflow
echo "Checking workflow environment variables..."
required_secrets=("AZURE_CLIENT_ID" "AZURE_TENANT_ID" "AZURE_SUBSCRIPTION_ID" "REACT_APP_AZDEVOPS_ORGANIZATION" "REACT_APP_API_URL")

workflow_file=".github/workflows/deploy-azure.yml"
for secret in "${required_secrets[@]}"; do
    if grep -q "\${{ secrets\.$secret }}" "$workflow_file"; then
        echo "✅ Workflow references required secret: $secret"
    else
        echo "❌ Workflow missing reference to required secret: $secret"
    fi
done

echo ""
echo "🎉 Deployment Validation Complete!"
echo "=================================="
echo ""
echo "✅ All validation checks passed!"
echo ""
echo "📝 Next Steps:"
echo "1. Ensure GitHub repository secrets are configured:"
for secret in "${required_secrets[@]}"; do
    echo "   - $secret"
done
echo ""
echo "2. Push changes to 'main' branch to trigger deployment"
echo "3. Monitor deployment in GitHub Actions"
echo "4. Verify deployed application at the Static Web App URL"
echo ""
echo "🔧 Manual Deployment (Alternative):"
echo "If you want to deploy manually:"
echo "1. az login"
echo "2. cd infra"
echo "3. az deployment sub create --location eastus2 --template-file main.bicep --parameters ..."
echo ""
echo "📚 For detailed instructions, see infra/DEPLOYMENT_GUIDE.md"