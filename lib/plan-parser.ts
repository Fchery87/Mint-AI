/**
 * Plan Parser - Parses structured plan output from LLM
 *
 * Extracts execution plans, steps, and questions from LLM responses
 * that follow the Plan mode format with XML-like tags.
 */

import type {
  ExecutionPlan,
  PlanStep,
  ClarifyingQuestion,
} from '@/types/plan-build';
import { PlanStatus, createEmptyPlan } from '@/types/plan-build';

/**
 * Parse a <question> tag from the LLM response
 */
export function parseQuestion(tag: string): ClarifyingQuestion | null {
  // Match: <question required="true" id="q1" options="A,B,C">Question text?</question>
  const match = tag.match(
    /<question\s+(?:required="(true|false)")?\s*(?:id="([^"]*)")?\s*(?:options="([^"]*)")?\s*>([^<]+)<\/question>/i,
  );

  if (!match) return null;

  const [, required, id, options, question] = match;

  return {
    id: id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    question: question.trim(),
    options: options ? options.split(',').map((o) => o.trim()) : undefined,
    required: required !== 'false',
    answer: undefined,
  };
}

/**
 * Parse a <step> tag from the LLM response
 */
export function parseStep(tag: string): PlanStep | null {
  // Match: <step id="1" complexity="low" files="path.ts" depends="0">Title\nDescription</step>
  const match = tag.match(
    /<step\s+(?:id="([^"]*)")?\s*(?:complexity="(low|medium|high)")?\s*(?:files="([^"]*)")?\s*(?:depends="([^"]*)")?\s*>([^<]+)<\/step>/i,
  );

  if (!match) return null;

  const [, id, complexity, files, depends, content] = match;
  const lines = content.trim().split('\n');
  const title = lines[0]?.trim() || 'Untitled Step';
  const description = lines.slice(1).join('\n').trim() || '';

  // Parse files - could be for modification or creation
  const fileList = files ? files.split(',').map((f) => f.trim()) : [];

  return {
    id: id || `step_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    order: parseInt(id || '0', 10) || 0,
    title,
    description,
    status: 'pending',
    filesToModify: fileList.length > 0 ? fileList : undefined,
    estimatedComplexity: (complexity as 'low' | 'medium' | 'high') || 'medium',
    dependencies: depends ? depends.split(',').map((d) => d.trim()) : undefined,
  };
}

/**
 * Parse a <plan> tag from the LLM response
 */
export function parsePlanTag(content: string): {
  title: string;
  steps: PlanStep[];
} {
  // Match the plan title
  const planMatch = content.match(/<plan\s+title="([^"]*)">/i);
  const title = planMatch?.[1] || 'Implementation Plan';

  // Extract all steps
  const stepMatches = content.matchAll(/<step[^>]*>[\s\S]*?<\/step>/gi);
  const steps: PlanStep[] = [];

  for (const match of stepMatches) {
    const step = parseStep(match[0]);
    if (step) {
      step.order = steps.length + 1;
      steps.push(step);
    }
  }

  return { title, steps };
}

/**
 * Extract all questions from LLM response
 */
export function extractQuestions(content: string): ClarifyingQuestion[] {
  const questionMatches = content.matchAll(
    /<question[^>]*>[^<]+<\/question>/gi,
  );
  const questions: ClarifyingQuestion[] = [];

  for (const match of questionMatches) {
    const question = parseQuestion(match[0]);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Parse complete LLM response and create an ExecutionPlan
 */
export function parsePlanResponse(
  content: string,
  existingPlan?: ExecutionPlan | null,
): ExecutionPlan {
  const plan = existingPlan ? { ...existingPlan } : createEmptyPlan('New Plan');

  // Extract questions
  const questions = extractQuestions(content);
  if (questions.length > 0) {
    plan.clarifyingQuestions = [
      ...plan.clarifyingQuestions,
      ...questions.filter(
        (q) =>
          !plan.clarifyingQuestions.find((existing) => existing.id === q.id),
      ),
    ];
    plan.status = PlanStatus.QUESTIONING;
  }

  // Look for a <plan> block
  const planBlockMatch = content.match(/<plan[^>]*>[\s\S]*?<\/plan>/i);
  if (planBlockMatch) {
    const { title, steps } = parsePlanTag(planBlockMatch[0]);
    plan.title = title;
    plan.steps = steps;
    plan.status =
      questions.length > 0 && questions.some((q) => q.required && !q.answer)
        ? PlanStatus.QUESTIONING
        : PlanStatus.READY;
  }

  plan.updatedAt = Date.now();
  return plan;
}

/**
 * Detect if LLM response contains plan elements
 */
export function containsPlanElements(content: string): boolean {
  return (
    content.includes('<plan') ||
    content.includes('<question') ||
    content.includes('<step')
  );
}

/**
 * Stream parser state for incremental plan parsing
 */
export interface PlanStreamParserState {
  buffer: string;
  currentPlan: ExecutionPlan | null;
  pendingQuestions: ClarifyingQuestion[];
  pendingSteps: PlanStep[];
  planStarted: boolean;
  inPlanBlock: boolean;
}

/**
 * Create initial parser state
 */
export function createPlanStreamParser(): PlanStreamParserState {
  return {
    buffer: '',
    currentPlan: null,
    pendingQuestions: [],
    pendingSteps: [],
    planStarted: false,
    inPlanBlock: false,
  };
}

/**
 * Process a chunk of streamed content and extract plan elements
 */
export function processPlanStreamChunk(
  state: PlanStreamParserState,
  chunk: string,
): {
  state: PlanStreamParserState;
  newQuestions: ClarifyingQuestion[];
  newSteps: PlanStep[];
  planTitle?: string;
  planComplete: boolean;
} {
  const newState = { ...state };
  newState.buffer += chunk;

  const newQuestions: ClarifyingQuestion[] = [];
  const newSteps: PlanStep[] = [];
  let planTitle: string | undefined;
  let planComplete = false;

  // Check for plan start
  const planStartMatch = newState.buffer.match(/<plan\s+title="([^"]*)">/i);
  if (planStartMatch && !newState.planStarted) {
    newState.planStarted = true;
    newState.inPlanBlock = true;
    planTitle = planStartMatch[1];
    newState.currentPlan = createEmptyPlan(planTitle);
  }

  // Extract complete questions from buffer
  let questionMatch;
  while (
    (questionMatch = newState.buffer.match(/<question[^>]*>[^<]+<\/question>/i))
  ) {
    const question = parseQuestion(questionMatch[0]);
    if (
      question &&
      !newState.pendingQuestions.find((q) => q.id === question.id)
    ) {
      newQuestions.push(question);
      newState.pendingQuestions.push(question);
    }
    // Remove matched question from buffer
    newState.buffer = newState.buffer.replace(questionMatch[0], '');
  }

  // Extract complete steps from buffer
  let stepMatch;
  while ((stepMatch = newState.buffer.match(/<step[^>]*>[\s\S]*?<\/step>/i))) {
    const step = parseStep(stepMatch[0]);
    if (step && !newState.pendingSteps.find((s) => s.id === step.id)) {
      step.order = newState.pendingSteps.length + 1;
      newSteps.push(step);
      newState.pendingSteps.push(step);
    }
    // Remove matched step from buffer
    newState.buffer = newState.buffer.replace(stepMatch[0], '');
  }

  // Check for plan end
  if (newState.buffer.includes('</plan>')) {
    newState.inPlanBlock = false;
    planComplete = true;
    newState.buffer = newState.buffer.replace(/<\/plan>/i, '');
  }

  // Keep buffer size manageable (keep last 500 chars for partial matches)
  if (newState.buffer.length > 1000) {
    newState.buffer = newState.buffer.slice(-500);
  }

  return {
    state: newState,
    newQuestions,
    newSteps,
    planTitle,
    planComplete,
  };
}

/**
 * Finalize plan from stream parser state
 */
export function finalizePlanFromStream(
  state: PlanStreamParserState,
): ExecutionPlan | null {
  if (!state.currentPlan) return null;

  const plan = { ...state.currentPlan };
  plan.steps = state.pendingSteps;
  plan.clarifyingQuestions = state.pendingQuestions;

  // Determine status
  const hasUnansweredRequired = state.pendingQuestions.some(
    (q) => q.required && !q.answer,
  );

  if (hasUnansweredRequired) {
    plan.status = PlanStatus.QUESTIONING;
  } else if (state.pendingSteps.length > 0) {
    plan.status = PlanStatus.READY;
  } else {
    plan.status = PlanStatus.DRAFTING;
  }

  plan.updatedAt = Date.now();
  return plan;
}
