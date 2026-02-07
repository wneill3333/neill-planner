/**
 * AI Feature Type Definitions
 *
 * Types for natural language task parsing and AI-powered features.
 */

// =============================================================================
// Request Types
// =============================================================================

/**
 * Request payload for natural language task parsing
 */
export interface ParseTaskRequest {
  /** Natural language input from the user */
  query: string;
  /** Available categories for categorization */
  categories: Array<{ id: string; name: string }>;
  /** Selected date in YYYY-MM-DD format */
  selectedDate: string;
}

// =============================================================================
// Response Types
// =============================================================================

/**
 * Parsed task data returned from AI service
 */
export interface ParsedTaskData {
  /** Extracted task title */
  title: string;
  /** Determined priority (A=Vital, B=Important, C=Optional, D=Delegate) */
  priority: 'A' | 'B' | 'C' | 'D';
  /** Parsed date in YYYY-MM-DD format (null if no date detected) */
  date: string | null;
  /** Parsed start time in HH:MM 24hr format (null if no time detected) */
  startTime: string | null;
  /** Matched category name (null if no category matched) */
  categoryName: string | null;
  /** Estimated duration in minutes (null if not specified) */
  duration: number | null;
  /** Confidence score for the parse (0-1) */
  confidence: number;
}

// =============================================================================
// Note Generation Types
// =============================================================================

/**
 * Request payload for AI voice note generation
 */
export interface GenerateNoteRequest {
  /** Transcribed speech text from the user */
  query: string;
  /** Available categories for categorization */
  categories: Array<{ id: string; name: string }>;
  /** Selected date in YYYY-MM-DD format */
  selectedDate: string;
}

/**
 * Parsed note data returned from AI service
 */
export interface ParsedNoteData {
  /** Extracted concise title */
  title: string;
  /** Matched category name (null if no category matched) */
  categoryName: string | null;
  /** Organized/summarized HTML content */
  content: string;
  /** Confidence score for the generation (0-1) */
  confidence: number;
}
