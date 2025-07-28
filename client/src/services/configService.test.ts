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

  describe('Pipeline Filters', () => {
    test('should set and get pipeline filters for a project', () => {
      const projectName = 'TestProject';
      const pipelineIds = [1, 2, 3];
      
      ConfigService.setPipelineFilters(projectName, pipelineIds);
      const retrievedFilters = ConfigService.getPipelineFilters(projectName);
      
      expect(retrievedFilters).toEqual(pipelineIds);
    });

    test('should return undefined when no pipeline filters are set for a project', () => {
      const filters = ConfigService.getPipelineFilters('NonexistentProject');
      expect(filters).toBeUndefined();
    });

    test('should handle multiple projects with different pipeline filters', () => {
      const project1 = 'Project1';
      const project2 = 'Project2';
      const filters1 = [1, 2];
      const filters2 = [3, 4, 5];
      
      ConfigService.setPipelineFilters(project1, filters1);
      ConfigService.setPipelineFilters(project2, filters2);
      
      expect(ConfigService.getPipelineFilters(project1)).toEqual(filters1);
      expect(ConfigService.getPipelineFilters(project2)).toEqual(filters2);
    });

    test('should clear pipeline filters for a specific project', () => {
      const projectName = 'TestProject';
      const pipelineIds = [1, 2, 3];
      
      ConfigService.setPipelineFilters(projectName, pipelineIds);
      expect(ConfigService.getPipelineFilters(projectName)).toEqual(pipelineIds);
      
      ConfigService.clearPipelineFilters(projectName);
      expect(ConfigService.getPipelineFilters(projectName)).toBeUndefined();
    });

    test('should not affect other projects when clearing filters for one project', () => {
      const project1 = 'Project1';
      const project2 = 'Project2';
      const filters1 = [1, 2];
      const filters2 = [3, 4];
      
      ConfigService.setPipelineFilters(project1, filters1);
      ConfigService.setPipelineFilters(project2, filters2);
      
      ConfigService.clearPipelineFilters(project1);
      
      expect(ConfigService.getPipelineFilters(project1)).toBeUndefined();
      expect(ConfigService.getPipelineFilters(project2)).toEqual(filters2);
    });

    test('should return true for pipeline visibility when no filters are configured', () => {
      const isVisible = ConfigService.isPipelineVisible('Project1', 123);
      expect(isVisible).toBe(true);
    });

    test('should return true for pipeline visibility when pipeline is in filter list', () => {
      const projectName = 'TestProject';
      const pipelineId = 123;
      
      ConfigService.setPipelineFilters(projectName, [123, 456, 789]);
      
      const isVisible = ConfigService.isPipelineVisible(projectName, pipelineId);
      expect(isVisible).toBe(true);
    });

    test('should return false for pipeline visibility when pipeline is not in filter list', () => {
      const projectName = 'TestProject';
      const pipelineId = 999;
      
      ConfigService.setPipelineFilters(projectName, [123, 456, 789]);
      
      const isVisible = ConfigService.isPipelineVisible(projectName, pipelineId);
      expect(isVisible).toBe(false);
    });

    test('should return true for pipeline visibility when filter list is empty', () => {
      const projectName = 'TestProject';
      const pipelineId = 123;
      
      ConfigService.setPipelineFilters(projectName, []);
      
      const isVisible = ConfigService.isPipelineVisible(projectName, pipelineId);
      expect(isVisible).toBe(true);
    });

    test('should preserve existing configuration when setting pipeline filters', () => {
      const defaultProject = 'MyDefaultProject';
      ConfigService.setDefaultProject(defaultProject);
      
      ConfigService.setPipelineFilters('TestProject', [1, 2, 3]);
      
      expect(ConfigService.getDefaultProject()).toBe(defaultProject);
      expect(ConfigService.getPipelineFilters('TestProject')).toEqual([1, 2, 3]);
    });
  });
});