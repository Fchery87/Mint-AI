/**
 * Mint AI Terminal Types
 *
 * Defines types for terminal output and line management.
 */

/**
 * Type of terminal line content
 */
export type TerminalLineType = 'input' | 'output' | 'success' | 'error' | 'info';

/**
 * A single line in the terminal output
 */
export interface TerminalLine {
  /** Unique line ID */
  id: string;
  /** Line content */
  content: string;
  /** Type of line for styling */
  type: TerminalLineType;
  /** Timestamp when line was added */
  timestamp: number;
}
