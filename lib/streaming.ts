/**
 * Streaming Response Helper
 *
 * Provides utilities for streaming AI responses with structured event types
 * following the "thinking UI" pattern used by v0, Claude, and other AI coding tools.
 */

import { SkillType } from '@/types/skill';

export type StreamEventType = 
  | 'skill'       // Skill activation
  | 'progress'    // Progress update
  | 'thinking'    // Thinking/reasoning content
  | 'tool'        // Tool execution
  | 'text'        // Regular text response
  | 'code'        // Code block content
  | 'done'        // Stream complete
  | 'error';      // Error occurred

interface ThinkingProgress {
  stage: string;
  message: string;
  percent?: number;
}

interface ToolProgress {
  toolName: string;
  status: 'starting' | 'running' | 'complete' | 'error';
  message?: string;
}

interface ThinkingContent {
  thinkingType: string;
  content: string;
  isComplete: boolean;
}

interface SkillInfo {
  type: SkillType;
  stage: string;
  confidence: number;
}

/**
 * SSE-formatted event helper
 */
export function sseEvent(type: StreamEventType, data: any): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create a streaming response with proper SSE formatting
 */
export function createStreamingController() {
  const encoder = new TextEncoder();
  let sentEvents: string[] = [];

  function send(type: StreamEventType, data: any) {
    const event = sseEvent(type, data);
    sentEvents.push(event);
    return event;
  }

  return {
    send,
    sendSkill(skill: SkillInfo) {
      return send('skill', {
        type: skill.type,
        stage: skill.stage,
        confidence: skill.confidence,
      });
    },
    sendProgress(progress: ThinkingProgress) {
      return send('progress', {
        stage: progress.stage,
        message: progress.message,
        percent: progress.percent,
      });
    },
    sendThinking(content: ThinkingContent) {
      return send('thinking', {
        thinkingType: content.thinkingType,
        content: content.content,
        isComplete: content.isComplete,
      });
    },
    sendTool(tool: ToolProgress) {
      return send('tool', {
        toolName: tool.toolName,
        status: tool.status,
        message: tool.message,
      });
    },
    sendText(content: string, isCode = false) {
      return send('text', { content, isCode });
    },
    sendCode(content: string, language?: string) {
      return send('code', { content, language });
    },
    sendDone(metadata: { duration: number; tokens: number; toolCalls: number }) {
      return send('done', metadata);
    },
    sendError(error: string) {
      return send('error', { error });
    },
    getEncodedEvents() {
      return sentEvents.map(e => encoder.encode(e));
    },
  };
}

/**
 * Parse thinking type to a user-friendly label and icon
 */
export function getThinkingLabel(type: string): { label: string; icon: string; color: string } {
  const labels: Record<string, { label: string; icon: string; color: string }> = {
    requirements: { label: 'Requirements', icon: '📋', color: 'blue' },
    considerations: { label: 'Considerations', icon: '⚠️', color: 'amber' },
    approaches: { label: 'Approaches', icon: '💡', color: 'purple' },
    questions: { label: 'Questions', icon: '❓', color: 'cyan' },
    understanding: { label: 'Understanding', icon: '🎯', color: 'blue' },
    breakdown: { label: 'Breakdown', icon: '📋', color: 'indigo' },
    dependencies: { label: 'Dependencies', icon: '🔗', color: 'slate' },
    challenges: { label: 'Challenges', icon: '⚠️', color: 'amber' },
    architecture: { label: 'Architecture', icon: '🏗️', color: 'purple' },
    components: { label: 'Components', icon: '📦', color: 'green' },
    edgecases: { label: 'Edge Cases', icon: '⚠️', color: 'red' },
    analysis: { label: 'Analysis', icon: '🔍', color: 'blue' },
    hypothesis: { label: 'Hypothesis', icon: '💡', color: 'purple' },
    investigation: { label: 'Investigation', icon: '🔍', color: 'cyan' },
    solution: { label: 'Solution', icon: '✅', color: 'green' },
    overview: { label: 'Overview', icon: '🎯', color: 'blue' },
    correctness: { label: 'Correctness', icon: '✅', color: 'green' },
    bestpractices: { label: 'Best Practices', icon: '✨', color: 'purple' },
    improvements: { label: 'Improvements', icon: '💡', color: 'amber' },
    info: { label: 'Information', icon: 'ℹ️', color: 'blue' },
    approach: { label: 'Approach', icon: '🛤️', color: 'purple' },
    findings: { label: 'Findings', icon: '🔎', color: 'green' },
  };

  return labels[type] || { label: type, icon: '💭', color: 'mint' };
}

/**
 * Get stage labels for progress
 */
export function getStageInfo(stage: string): { label: string; icon: string } {
  const stages: Record<string, { label: string; icon: string }> = {
    idle: { label: 'Ready', icon: '🤖' },
    thinking: { label: 'Analyzing', icon: '🤔' },
    planning: { label: 'Planning', icon: '📋' },
    coding: { label: 'Writing code', icon: '💻' },
    testing: { label: 'Testing', icon: '🧪' },
    reviewing: { label: 'Reviewing', icon: '👀' },
    done: { label: 'Complete', icon: '✅' },
  };
  return stages[stage] || { label: stage, icon: '✨' };
}

/**
 * Tool names for display
 */
export function getToolLabel(toolName: string): { label: string; icon: string } {
  const tools: Record<string, { label: string; icon: string }> = {
    list_files: { label: 'Listing files', icon: '📁' },
    read_file: { label: 'Reading file', icon: '📄' },
    write_file: { label: 'Writing file', icon: '✏️' },
    web_search: { label: 'Searching web', icon: '🔍' },
    run_command: { label: 'Running command', icon: '⚡' },
  };
  return tools[toolName] || { label: toolName, icon: '🔧' };
}
