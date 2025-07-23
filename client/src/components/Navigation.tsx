import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';

const Navigation: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/deployments',
      label: 'Deployments',
      icon: <DashboardIcon sx={{ mr: 1 }} />
    },
    {
      path: '/builds',
      label: 'Builds',
      icon: <BuildIcon sx={{ mr: 1 }} />
    }
  ];

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Azure DevOps Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              variant={location.pathname === item.path ? 'outlined' : 'text'}
              startIcon={item.icon}
              sx={{
                borderColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
