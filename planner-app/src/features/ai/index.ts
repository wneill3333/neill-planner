/**
 * AI Feature Exports
 *
 * Barrel export for AI feature slice and thunks.
 */

// Export slice
export {
  default as aiReducer,
  openInput,
  closeInput,
  openPreview,
  closePreview,
  setQuery,
  clearAi,
  selectAiState,
  selectParsedTask,
  selectAiLoading,
  selectAiError,
  selectIsInputOpen,
  selectIsPreviewOpen,
} from './aiSlice';

// Export thunks
export {
  parseNaturalLanguageTask,
  type ThunkError,
} from './aiThunks';

// Export types
export type { AiState } from './aiSlice';
