# Azure DevOps Dashb### Installation

``## Available Scripts

### `npm st**Note: this is a one-way operation. Once you `eject`, you can't go back!**rt`

Runs the app in development mode with hot reloading.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder, optimized for performance.

### `npm run eject`endencies
npm install

# Start development server
npm start
```act Client

The frontend UI for the Azure DevOps Dashboard project, built with React, TypeScript, and Material-UI.

## Features

- **Modern UI**: Built with Material-UI components for a clean, responsive interface
- **TypeScript**: Full type safety and improved developer experience
- **API Integration**: Connects to ASP.NET Core backend for Azure DevOps data
- **Real-time Updates**: Configurable refresh interval for pipeline status
- **Filters**: Filter pipelines by project and environment

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API server running at http://localhost:5031 (or configured API URL)

### Installation

\\\ash
# Install dependencies
npm install

# Start development server
npm start
\\\

The application will be available at http://localhost:3000.

## Available Scripts

### \
pm start\

Runs the app in development mode with hot reloading.

### \
pm test\

Launches the test runner in interactive watch mode.

### \
pm run build\

Builds the app for production to the \uild\ folder, optimized for performance.

### \
pm run eject\

**Note: this is a one-way operation. Once you \ject\, you can't go back!**

If you need to customize the build configuration, you can eject from Create React App.

## Project Structure

```
client/
 ├── public/                # Static files
 ├── src/
 │   ├── components/        # UI components
 │   │   ├── Dashboard/     # Dashboard layout components
 │   │   ├── Filters/       # Filter components
 │   │   └── StatusGrid/    # Build status grid components
 │   ├── models/            # TypeScript interfaces
 │   ├── services/          # API services
 │   ├── App.tsx            # Main application component
 │   └── index.tsx          # Entry point
 ├── package.json           # Dependencies and scripts
 └── tsconfig.json          # TypeScript configuration
```

## Docker Support

This application is containerized using the `Dockerfile` in this directory. 
When deployed with Docker Compose, Nginx serves the static build and proxies API requests.

## Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Material-UI Documentation](https://mui.com/)
