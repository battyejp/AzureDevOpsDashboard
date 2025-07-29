/**
 * Configuration service for managing user preferences
 * Handles localStorage operations for persisting user settings
 */

export interface UserConfig {
  defaultProject?: string;
  pipelineFilters?: { [projectName: string]: number[] };
}

const CONFIG_KEY = 'azureDevOpsDashboard_config';

export class ConfigService {
  /**
   * Get the current user configuration from localStorage
   */
  static getConfig(): UserConfig {
    try {
      const configString = localStorage.getItem(CONFIG_KEY);
      if (configString) {
        return JSON.parse(configString);
      }
    } catch (error) {
      console.error('Error reading configuration from localStorage:', error);
    }
    return {};
  }

  /**
   * Save user configuration to localStorage
   */
  static saveConfig(config: UserConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving configuration to localStorage:', error);
    }
  }

  /**
   * Get the default project name
   */
  static getDefaultProject(): string | undefined {
    const config = this.getConfig();
    return config.defaultProject;
  }

  /**
   * Set the default project name
   */
  static setDefaultProject(projectName: string): void {
    const config = this.getConfig();
    config.defaultProject = projectName;
    this.saveConfig(config);
  }

  /**
   * Clear all configuration
   */
  static clearConfig(): void {
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch (error) {
      console.error('Error clearing configuration from localStorage:', error);
    }
  }

  /**
   * Get pipeline filters for a specific project
   */
  static getPipelineFilters(projectName: string): number[] | undefined {
    const config = this.getConfig();
    return config.pipelineFilters?.[projectName];
  }

  /**
   * Set pipeline filters for a specific project
   */
  static setPipelineFilters(projectName: string, pipelineIds: number[]): void {
    const config = this.getConfig();
    if (!config.pipelineFilters) {
      config.pipelineFilters = {};
    }
    config.pipelineFilters[projectName] = pipelineIds;
    this.saveConfig(config);
  }

  /**
   * Clear pipeline filters for a specific project
   */
  static clearPipelineFilters(projectName: string): void {
    const config = this.getConfig();
    if (config.pipelineFilters && config.pipelineFilters[projectName]) {
      delete config.pipelineFilters[projectName];
      this.saveConfig(config);
    }
  }

  /**
   * Check if a pipeline should be visible based on configuration
   * If no filter is configured, all pipelines are visible
   */
  static isPipelineVisible(projectName: string, pipelineId: number): boolean {
    const filters = this.getPipelineFilters(projectName);
    if (!filters || filters.length === 0) {
      return true; // No filter means show all
    }
    return filters.includes(pipelineId);
  }
}