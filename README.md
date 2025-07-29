# Azure DevOps Dashboard

Azure DevOps Dashboard is a modern web application for visualizing and monitoring Azure DevOps pipelines, builds, and deployments. It provides a unified view of your DevOps activity, making it easy to track build health, deployment status, and project configuration.

---

## UI Overview

The dashboard features three main views, accessible from the navigation bar:

### 1. Deployments View
- **Purpose:** See the latest deployment status for each pipeline and environment.
- **Features:** Color-coded status, quick links to build results, and deployment history.

![Deployments View Screenshot](client\screenshots\deployments-view.png)

### 2. Builds View
- **Purpose:** Browse recent builds for all pipelines, filter by project, branch, or status.
- **Features:** Build numbers, status, timestamps, and direct links to Azure DevOps.

![Builds View Screenshot](client\screenshots/builds-view.png)

### 3. Configuration View
- **Purpose:** Select which projects and pipelines appear in your dashboard.
- **Features:** Enable/disable projects and pipelines, filter by environment, and save preferences locally.

![Configuration View Screenshot](client\screenshots/configuration-view.png)

---

## Getting Started


### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) .NET 6+ SDK for running the API backend

#### API Setup: Azure DevOps PAT Token

To connect the backend API to your Azure DevOps organization, you need a Personal Access Token (PAT) with appropriate permissions.

1. Go to Azure DevOps > User Settings > Personal Access Tokens.
2. Create a new token with at least "Read & execute" permissions for Builds, Pipelines, and Projects.
3. Copy your PAT and update the following fields in `api/AzDevOpsApi/appsettings.Development.json`:

```json
  "AzureDevOps": {
    "Organization": "YOUR_ORG_NAME",
    "PAT": "YOUR_PERSONAL_ACCESS_TOKEN"
  }
```

**Never commit real PAT tokens to source control.**
For production, use environment variables or a secure secrets store.

### Ways to Run the UI and API

#### 1. Using npm/yarn (local development)

- **Start the client (mock API):**
  ```bash
  npm install
  npm start
  ```
  The UI will use mock data (no backend required).

- **Start the client (real API):**
  ```bash
  REACT_APP_API_URL=http://localhost:5031/api npm start
  ```
  The UI will connect to your running API backend.

- **Start the API backend:**
  ```bash
  cd ../api/AzDevOpsApi
  dotnet run
  ```

#### 2. Using Visual Studio Code Tasks

- Open the Command Palette (`Ctrl+Shift+P` or `F1`).
- Select `Tasks: Run Task`.
- Choose:
  - `Start client (mock API)` for mock mode.
  - `Start client (real API)` to connect to the backend.
  - `Start API` to run the backend.

#### 3. Using Docker

- **Start everything with Docker Compose:**
  ```bash
  docker-compose up --build
  ```
  This will build and run both the client and API in containers.

---

## Project Structure

```
client/
 ├── public/                # Static files (add screenshots here)
 ├── src/
 │   ├── components/        # UI components
 │   ├── models/            # TypeScript interfaces
 │   ├── services/          # API services
 │   ├── App.tsx            # Main application component
 │   └── index.tsx          # Entry point
 ├── package.json           # Dependencies and scripts
 └── tsconfig.json          # TypeScript configuration
api/
 └── AzDevOpsApi/           # .NET backend
```

---


---

## Testing

This project includes three types of tests:

### 1. .NET API Tests

Run all backend (API) tests using the .NET CLI:

```bash
cd ../api/AzDevOpsApi
dotnet test
```
This will build and run all unit and integration tests for the API.

### 2. React Unit/Component Tests

Run all React (frontend) tests using:

```bash
npm test
```
This launches the test runner in interactive watch mode for all React unit and component tests.

### 3. Playwright End-to-End Tests

Run Playwright E2E tests for the UI:

```bash
npm run test:e2e
```
For smoke tests (faster, good for CI/local dev):
```bash
npm run test:e2e:smoke
```
For UI mode (visual debugging):
```bash
npm run test:e2e:ui
```
Playwright tests simulate real user interactions and verify the app end-to-end, using mock data by default.

---

## Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Material-UI Documentation](https://mui.com/)
- [Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/)

---