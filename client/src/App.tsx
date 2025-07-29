import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import BuildsView from './components/BuildsView';
import ReleaseView from './components/ReleaseView';
import Configuration from './components/Configuration';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/deployments" element={<Dashboard />} />
              <Route path="/builds" element={<BuildsView />} />
              <Route path="/release" element={<ReleaseView />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/" element={<Navigate to="/deployments" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
