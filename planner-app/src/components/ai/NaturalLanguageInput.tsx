/**
 * NaturalLanguageInput Component
 *
 * Floating action button (FAB) with popover for natural language task entry.
 * Allows users to describe tasks in plain English via typing or voice input.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Loader2, X, Mic, MicOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../features/auth';
import {
  selectIsInputOpen,
  selectAiLoading,
  selectAiError,
  openInput,
  closeInput,
} from '../../features/ai/aiSlice';
import { parseNaturalLanguageTask } from '../../features/ai/aiThunks';
import { selectAllCategories } from '../../features/categories/categorySlice';
import { selectSelectedDate } from '../../features/tasks/taskSlice';

// =============================================================================
// Constants
// =============================================================================

const MAX_QUERY_LENGTH = 500;

// Web Speech API types (not included in default TypeScript lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionInstance)
    | null;
}

// =============================================================================
// Component
// =============================================================================

export function NaturalLanguageInput() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const isInputOpen = useAppSelector(selectIsInputOpen);
  const loading = useAppSelector(selectAiLoading);
  const error = useAppSelector(selectAiError);
  const categories = useAppSelector(selectAllCategories);
  const selectedDate = useAppSelector(selectSelectedDate);

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => getSpeechRecognition() !== null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleClose = useCallback(() => {
    // Stop speech recognition if active
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    dispatch(closeInput());
    setQuery('');
  }, [dispatch]);

  // Focus textarea when popover opens
  useEffect(() => {
    if (isInputOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isInputOpen]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        fabRef.current &&
        !fabRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    }

    if (isInputOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isInputOpen, handleClose]);

  // Handle escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }

    if (isInputOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isInputOpen, handleClose]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleToggle = () => {
    if (isInputOpen) {
      handleClose();
    } else {
      dispatch(openInput());
      setQuery('');
    }
  };

  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;

    // Stop listening if active
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }

    dispatch(
      parseNaturalLanguageTask({
        query: trimmedQuery,
        categories: categories.map((cat) => ({ id: cat.id, name: cat.name })),
        selectedDate,
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_QUERY_LENGTH) {
      setQuery(value);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Track the text that existed before we started listening
    const textBeforeListening = query;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const combined = textBeforeListening
        ? textBeforeListening + ' ' + transcript
        : transcript;

      if (combined.length <= MAX_QUERY_LENGTH) {
        setQuery(combined);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const isSubmitDisabled = !query.trim() || loading;

  // Only render when user is authenticated
  if (!user) return null;

  return (
    <>
      {/* FAB Button */}
      <button
        ref={fabRef}
        type="button"
        onClick={handleToggle}
        className={`
          fixed bottom-24 right-6 z-40
          w-12 h-12 rounded-full
          text-white shadow-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
          hover:scale-110
          ${isInputOpen ? 'bg-violet-700' : 'bg-violet-500 hover:bg-violet-600'}
        `}
        aria-label={isInputOpen ? 'Close AI input' : 'Add task with natural language'}
        aria-expanded={isInputOpen}
        data-testid="ai-fab"
      >
        {isInputOpen ? (
          <X className="w-5 h-5 mx-auto" />
        ) : (
          <Sparkles className="w-5 h-5 mx-auto" />
        )}
      </button>

      {/* Popover */}
      {isInputOpen && (
        <div
          ref={popoverRef}
          className="
            fixed bottom-40 right-6 z-50
            w-80 bg-white rounded-lg shadow-xl
            border border-gray-200
            p-4
          "
          role="dialog"
          aria-label="Natural language task input"
          data-testid="ai-input-popover"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-gray-900">Describe your task</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="
                p-1 rounded text-gray-400
                hover:bg-gray-100 hover:text-gray-600
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-violet-500
              "
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={3}
            placeholder={speechSupported
              ? 'Type or tap the mic to speak...'
              : 'e.g., "Call dentist next Tuesday, it\'s important"'
            }
            className={`
              w-full px-3 py-2 rounded-lg border
              text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              resize-none
              ${isListening ? 'border-red-400 bg-red-50' : 'border-gray-300'}
            `}
            aria-label="Task description"
            data-testid="ai-input-textarea"
          />

          {/* Character count and listening indicator */}
          <div className="mt-1 flex items-center justify-between">
            {isListening && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening...
              </span>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              {query.length}/{MAX_QUERY_LENGTH}
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mt-2 p-2 rounded bg-red-50 text-red-700 text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-2">
            {/* Mic button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                disabled={loading}
                className={`
                  p-2 rounded-lg transition-colors
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }
                `}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                data-testid="ai-input-mic"
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="
                flex-1 px-4 py-2 rounded-lg
                bg-violet-500 hover:bg-violet-600
                text-white text-sm font-medium
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                disabled:bg-gray-300 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
              data-testid="ai-input-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Parse Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default NaturalLanguageInput;
