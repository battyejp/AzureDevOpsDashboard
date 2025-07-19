# GitHub Actions Workflows

This repository includes several CI/CD workflows to ensure code quality and build reliability.

## Workflows Overview

### 1. API Build and Test (`api-build.yml`)
**Triggers**: Changes to `api/**` directory
- Builds the ASP.NET Core API
- Runs unit tests with code coverage
- Creates deployment artifacts
- Uploads test results and coverage reports

### 2. Client Build and Test (`client-build.yml`)  
**Triggers**: Changes to `client/**` directory
- Builds the React TypeScript application
- Runs linting and tests
- Creates production build
- Analyzes bundle size
- Uploads build artifacts

### 3. Docker Build (`docker-build.yml`)
**Triggers**: Changes to `api/**`, `client/**`, or Docker files
- Builds Docker images for both services
- Tests docker-compose configuration
- Validates image sizes
- Optional: Push to container registry (commented out)

## Path-Based Triggering

Each workflow is configured to only run when relevant files change:

- **API changes**: `api/**` → Triggers API build
- **Client changes**: `client/**` → Triggers client build  
- **Docker changes**: `docker-compose.yml`, `Dockerfile` → Triggers Docker build

## Artifacts

Workflows generate the following artifacts:

### API Artifacts
- `api-test-results`: Unit test results and coverage
- `api-artifacts`: Compiled API ready for deployment

### Client Artifacts  
- `client-test-results`: Test results and coverage
- `client-build`: Production React build

## Configuration

### Environment Variables
The workflows use placeholder values for configuration:
- `REACT_APP_AZDEVOPS_ORGANIZATION`: Set to "test-org" for builds
- `REACT_APP_API_URL`: Set to appropriate API URL for environment

### Secrets Required
For container registry push (if enabled):
- `GITHUB_TOKEN`: Automatically provided by GitHub

## Local Testing

Before pushing, you can run the same commands locally:

### API
```bash
cd api
dotnet restore AzDevOpsDashboard.sln
dotnet build AzDevOpsDashboard.sln --configuration Release
dotnet test AzDevOpsDashboard.sln --configuration Release
```

### Client
```bash
cd client
npm ci
npm run lint
npm test -- --coverage --watchAll=false
npm run build
```

### Docker
```bash
docker build -t azdevops-api:latest ./api
docker build -t azdevops-client:latest ./client
docker compose config
```

## Customization

To modify these workflows:

1. **Add new triggers**: Edit the `paths` sections in workflow files
2. **Add deployment**: Uncomment and configure the container registry sections
3. **Add environments**: Create environment-specific workflows
4. **Add security scanning**: Add steps for vulnerability scanning
5. **Add performance testing**: Add steps for load testing or lighthouse audits
