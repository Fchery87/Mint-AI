/**
 * Mint AI Skill System Types
 *
 * Defines the skill types, interfaces, and enums for intelligent
 * intent detection and skill routing.
 */

/**
 * Available skill types for AI intent classification
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

/**
 * Workflow stages for skill execution
 */
export enum WorkflowStage {
  IDLE = 'idle',
  THINKING = 'thinking',
  PLANNING = 'planning',
  CODING = 'coding',
  TESTING = 'testing',
  REVIEWING = 'reviewing',
  DONE = 'done',
}

/**
 * Context passed to skill handlers
 */
export interface SkillContext {
  /** Workspace ID */
  workspaceId: string;
  /** Message history */
  messageHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Current files in workspace */
  currentFiles: Array<{ path: string; content: string; language: string }>;
  /** Detected user intent */
  userIntent?: string;
}

/**
 * Configuration for a skill
 */
export interface SkillConfig {
  /** Skill name */
  name: string;
  /** Skill description */
  description: string;
  /** Regex patterns that trigger this skill */
  triggerPatterns: RegExp[];
  /** Associated workflow stage */
  stage: WorkflowStage;
  /** Whether this skill requires files */
  requiresFiles: boolean;
  /** Whether this skill supports streaming */
  supportsStreaming: boolean;
}

/**
 * Result from skill execution
 */
export interface SkillResult {
  /** Type of skill that was executed */
  type: SkillType;
  /** Current workflow stage */
  stage: WorkflowStage;
  /** Response content */
  content: string;
  /** Optional reasoning explanation */
  reasoning?: string;
  /** Tools used during execution */
  tools?: string[];
  /** Files created during execution */
  filesCreated?: Array<{ path: string; content: string }>;
  /** Whether tests are required */
  testRequired?: boolean;
}

/**
 * Skill handler interface
 */
export interface SkillHandler {
  /** Skill configuration */
  config: SkillConfig;
  /**
   * Process input and return result or async iterable
   */
  process(
    input: string,
    context: SkillContext,
  ): Promise<SkillResult> | AsyncIterable<SkillResult>;
}

/**
 * Intent match result from classification
 */
export interface IntentMatch {
  /** Matched skill type */
  skillType: SkillType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Pattern that matched (if any) */
  matchedPattern?: string;
}

/**
 * Test-Driven Development configuration
 */
export interface TDDConfig {
  /** Whether TDD is enabled */
  enabled: boolean;
  /** Test framework to use */
  testFramework: 'vitest' | 'jest' | 'playwright';
  /** Whether to auto-generate tests */
  autoGenerateTests: boolean;
  /** Whether to run tests after each change */
  testAfterEachChange: boolean;
}

/**
 * Skill registry interface
 */
export interface SkillRegistry {
  /** Get a skill handler by type */
  getSkill(type: SkillType): SkillHandler | null;
  /** Get all skill configurations */
  getAllSkills(): Array<SkillConfig>;
  /** Classify intent from input */
  classifyIntent(input: string): IntentMatch;
}
