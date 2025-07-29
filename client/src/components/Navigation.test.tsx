import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from './Navigation';

// Mock react-router-dom
const mockLocation = {
  pathname: '/deployments',
  search: '',
  hash: '',
  state: null,
  key: 'test'
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
}));

// Wrapper component for router context
const NavigationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('Navigation Component', () => {
  beforeEach(() => {
    mockLocation.pathname = '/deployments';
  });

  test('renders Azure DevOps Dashboard title', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const titleElement = screen.getByText('Azure DevOps Dashboard');
    expect(titleElement).toBeInTheDocument();
  });

  test('renders all navigation menu items', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    expect(screen.getByText('Deployments')).toBeInTheDocument();
    expect(screen.getByText('Builds')).toBeInTheDocument();
    expect(screen.getByText('Release')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  test('renders navigation icons', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    // Check that the navigation items are present with their icons
    const deploymentLink = screen.getByRole('link', { name: /deployments/i });
    const buildsLink = screen.getByRole('link', { name: /builds/i });
    const releaseLink = screen.getByRole('link', { name: /release/i });
    const configLink = screen.getByRole('link', { name: /configuration/i });
    
    expect(deploymentLink).toBeInTheDocument();
    expect(buildsLink).toBeInTheDocument();
    expect(releaseLink).toBeInTheDocument();
    expect(configLink).toBeInTheDocument();
  });

  test('applies correct href attributes to navigation links', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    expect(screen.getByRole('link', { name: /deployments/i })).toHaveAttribute('href', '/deployments');
    expect(screen.getByRole('link', { name: /builds/i })).toHaveAttribute('href', '/builds');
    expect(screen.getByRole('link', { name: /release/i })).toHaveAttribute('href', '/release');
    expect(screen.getByRole('link', { name: /configuration/i })).toHaveAttribute('href', '/configuration');
  });

  test('highlights active navigation item based on current location', () => {
    mockLocation.pathname = '/builds';
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const buildsButton = screen.getByRole('link', { name: /builds/i });
    const deploymentsButton = screen.getByRole('link', { name: /deployments/i });
    
    // The active button should have outlined variant styling
    expect(buildsButton).toHaveClass('MuiButton-outlined');
    expect(deploymentsButton).not.toHaveClass('MuiButton-outlined');
  });

  test('changes active item when location changes', () => {
    const { rerender } = render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    // Initially on deployments
    let deploymentsButton = screen.getByRole('link', { name: /deployments/i });
    expect(deploymentsButton).toHaveClass('MuiButton-outlined');
    
    // Change location to configuration
    mockLocation.pathname = '/configuration';
    
    rerender(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const configButton = screen.getByRole('link', { name: /configuration/i });
    deploymentsButton = screen.getByRole('link', { name: /deployments/i });
    
    expect(configButton).toHaveClass('MuiButton-outlined');
    expect(deploymentsButton).not.toHaveClass('MuiButton-outlined');
  });
});