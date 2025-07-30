# Infrastructure Scripts

This directory contains helper scripts for managing your Azure infrastructure.

## Files

- `deploy.ps1` - PowerShell script for local deployment
- `cleanup.ps1` - PowerShell script for resource cleanup
- `get-secrets.ps1` - Script to retrieve deployment secrets

## Usage

These scripts are designed to run locally with Azure CLI and can be helpful for:
- Initial setup and testing
- Troubleshooting deployments
- Manual resource management

For production deployments, use the GitHub Actions workflow instead.
