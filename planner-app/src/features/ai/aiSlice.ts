/**
 * AI Slice
 *
 * Redux Toolkit slice for AI feature state management.
 * Handles natural language input, task parsing, and preview state.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ParsedTaskData, ParsedNoteData } from '../../types';
import type { RootState } from '../../store';
import { parseNaturalLanguageTask, generateNoteFromVoice } from './aiThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the AI slice
 */
export interface AiState {
  /** Whether the AI input modal is open */
  isInputOpen: boolean;
  /** Whether the preview modal is open */
  isPreviewOpen: boolean;
  /** Current natural language query */
  query: string;
  /** Parsed task data from AI service */
  parsedTask: ParsedTaskData | null;
  /** Loading state for AI operations */
  loading: boolean;
  /** Error message if any */
  error: string | null;

  // Voice Note state
  /** Whether the voice note recorder modal is open */
  isVoiceNoteOpen: boolean;
  /** Whether the note preview modal is open */
  isNotePreviewOpen: boolean;
  /** Parsed note data from AI service */
  parsedNote: ParsedNoteData | null;
  /** Loading state for note generation */
  noteLoading: boolean;
  /** Error message for note generation */
  noteError: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: AiState = {
  isInputOpen: false,
  isPreviewOpen: false,
  query: '',
  parsedTask: null,
  loading: false,
  error: null,

  isVoiceNoteOpen: false,
  isNotePreviewOpen: false,
  parsedNote: null,
  noteLoading: false,
  noteError: null,
};

// =============================================================================
// Slice
// =============================================================================

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    /**
     * Open the AI input modal
     */
    openInput: (state) => {
      state.isInputOpen = true;
      state.error = null;
    },

    /**
     * Close the AI input modal
     */
    closeInput: (state) => {
      state.isInputOpen = false;
      state.query = '';
      state.error = null;
    },

    /**
     * Open the preview modal
     */
    openPreview: (state) => {
      state.isPreviewOpen = true;
    },

    /**
     * Close the preview modal
     */
    closePreview: (state) => {
      state.isPreviewOpen = false;
    },

    /**
     * Set the current query
     */
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },

    /**
     * Open the voice note recorder modal
     */
    openVoiceNote: (state) => {
      state.isVoiceNoteOpen = true;
      state.noteError = null;
    },

    /**
     * Close the voice note recorder modal
     */
    closeVoiceNote: (state) => {
      state.isVoiceNoteOpen = false;
      state.noteError = null;
    },

    /**
     * Open the note preview modal
     */
    openNotePreview: (state) => {
      state.isNotePreviewOpen = true;
    },

    /**
     * Close the note preview modal
     */
    closeNotePreview: (state) => {
      state.isNotePreviewOpen = false;
    },

    /**
     * Clear all note AI state
     */
    clearNoteAi: (state) => {
      state.isVoiceNoteOpen = false;
      state.isNotePreviewOpen = false;
      state.parsedNote = null;
      state.noteLoading = false;
      state.noteError = null;
    },

    /**
     * Clear all AI state (useful for logout or reset)
     */
    clearAi: (state) => {
      state.isInputOpen = false;
      state.isPreviewOpen = false;
      state.query = '';
      state.parsedTask = null;
      state.loading = false;
      state.error = null;
      state.isVoiceNoteOpen = false;
      state.isNotePreviewOpen = false;
      state.parsedNote = null;
      state.noteLoading = false;
      state.noteError = null;
    },
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // parseNaturalLanguageTask
    // ==========================================================================
    builder
      .addCase(parseNaturalLanguageTask.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.parsedTask = null;
      })
      .addCase(parseNaturalLanguageTask.fulfilled, (state, action) => {
        state.loading = false;
        state.parsedTask = action.payload;
        state.isInputOpen = false;
        state.isPreviewOpen = true;
      })
      .addCase(parseNaturalLanguageTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to parse task';
      });

    // ==========================================================================
    // generateNoteFromVoice
    // ==========================================================================
    builder
      .addCase(generateNoteFromVoice.pending, (state) => {
        state.noteLoading = true;
        state.noteError = null;
        state.parsedNote = null;
      })
      .addCase(generateNoteFromVoice.fulfilled, (state, action) => {
        state.noteLoading = false;
        state.parsedNote = action.payload;
        state.isVoiceNoteOpen = false;
        state.isNotePreviewOpen = true;
      })
      .addCase(generateNoteFromVoice.rejected, (state, action) => {
        state.noteLoading = false;
        state.noteError = action.payload?.message || 'Failed to generate note';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  openInput,
  closeInput,
  openPreview,
  closePreview,
  setQuery,
  openVoiceNote,
  closeVoiceNote,
  openNotePreview,
  closeNotePreview,
  clearNoteAi,
  clearAi,
} = aiSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select the entire AI state
 */
export const selectAiState = (state: RootState): AiState => state.ai;

/**
 * Select the parsed task data
 */
export const selectParsedTask = (state: RootState): ParsedTaskData | null => state.ai.parsedTask;

/**
 * Select loading state
 */
export const selectAiLoading = (state: RootState): boolean => state.ai.loading;

/**
 * Select error state
 */
export const selectAiError = (state: RootState): string | null => state.ai.error;

/**
 * Select whether the input modal is open
 */
export const selectIsInputOpen = (state: RootState): boolean => state.ai.isInputOpen;

/**
 * Select whether the preview modal is open
 */
export const selectIsPreviewOpen = (state: RootState): boolean => state.ai.isPreviewOpen;

/**
 * Select whether the voice note recorder is open
 */
export const selectIsVoiceNoteOpen = (state: RootState): boolean => state.ai.isVoiceNoteOpen;

/**
 * Select whether the note preview modal is open
 */
export const selectIsNotePreviewOpen = (state: RootState): boolean => state.ai.isNotePreviewOpen;

/**
 * Select the parsed note data
 */
export const selectParsedNote = (state: RootState): ParsedNoteData | null => state.ai.parsedNote;

/**
 * Select note loading state
 */
export const selectNoteLoading = (state: RootState): boolean => state.ai.noteLoading;

/**
 * Select note error state
 */
export const selectNoteError = (state: RootState): string | null => state.ai.noteError;

// =============================================================================
// Reducer Export
// =============================================================================

export default aiSlice.reducer;
