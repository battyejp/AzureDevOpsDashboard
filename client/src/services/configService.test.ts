import { ConfigService } from './configService';

// Create a simple localStorage mock
const localStorageMock = {
  store: {} as { [key: string]: string },
  getItem: function (key: string) {
    return this.store[key] || null;
  },
  setItem: function (key: string, value: string) {
    this.store[key] = value;
  },
  removeItem: function (key: string) {
    delete this.store[key];
  },
  clear: function () {
    this.store = {};
  }
};

// Replace the global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

beforeEach(() => {
  localStorageMock.clear();
});

describe('ConfigService', () => {
  test('should return empty object when no config exists', () => {
    const config = ConfigService.getConfig();
    expect(config).toEqual({});
  });

  test('should save and retrieve configuration', () => {
    const testConfig = { defaultProject: 'Test Project' };
    ConfigService.saveConfig(testConfig);
    
    const retrievedConfig = ConfigService.getConfig();
    expect(retrievedConfig).toEqual(testConfig);
  });

  test('should set and get default project', () => {
    const projectName = 'My Default Project';
    ConfigService.setDefaultProject(projectName);
    
    const defaultProject = ConfigService.getDefaultProject();
    expect(defaultProject).toBe(projectName);
  });

  test('should return undefined when no default project is set', () => {
    const defaultProject = ConfigService.getDefaultProject();
    expect(defaultProject).toBeUndefined();
  });

  test('should clear configuration', () => {
    ConfigService.setDefaultProject('Test Project');
    ConfigService.clearConfig();
    
    const config = ConfigService.getConfig();
    expect(config).toEqual({});
  });

  test('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw an error
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = jest.fn(() => {
      throw new Error('Storage quota exceeded');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Should not throw error
    expect(() => {
      ConfigService.saveConfig({ defaultProject: 'Test' });
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error saving configuration to localStorage:',
      expect.any(Error)
    );

    // Restore
    consoleSpy.mockRestore();
    localStorageMock.setItem = originalSetItem;
  });

  test('should handle invalid JSON in localStorage gracefully', () => {
    // Manually set invalid JSON in storage
    const originalGetItem = localStorageMock.getItem;
    localStorageMock.getItem = jest.fn(() => 'invalid json');
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const config = ConfigService.getConfig();
    expect(config).toEqual({});
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reading configuration from localStorage:',
      expect.any(Error)
    );

    // Restore
    consoleSpy.mockRestore();
    localStorageMock.getItem = originalGetItem;
  });
});