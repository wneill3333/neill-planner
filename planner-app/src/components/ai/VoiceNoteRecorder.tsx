/**
 * VoiceNoteRecorder Component
 *
 * Modal for capturing voice input via Web Speech API.
 * Shows live transcript and sends to AI for structured note generation.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectIsVoiceNoteOpen,
  selectNoteLoading,
  selectNoteError,
  closeVoiceNote,
} from '../../features/ai/aiSlice';
import { generateNoteFromVoice } from '../../features/ai/aiThunks';
import { selectAllCategories } from '../../features/categories/categorySlice';
import { selectSelectedDate } from '../../features/tasks/taskSlice';
import { Modal } from '../common/Modal';

// =============================================================================
// Speech Recognition Types
// =============================================================================

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

export function VoiceNoteRecorder() {
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector(selectIsVoiceNoteOpen);
  const loading = useAppSelector(selectNoteLoading);
  const error = useAppSelector(selectNoteError);
  const categories = useAppSelector(selectAllCategories);
  const selectedDate = useAppSelector(selectSelectedDate);

  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => getSpeechRecognition() !== null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInterimText('');
      setIsListening(false);
    }
  }, [isOpen]);

  // Cleanup speech recognition on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let accumulated = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += resultText;
        } else {
          interim += resultText;
        }
      }

      if (finalText) {
        accumulated += (accumulated ? ' ' : '') + finalText;
        setTranscript(accumulated);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const handleClose = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
    dispatch(closeVoiceNote());
  }, [dispatch]);

  const handleProcess = useCallback(() => {
    const text = transcript.trim();
    if (!text || loading) return;

    // Stop listening if still active
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }

    dispatch(
      generateNoteFromVoice({
        query: text,
        categories: categories.map((cat) => ({ id: cat.id, name: cat.name })),
        selectedDate,
      })
    );
  }, [transcript, loading, categories, selectedDate, dispatch]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Voice Note"
      size="md"
    >
      <div className="space-y-4">
        {/* Speaking reminders */}
        <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 text-sm text-violet-800">
          <p className="font-medium mb-1">Remember to include:</p>
          <ul className="list-disc list-inside space-y-0.5 text-violet-700">
            <li><span className="font-medium">Title</span> - name of the note</li>
            <li><span className="font-medium">Category</span> - which category it belongs to</li>
            <li><span className="font-medium">Notes</span> - the content/details</li>
          </ul>
        </div>

        {/* Speech not supported warning */}
        {!speechSupported && (
          <div
            className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800"
            role="alert"
          >
            Speech recognition is not supported in this browser. You can type your note below instead.
          </div>
        )}

        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-700">Listening...</span>
          </div>
        )}

        {/* Transcript area */}
        <div>
          <label
            htmlFor="voice-transcript"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Transcript
          </label>
          <textarea
            id="voice-transcript"
            value={transcript + (interimText ? (transcript ? ' ' : '') + interimText : '')}
            onChange={(e) => {
              setTranscript(e.target.value);
              setInterimText('');
            }}
            rows={6}
            placeholder={speechSupported
              ? 'Tap the microphone to start speaking, or type here...'
              : 'Type your note content here...'
            }
            disabled={loading}
            className={`
              block w-full px-3 py-2 rounded-lg border transition-colors
              text-gray-900 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-offset-1
              focus:border-violet-500 focus:ring-violet-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              resize-none
              ${isListening ? 'border-red-300 bg-red-50/30' : 'border-gray-300'}
            `}
            data-testid="voice-transcript"
          />
          <p className="mt-1 text-xs text-gray-500">
            {transcript.length} characters
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          {/* Mic toggle button */}
          {speechSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`
                p-3 rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-violet-500'
                }
              `}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
              data-testid="voice-mic-button"
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Process button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={!transcript.trim() || loading}
            className="
              flex-1 px-4 py-2.5 rounded-lg
              bg-violet-500 hover:bg-violet-600
              text-white font-medium text-sm
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
              disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
            data-testid="voice-process-button"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Stop & Process</span>
            )}
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="
              px-4 py-2.5 rounded-lg
              bg-white hover:bg-gray-100
              text-gray-700 font-medium text-sm
              border border-gray-300
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            data-testid="voice-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default VoiceNoteRecorder;
