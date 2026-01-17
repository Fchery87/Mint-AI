/**
 * Intent Classifier
 *
 * Fast, lightweight intent detection using keyword/pattern matching.
 * Optionally falls back to LLM classification for ambiguous cases.
 */

import { SkillType, IntentMatch } from '@/types/skill';

// Common intent patterns for each skill type
const INTENT_PATTERNS: Record<SkillType, RegExp[]> = {
  [SkillType.BRAINSTORM]: [
    /how (should|can|could|would)/i,
    /what('s| is) the best (way|approach|pattern)/i,
    /ideas (for|to)/i,
    /design (a|an|the)/i,
    /thinking about/i,
    /explore/i,
    /considering/i,
    /alternatives to/i,
    /let's think about/i,
    /should i use/i,
    /which (approach|pattern|library)/i,
  ],

  [SkillType.PLAN]: [
    /create a plan/i,
    /break down/i,
    /steps to/i,
    /roadmap/i,
    /implementation plan/i,
    /how to implement/i,
    /plan out/i,
    /list the steps/i,
    /task breakdown/i,
    /first,? second,? third/i,
    /sequence of/i,
  ],

  [SkillType.CODE]: [
    /^(write|create|build|add|make)/i,
    /implement/i,
    /generate (code|the|a)/i,
    /write a (component|function|hook|class)/i,
    /create a (file|component|page)/i,
    /build a/i,
    /add (a|an|the|feature)/i,
    /update (the|a)/i,
    /modify/i,
    /change/i,
    /refactor/i,
    /convert (the|a)/i,
    /rewrite/i,
    /make it so/i,
  ],

  [SkillType.DEBUG]: [
    /fix (the|a|this|my)/i,
    /bug/i,
    /error (message|log)?/i,
    /not working/i,
    /broken/i,
    /issue with/i,
    /problem with/i,
    /debug/i,
    /what's wrong/i,
    /something's wrong/i,
    /doesn't work/i,
    /is failing/i,
    /crash/i,
    /exception/i,
    /throw/i,
  ],

  [SkillType.REVIEW]: [
    /review (the|this|my|code)/i,
    /check (the|code|quality)/i,
    /improve (the|this|code)/i,
    /refactor (the|this)/i,
    /optimize/i,
    /clean up/i,
    /best practices/i,
    /suggestions for/i,
    /what do you think of/i,
    /feedback on/i,
  ],

  [SkillType.SEARCH]: [
    /^search/i,
    /look up/i,
    /find (information|documentation|examples)/i,
    /latest (news|version|release)/i,
    /how to use (react|typescript|tailwind|next)/i,
    /documentation for/i,
    /what is (react|typescript|next|node)/i,
    /check the docs/i,
    /google/i,
    /browse the web/i,
  ],

  [SkillType.GENERAL]: [],
};

/**
 * Calculate confidence score based on pattern match strength
 */
function calculateConfidence(input: string, pattern: RegExp): number {
  const normalizedInput = input.toLowerCase().trim();
  const match = normalizedInput.match(pattern);

  if (!match) return 0;

  // Strong indicators at the start of the message
  if (pattern.test(input) && /^[\s"']*\w+/.test(input)) {
    return 0.95;
  }

  // Strong indicators like "fix the bug" or "write code"
  if (pattern.source.startsWith('^')) {
    return 0.9;
  }

  // Medium confidence for content matches
  return 0.7;
}

/**
 * Detect intent using pattern matching
 */
export function detectIntent(input: string): IntentMatch {
  if (!input || input.trim().length === 0) {
    return {
      skillType: SkillType.GENERAL,
      confidence: 0.5,
    };
  }

  const normalizedInput = input.trim().toLowerCase();

  // Check for explicit skill commands
  if (normalizedInput.startsWith('brainstorm:')) {
    return { skillType: SkillType.BRAINSTORM, confidence: 1.0 };
  }
  if (normalizedInput.startsWith('plan:')) {
    return { skillType: SkillType.PLAN, confidence: 1.0 };
  }
  if (normalizedInput.startsWith('debug:')) {
    return { skillType: SkillType.DEBUG, confidence: 1.0 };
  }
  if (normalizedInput.startsWith('review:')) {
    return { skillType: SkillType.REVIEW, confidence: 1.0 };
  }
  if (normalizedInput.startsWith('search:')) {
    return { skillType: SkillType.SEARCH, confidence: 1.0 };
  }

  // Pattern-based detection
  let bestMatch: IntentMatch = {
    skillType: SkillType.GENERAL,
    confidence: 0.3,
  };

  for (const [skillType, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const confidence = calculateConfidence(input, pattern);
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          skillType: skillType as SkillType,
          confidence,
          matchedPattern: pattern.source,
        };
      }
    }
  }

  // Boost confidence if message has multiple indicators
  const wordCount = normalizedInput.split(/\s+/).length;
  if (wordCount > 10 && bestMatch.confidence < 0.8) {
    bestMatch.confidence += 0.1;
  }

  return bestMatch;
}

/**
 * Check if a message requires file context
 */
export function requiresFileContext(skillType: SkillType): boolean {
  return skillType === SkillType.DEBUG || skillType === SkillType.REVIEW;
}

/**
 * Extract key entities from user input
 */
export function extractEntities(input: string): {
  action?: string;
  target?: string;
  language?: string;
} {
  const entities: { action?: string; target?: string; language?: string } = {};

  // Extract action
  const actionMatch = input.match(/^(write|create|build|add|fix|update|modify|refactor|search)/i);
  if (actionMatch) {
    entities.action = actionMatch[1].toLowerCase();
  }

  // Extract target (file path, component name, etc.)
  const targetMatch = input.match(/(?:a|an|the)?\s*(?:file|component|function|hook|class|page|button|modal|form|input)\s*(?:named|called|for|to)?\s*["']?([^"'\n,]+)/i);
  if (targetMatch) {
    entities.target = targetMatch[1].trim();
  }

  // Extract language
  const langMatch = input.match(/\b(typescript|javascript|python|react|html|css|json)\b/i);
  if (langMatch) {
    entities.language = langMatch[1].toLowerCase();
  }

  return entities;
}

/**
 * Determine workflow stage based on skill and context
 */
export function determineStage(
  skillType: SkillType,
  _previousStage?: string
): 'thinking' | 'planning' | 'coding' | 'testing' | 'reviewing' | 'done' {
  const stageMap: Record<SkillType, 'thinking' | 'planning' | 'coding' | 'testing' | 'reviewing' | 'done'> = {
    [SkillType.BRAINSTORM]: 'thinking',
    [SkillType.PLAN]: 'planning',
    [SkillType.CODE]: 'coding',
    [SkillType.DEBUG]: 'coding',
    [SkillType.REVIEW]: 'reviewing',
    [SkillType.SEARCH]: 'thinking',
    [SkillType.GENERAL]: 'done',
  };

  return stageMap[skillType];
}

/**
 * Build skill routing context for LLM
 */
export function buildSkillContext(
  input: string,
  skillType: SkillType
): Record<string, any> {
  const intent = detectIntent(input);
  const entities = extractEntities(input);
  const stage = determineStage(skillType);

  return {
    skillType,
    confidence: intent.confidence,
    stage,
    entities,
    requiresFiles: requiresFileContext(skillType),
    timestamp: Date.now(),
  };
}
