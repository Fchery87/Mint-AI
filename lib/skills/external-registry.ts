/**
 * External Skill Registry
 * 
 * Manages dynamic loading of skills from external packages (npm, local, etc.)
 * Provides permission system and validation for third-party skills.
 */

import { SkillType, SkillConfig } from '@/types/skill';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SkillPermission = 
  | 'read_files'
  | 'write_files'
  | 'network'
  | 'execute_code'
  | 'access_workspace'
  | 'modify_workspace';

export interface SkillManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: SkillPermission[];
  skills: ExternalSkillConfig[];
  dependencies?: string[];
  repository?: string;
  homepage?: string;
  license?: string;
}

export interface ExternalSkillConfig {
  type: string; // Custom skill type string
  name: string;
  description: string;
  triggerPatterns: RegExp[];
  stage: string;
  requiresFiles: boolean;
  supportsStreaming: boolean;
  handler: string; // Handler function name to import
  config?: Record<string, unknown>;
}

export interface InstalledSkill {
  manifest: SkillManifest;
  installedAt: Date;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface SkillLoadError {
  skillId: string;
  error: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// External Skill Registry Class
// ─────────────────────────────────────────────────────────────────────────────

class ExternalSkillRegistry {
  private installedSkills = new Map<string, InstalledSkill>();
  private loadErrors: SkillLoadError[] = [];
  private skillHandlers = new Map<string, Function>();

  /**
   * Register an external skill from a manifest
   */
  async registerSkill(manifest: SkillManifest): Promise<boolean> {
    try {
      // Validate manifest
      this.validateManifest(manifest);

      // Check permissions
      await this.checkPermissions(manifest.permissions);

      // Load skill handlers dynamically
      for (const skill of manifest.skills) {
        await this.loadSkillHandler(manifest.id, skill);
      }

      // Store installed skill
      const installedSkill: InstalledSkill = {
        manifest,
        installedAt: new Date(),
        enabled: true,
      };

      this.installedSkills.set(manifest.id, installedSkill);

      console.log(`✅ Skill "${manifest.name}" registered successfully`);
      return true;
    } catch (error) {
      const loadError: SkillLoadError = {
        skillId: manifest.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
      this.loadErrors.push(loadError);
      console.error(`❌ Failed to register skill "${manifest.name}":`, error);
      return false;
    }
  }

  /**
   * Load skills from an npm package
   */
  async loadFromNpm(packageName: string): Promise<boolean> {
    try {
      console.log(`📦 Loading skill package: ${packageName}`);

      // Dynamic import of the package
      const skillPackage = await import(/* @vite-ignore */ packageName);
      
      // Get manifest from package
      const manifest: SkillManifest = skillPackage.manifest || skillPackage.default?.manifest;
      
      if (!manifest) {
        throw new Error('Package does not export a valid manifest');
      }

      return await this.registerSkill(manifest);
    } catch (error) {
      console.error(`Failed to load skills from npm package "${packageName}":`, error);
      return false;
    }
  }

  /**
   * Load skills from a local file path
   */
  async loadFromPath(filePath: string): Promise<boolean> {
    try {
      console.log(`📂 Loading skill from: ${filePath}`);

      // Dynamic import from file path
      const skillModule = await import(/* @vite-ignore */ filePath);
      
      const manifest: SkillManifest = skillModule.manifest || skillModule.default?.manifest;
      
      if (!manifest) {
        throw new Error('Module does not export a valid manifest');
      }

      return await this.registerSkill(manifest);
    } catch (error) {
      console.error(`Failed to load skills from path "${filePath}":`, error);
      return false;
    }
  }

  /**
   * Load skills from a URL
   */
  async loadFromUrl(url: string): Promise<boolean> {
    try {
      console.log(`🌐 Loading skill from URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const moduleText = await response.text();
      
      // Create a blob URL for the module
      const blob = new Blob([moduleText], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      
      const skillModule = await import(/* @vite-ignore */ blobUrl);
      const manifest: SkillManifest = skillModule.manifest || skillModule.default?.manifest;
      
      URL.revokeObjectURL(blobUrl);

      if (!manifest) {
        throw new Error('Module does not export a valid manifest');
      }

      return await this.registerSkill(manifest);
    } catch (error) {
      console.error(`Failed to load skills from URL "${url}":`, error);
      return false;
    }
  }

  /**
   * Unregister an installed skill
   */
  unregisterSkill(skillId: string): boolean {
    const skill = this.installedSkills.get(skillId);
    if (!skill) {
      console.warn(`Skill "${skillId}" not found`);
      return false;
    }

    // Remove handlers
    for (const skillConfig of skill.manifest.skills) {
      const handlerKey = `${skillId}:${skillConfig.type}`;
      this.skillHandlers.delete(handlerKey);
    }

    this.installedSkills.delete(skillId);
    console.log(`🗑️ Skill "${skill.manifest.name}" unregistered`);
    return true;
  }

  /**
   * Get handler for a specific skill type
   */
  getHandler(skillType: string): Function | null {
    // Search through all installed skills for a matching handler
    for (const [skillId, installedSkill] of this.installedSkills.entries()) {
      const skillConfig = installedSkill.manifest.skills.find(
        s => s.type === skillType
      );
      
      if (skillConfig) {
        const handlerKey = `${skillId}:${skillType}`;
        return this.skillHandlers.get(handlerKey) || null;
      }
    }
    return null;
  }

  /**
   * Get all installed skills
   */
  getInstalledSkills(): InstalledSkill[] {
    return Array.from(this.installedSkills.values());
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: string): InstalledSkill | undefined {
    return this.installedSkills.get(skillId);
  }

  /**
   * Enable/disable a skill
   */
  setSkillEnabled(skillId: string, enabled: boolean): boolean {
    const skill = this.installedSkills.get(skillId);
    if (!skill) {
      return false;
    }

    skill.enabled = enabled;
    console.log(`${enabled ? '✅' : '❌'} Skill "${skill.manifest.name}" ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get load errors
   */
  getLoadErrors(): SkillLoadError[] {
    return [...this.loadErrors];
  }

  /**
   * Clear load errors
   */
  clearLoadErrors(): void {
    this.loadErrors = [];
  }

  /**
   * Validate skill manifest
   */
  private validateManifest(manifest: SkillManifest): void {
    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Invalid or missing skill ID');
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Invalid or missing skill name');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Invalid or missing skill version');
    }

    if (!Array.isArray(manifest.skills) || manifest.skills.length === 0) {
      throw new Error('Skill manifest must contain at least one skill');
    }

    // Validate each skill config
    for (const skill of manifest.skills) {
      if (!skill.type || !skill.name || !skill.handler) {
        throw new Error('Each skill must have type, name, and handler');
      }

      if (!Array.isArray(skill.triggerPatterns)) {
        throw new Error('Skill trigger patterns must be an array');
      }
    }
  }

  /**
   * Check permissions with user
   */
  private async checkPermissions(permissions: SkillPermission[]): Promise<void> {
    const dangerousPermissions: SkillPermission[] = [
      'write_files',
      'execute_code',
      'modify_workspace',
    ];

    const requestedDangerous = permissions.filter(p => dangerousPermissions.includes(p));

    if (requestedDangerous.length > 0) {
      // In a real implementation, show a permission dialog
      const granted = await this.requestPermissionFromUser(
        requestedDangerous
      );

      if (!granted) {
        throw new Error('Permission denied by user');
      }
    }
  }

  /**
   * Request permission from user (placeholder)
   */
  private async requestPermissionFromUser(permissions: SkillPermission[]): Promise<boolean> {
    // In a real implementation, show a modal dialog
    console.log('🔐 Requesting permissions:', permissions);
    
    // For now, auto-grant in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // TODO: Implement permission dialog
    return true;
  }

  /**
   * Load skill handler from module
   */
  private async loadSkillHandler(skillId: string, skill: ExternalSkillConfig): Promise<void> {
    // This is a placeholder - in a real implementation, you would
    // dynamically import the handler function
    const handlerKey = `${skillId}:${skill.type}`;
    
    // Store a placeholder handler for now
    this.skillHandlers.set(handlerKey, async (...args: unknown[]) => {
      console.log(`Executing external skill: ${skill.name}`, args);
      // Placeholder implementation
      return { success: true, result: 'External skill executed' };
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────────────────────

export const externalSkillRegistry = new ExternalSkillRegistry();

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a skill manifest for distribution
 */
export function createSkillManifest(
  manifest: Omit<SkillManifest, 'version' | 'skills'> & Partial<Pick<SkillManifest, 'version' | 'skills'>>
): SkillManifest {
  return {
    ...manifest,
    version: manifest.version || '1.0.0',
    skills: manifest.skills || [],
  };
}

/**
 * Validate permission requirements
 */
export function validatePermissions(
  requested: SkillPermission[],
  granted: SkillPermission[]
): boolean {
  const dangerous = ['write_files', 'execute_code', 'modify_workspace'];
  const requestedDangerous = requested.filter(p => dangerous.includes(p));
  const grantedDangerous = granted.filter(p => dangerous.includes(p));

  return requestedDangerous.every(p => grantedDangerous.includes(p));
}

/**
 * Get permission label for display
 */
export function getPermissionLabel(permission: SkillPermission): string {
  const labels: Record<SkillPermission, string> = {
    read_files: 'Read files from workspace',
    write_files: 'Write files to workspace',
    network: 'Make network requests',
    execute_code: 'Execute code in sandbox',
    access_workspace: 'Access workspace data',
    modify_workspace: 'Modify workspace structure',
  };
  return labels[permission] || permission;
}

/**
 * Check if a skill is from a trusted source
 */
export function isTrustedSource(manifest: SkillManifest): boolean {
  // List of trusted sources (npm scopes, domains, etc.)
  const trustedSources = [
    '@obra',
    '@mint-ai',
    'https://github.com/obra',
    'https://github.com/mint-ai',
  ];

  return trustedSources.some(source => {
    if (manifest.id.startsWith(source)) return true;
    if (manifest.repository?.startsWith(source)) return true;
    if (manifest.homepage?.startsWith(source)) return true;
    return false;
  });
}

export default ExternalSkillRegistry;
