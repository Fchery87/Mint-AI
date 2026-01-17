/**
 * Mint AI Skill System Types
 *
 * Defines the skill types, interfaces, and enums for intelligent
 * intent detection and skill routing.
 */

export enum SkillType {
  BRAINSTORM = 'brainstorm',
  PLAN = 'plan',
  CODE = 'code',
  DEBUG = 'debug',
  REVIEW = 'review',
  SEARCH = 'search',
  GENERAL = 'general',
}

export enum WorkflowStage {
  IDLE = 'idle',
  THINKING = 'thinking',
  PLANNING = 'planning',
  CODING = 'coding',
  TESTING = 'testing',
  REVIEWING = 'reviewing',
  DONE = 'done',
}

export interface SkillContext {
  workspaceId: string;
  messageHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  currentFiles: Array<{ path: string; content: string; language: string }>;
  userIntent?: string;
}

export interface SkillConfig {
  name: string;
  description: string;
  triggerPatterns: RegExp[];
  stage: WorkflowStage;
  requiresFiles: boolean;
  supportsStreaming: boolean;
}

export interface SkillResult {
  type: SkillType;
  stage: WorkflowStage;
  content: string;
  reasoning?: string;
  tools?: string[];
  filesCreated?: Array<{ path: string; content: string }>;
  testRequired?: boolean;
}

export interface SkillHandler {
  config: SkillConfig;
  process(input: string, context: SkillContext): Promise<SkillResult> | AsyncIterable<SkillResult>;
}

export interface IntentMatch {
  skillType: SkillType;
  confidence: number;
  matchedPattern?: string;
}

export interface TDDConfig {
  enabled: boolean;
  testFramework: 'vitest' | 'jest' | 'playwright';
  autoGenerateTests: boolean;
  testAfterEachChange: boolean;
}

export interface SkillRegistry {
  getSkill(type: SkillType): SkillHandler | null;
  getAllSkills(): Array<SkillConfig>;
  classifyIntent(input: string): IntentMatch;
}
