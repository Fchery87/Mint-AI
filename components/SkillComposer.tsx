'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, 
  X, 
  GripVertical, 
  ArrowRight, 
  Play, 
  ChevronDown,
  Lightbulb,
  FileCode,
  Bug,
  Eye,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillType } from '@/types/skill';

export interface SkillChainItem {
  id: string;
  skill: SkillType;
  config?: Record<string, any>;
  enabled: boolean;
}

interface SkillComposerProps {
  availableSkills?: SkillType[];
  initialChain?: SkillChainItem[];
  onExecute?: (chain: SkillChainItem[]) => void;
  onSave?: (chain: SkillChainItem[]) => void;
  className?: string;
}

const skillConfig: Record<SkillType, { 
  label: string; 
  icon: any; 
  color: string;
  description: string;
}> = {
  [SkillType.BRAINSTORM]: {
    label: 'Brainstorm',
    icon: Lightbulb,
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
    description: 'Explore ideas and solutions',
  },
  [SkillType.SEARCH]: {
    label: 'Search',
    icon: Search,
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300',
    description: 'Search the web for information',
  },
  [SkillType.PLAN]: {
    label: 'Plan',
    icon: FileCode,
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
    description: 'Create detailed implementation plans',
  },
  [SkillType.CODE]: {
    label: 'Code',
    icon: FileCode,
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300',
    description: 'Write and modify code',
  },
  [SkillType.DEBUG]: {
    label: 'Debug',
    icon: Bug,
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300',
    description: 'Identify and fix bugs',
  },
  [SkillType.REVIEW]: {
    label: 'Review',
    icon: Eye,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
    description: 'Review code quality',
  },
  [SkillType.GENERAL]: {
    label: 'General',
    icon: FileCode,
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300',
    description: 'General conversation',
  },
};

export function SkillComposer({
  availableSkills = Object.values(SkillType) as SkillType[],
  initialChain = [],
  onExecute,
  onSave,
  className,
}: SkillComposerProps) {
  const [chain, setChain] = useState<SkillChainItem[]>(initialChain);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  const addSkill = (skill: SkillType) => {
    const newSkill: SkillChainItem = {
      id: `skill-${Date.now()}`,
      skill,
      enabled: true,
    };
    setChain([...chain, newSkill]);
    setShowSkillPicker(false);
  };

  const removeSkill = (id: string) => {
    setChain(chain.filter(item => item.id !== id));
  };

  const toggleSkill = (id: string) => {
    setChain(chain.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const handleExecute = () => {
    onExecute?.(chain.filter(item => item.enabled));
  };

  const availableSkillsToAdd = availableSkills.filter(
    skill => !chain.some(item => item.skill === skill)
  );

  return (
    <div className={cn('rounded-xl border border-border/40 bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Skill Composer</h3>
          <span className="text-xs text-muted-foreground">
            {chain.filter(s => s.enabled).length} active
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {chain.length > 0 && (
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
            >
              <Play size={14} />
              Execute Chain
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronDown size={16} className={cn(isExpanded && 'rotate-180 transition-transform')} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Skill Chain */}
              {chain.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No skills in chain. Add skills to create a workflow.
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={chain}
                  onReorder={setChain}
                  className="space-y-2"
                >
                  {chain.map((item, index) => {
                    const config = skillConfig[item.skill];
                    const Icon = config.icon;
                    
                    return (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                        
                        <div className={cn(
                          'p-2 rounded-lg border flex-shrink-0',
                          config.color,
                          !item.enabled && 'opacity-50'
                        )}>
                          <Icon size={16} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{config.label}</span>
                            {item.config && (
                              <span className="text-xs text-muted-foreground">• Configured</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                        </div>
                        
                        {/* Arrow between skills */}
                        {index < chain.length - 1 && (
                          <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                        )}
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleSkill(item.id)}
                            className={cn(
                              'px-2 py-1 text-xs rounded transition-colors',
                              item.enabled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {item.enabled ? 'On' : 'Off'}
                          </button>
                          
                          <button
                            onClick={() => removeSkill(item.id)}
                            className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-red-500"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}

              {/* Add Skill Button */}
              {availableSkillsToAdd.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowSkillPicker(!showSkillPicker)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border/40 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm text-muted-foreground"
                  >
                    <Plus size={14} />
                    Add Skill
                  </button>

                  {/* Skill Picker Dropdown */}
                  <AnimatePresence>
                    {showSkillPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 p-2 bg-background border border-border/40 rounded-lg shadow-lg"
                      >
                        <div className="space-y-1">
                          {availableSkillsToAdd.map(skill => {
                            const config = skillConfig[skill];
                            const Icon = config.icon;
                            
                            return (
                              <button
                                key={skill}
                                onClick={() => addSkill(skill)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className={cn('p-1.5 rounded border', config.color)}>
                                  <Icon size={14} />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{config.label}</div>
                                  <div className="text-xs text-muted-foreground">{config.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Actions */}
              {chain.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <button
                    onClick={() => onSave?.(chain)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Save Chain
                  </button>
                  
                  <button
                    onClick={() => setChain([])}
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SkillComposer;
