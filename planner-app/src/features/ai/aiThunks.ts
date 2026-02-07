/**
 * AI Async Thunks
 *
 * Redux Toolkit async thunks for AI-powered features.
 * Handles natural language task parsing via API.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ParseTaskRequest, ParsedTaskData, GenerateNoteRequest, ParsedNoteData } from '../../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Parse natural language input into structured task data
 *
 * @param request - Parse request with query, categories, and selected date
 * @returns Parsed task data with extracted fields
 */
export const parseNaturalLanguageTask = createAsyncThunk<
  ParsedTaskData,
  ParseTaskRequest,
  { rejectValue: ThunkError }
>(
  'ai/parseNaturalLanguageTask',
  async (request, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      let result: { success: boolean; data?: ParsedTaskData; error?: string };
      try {
        result = await response.json();
      } catch {
        return rejectWithValue({
          message: 'Invalid response from server. Please try again.',
        });
      }

      if (!response.ok) {
        return rejectWithValue({
          message: result.error || 'Failed to parse task',
        });
      }

      return result.data as ParsedTaskData;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Unable to connect to AI service',
      });
    }
  }
);

/**
 * Generate a structured note from voice/text input
 *
 * @param request - Generate request with query, categories, and selected date
 * @returns Parsed note data with title, category, and organized content
 */
export const generateNoteFromVoice = createAsyncThunk<
  ParsedNoteData,
  GenerateNoteRequest,
  { rejectValue: ThunkError }
>(
  'ai/generateNoteFromVoice',
  async (request, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      let result: { success: boolean; data?: ParsedNoteData; error?: string };
      try {
        result = await response.json();
      } catch {
        return rejectWithValue({
          message: 'Invalid response from server. Please try again.',
        });
      }

      if (!response.ok) {
        return rejectWithValue({
          message: result.error || 'Failed to generate note',
        });
      }

      // Validate required fields exist before returning
      const data = result.data;
      if (
        !data ||
        typeof data.title !== 'string' ||
        typeof data.content !== 'string'
      ) {
        return rejectWithValue({
          message: 'AI returned incomplete data. Please try again.',
        });
      }

      return data as ParsedNoteData;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Unable to connect to AI service',
      });
    }
  }
);
