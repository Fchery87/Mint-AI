'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Download, 
  Check, 
  ExternalLink, 
  Shield,
  AlertTriangle,
  Filter,
  X,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  externalSkillRegistry, 
  getPermissionLabel,
  isTrustedSource,
  type SkillManifest,
  type SkillPermission,
} from '@/lib/skills/external-registry';

interface SkillMarketplaceProps {
  onInstall?: (manifest: SkillManifest) => void;
  className?: string;
}

// Sample marketplace data (in production, this would come from an API)
const sampleSkills: SkillManifest[] = [
  {
    id: '@obra/memory-profiler',
    name: 'Memory Profiler',
    version: '1.2.0',
    author: 'Obra Team',
    description: 'Analyze memory usage and detect leaks in your code with advanced profiling tools.',
    permissions: ['read_files', 'access_workspace'],
    skills: [
      {
        type: 'memory_profile',
        name: 'Memory Profile',
        description: 'Profile memory usage',
        triggerPatterns: [/profile memory/i, /memory leak/i],
        stage: 'analyzing',
        requiresFiles: true,
        supportsStreaming: true,
        handler: 'profileMemory',
      },
    ],
    repository: 'https://github.com/obra/superpowers',
    homepage: 'https://obra.dev/memory-profiler',
    license: 'MIT',
  },
  {
    id: '@obra/api-tester',
    name: 'API Tester',
    version: '2.0.1',
    author: 'Obra Team',
    description: 'Test API endpoints, generate mock data, and validate responses.',
    permissions: ['network', 'write_files'],
    skills: [
      {
        type: 'api_test',
        name: 'API Test',
        description: 'Test API endpoints',
        triggerPatterns: [/test api/i, /mock data/i],
        stage: 'testing',
        requiresFiles: false,
        supportsStreaming: true,
        handler: 'testApi',
      },
    ],
    repository: 'https://github.com/obra/superpowers',
    homepage: 'https://obra.dev/api-tester',
    license: 'MIT',
  },
  {
    id: '@mint-ai/database-migrator',
    name: 'Database Migrator',
    version: '1.0.0',
    author: 'Mint AI',
    description: 'Generate and manage database migrations automatically.',
    permissions: ['read_files', 'write_files', 'execute_code'],
    skills: [
      {
        type: 'db_migrate',
        name: 'Database Migration',
        description: 'Create database migrations',
        triggerPatterns: [/create migration/i, /migrate database/i],
        stage: 'coding',
        requiresFiles: true,
        supportsStreaming: true,
        handler: 'migrateDatabase',
      },
    ],
    repository: 'https://github.com/mint-ai/skills',
    license: 'MIT',
  },
];

export function SkillMarketplace({ onInstall, className }: SkillMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<SkillPermission[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillManifest | null>(null);
  const [installedSkills, setInstalledSkills] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  // Load installed skills on mount
  useEffect(() => {
    const installed = externalSkillRegistry.getInstalledSkills();
    const installedIds = new Set(installed.map(s => s.manifest.id));
    setInstalledSkills(installedIds);
  }, []);

  const filteredSkills = sampleSkills.filter(skill => {
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPermissions = 
      selectedPermissions.length === 0 ||
      selectedPermissions.every(p => skill.permissions.includes(p));

    return matchesSearch && matchesPermissions;
  });

  const handleInstall = async (manifest: SkillManifest) => {
    if (installing.has(manifest.id) || installedSkills.has(manifest.id)) return;

    setInstalling(prev => new Set(prev).add(manifest.id));

    try {
      const success = await externalSkillRegistry.registerSkill(manifest);
      
      if (success) {
        setInstalledSkills(prev => new Set(prev).add(manifest.id));
        onInstall?.(manifest);
      }
    } catch (error) {
      console.error('Failed to install skill:', error);
    } finally {
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(manifest.id);
        return next;
      });
    }
  };

  const handleUninstall = (skillId: string) => {
    externalSkillRegistry.unregisterSkill(skillId);
    setInstalledSkills(prev => {
      const next = new Set(prev);
      next.delete(skillId);
      return next;
    });
  };

  const togglePermission = (permission: SkillPermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const allPermissions: SkillPermission[] = [
    'read_files',
    'write_files',
    'network',
    'execute_code',
    'access_workspace',
    'modify_workspace',
  ];

  return (
    <div className={cn('rounded-xl border border-border/40 bg-card', className)}>
      {/* Header */}
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Skill Marketplace</h2>
            <p className="text-sm text-muted-foreground">
              Discover and install community skills to extend Mint AI
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills by name, description, or author..."
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Permission Filters */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filter by permissions:</span>
          {allPermissions.map(permission => (
            <button
              key={permission}
              onClick={() => togglePermission(permission)}
              className={cn(
                'px-2 py-1 text-xs rounded-full border transition-colors',
                selectedPermissions.includes(permission)
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {getPermissionLabel(permission).split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="p-6">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No skills found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map(skill => (
              <SkillCard
                key={skill.id}
                manifest={skill}
                isInstalled={installedSkills.has(skill.id)}
                isInstalling={installing.has(skill.id)}
                onInstall={() => handleInstall(skill)}
                onUninstall={() => handleUninstall(skill.id)}
                onViewDetails={() => setSelectedSkill(skill)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Skill Details Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailsModal
            manifest={selectedSkill}
            isInstalled={installedSkills.has(selectedSkill.id)}
            onClose={() => setSelectedSkill(null)}
            onInstall={() => {
              handleInstall(selectedSkill);
              setSelectedSkill(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface SkillCardProps {
  manifest: SkillManifest;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onViewDetails: () => void;
}

function SkillCard({
  manifest,
  isInstalled,
  isInstalling,
  onInstall,
  onUninstall,
  onViewDetails,
}: SkillCardProps) {
  const isTrusted = isTrustedSource(manifest);
  const hasDangerousPermissions = manifest.permissions.some(p => 
    ['write_files', 'execute_code', 'modify_workspace'].includes(p)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border border-border/40 bg-card hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{manifest.name}</h3>
            <p className="text-xs text-muted-foreground">by {manifest.author}</p>
          </div>
        </div>
        
        {isTrusted && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400" title="Trusted source">
            <Shield size={14} />
            <span>Verified</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {manifest.description}
      </p>

      {/* Permissions */}
      <div className="flex flex-wrap gap-1 mb-3">
        {manifest.permissions.slice(0, 2).map(permission => (
          <span
            key={permission}
            className="px-2 py-0.5 text-xs rounded-full bg-muted/50 text-muted-foreground"
          >
            {getPermissionLabel(permission).split(' ')[0]}
          </span>
        ))}
        {manifest.permissions.length > 2 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-muted/50 text-muted-foreground">
            +{manifest.permissions.length - 2}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">v{manifest.version}</span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            isInstalled ? onUninstall() : onInstall();
          }}
          disabled={isInstalling}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
            isInstalled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-primary/10 hover:bg-primary/20 text-primary',
            isInstalling && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isInstalling ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Installing...
            </>
          ) : isInstalled ? (
            <>
              <Check size={14} />
              Installed
            </>
          ) : (
            <>
              <Download size={14} />
              Install
            </>
          )}
        </button>
      </div>

      {/* Warning */}
      {hasDangerousPermissions && !isTrusted && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle size={12} />
          <span>Requires elevated permissions</span>
        </div>
      )}
    </motion.div>
  );
}

interface SkillDetailsModalProps {
  manifest: SkillManifest;
  isInstalled: boolean;
  onClose: () => void;
  onInstall: () => void;
}

function SkillDetailsModal({
  manifest,
  isInstalled,
  onClose,
  onInstall,
}: SkillDetailsModalProps) {
  const isTrusted = isTrustedSource(manifest);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/40">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{manifest.name}</h2>
                <p className="text-sm text-muted-foreground">by {manifest.author}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-muted/50 px-2 py-0.5 rounded">v{manifest.version}</span>
                  {isTrusted && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Shield size={12} />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <p className="text-sm mb-6">{manifest.description}</p>

          {/* Permissions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Required Permissions</h3>
            <div className="space-y-2">
              {manifest.permissions.map(permission => (
                <div key={permission} className="flex items-center gap-2 text-sm">
                  <Shield size={14} className={cn(
                    ['write_files', 'execute_code', 'modify_workspace'].includes(permission)
                      ? 'text-amber-500'
                      : 'text-green-500'
                  )} />
                  <span>{getPermissionLabel(permission)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Included Skills</h3>
            <div className="space-y-2">
              {manifest.skills.map(skill => (
                <div key={skill.type} className="p-3 rounded-lg bg-muted/30">
                  <div className="font-medium text-sm">{skill.name}</div>
                  <div className="text-xs text-muted-foreground">{skill.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-sm">
            {manifest.repository && (
              <a
                href={manifest.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink size={14} />
                Repository
              </a>
            )}
            {manifest.homepage && (
              <a
                href={manifest.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink size={14} />
                Homepage
              </a>
            )}
            {manifest.license && (
              <span className="text-muted-foreground">License: {manifest.license}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/40">
          <button
            onClick={onInstall}
            disabled={isInstalled}
            className={cn(
              'w-full py-2.5 rounded-lg font-medium transition-colors',
              isInstalled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 cursor-default'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isInstalled ? '✓ Installed' : 'Install Skill'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SkillMarketplace;
