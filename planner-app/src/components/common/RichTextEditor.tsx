/**
 * RichTextEditor Component
 *
 * Rich text editor using TipTap for note content.
 * Provides toolbar with formatting options and keyboard shortcuts.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

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
// Types
// =============================================================================

export interface RichTextEditorProps {
  /** Initial HTML content */
  content?: string;
  /** Callback when content changes */
  onChange?: (html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * RichTextEditor - TipTap-based rich text editor
 *
 * Features:
 * - Bold, Italic, Strike formatting
 * - Bullet and ordered lists
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
 * - Placeholder text
 * - HTML output
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   content={note.content}
 *   onChange={setContent}
 *   placeholder="Write your note here..."
 * />
 * ```
 */
export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  className = '',
  testId,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSupported = getSpeechRecognition() !== null;

  const toggleSpeechRecognition = useCallback(() => {
    if (!editor) return;

    if (isListening) {
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

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          // Insert finalized text at cursor
          const textToInsert = finalTranscript;
          finalTranscript = '';
          editor.chain().focus().insertContent(textToInsert).run();
        } else {
          interim += transcript;
        }
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
  }, [editor, isListening]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`border border-gray-300 rounded-lg bg-white ${className}`}
      data-testid={testId || 'rich-text-editor'}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm font-semibold rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          data-testid="toolbar-bold"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm italic rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          data-testid="toolbar-italic"
        >
          I
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 text-sm line-through rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('strike') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Strikethrough"
          aria-label="Strikethrough"
          data-testid="toolbar-strike"
        >
          S
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Bullet List"
          aria-label="Bullet List"
          data-testid="toolbar-bullet-list"
        >
          • List
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Numbered List"
          aria-label="Numbered List"
          data-testid="toolbar-ordered-list"
        >
          1. List
        </button>

        {speechSupported && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" aria-hidden="true" />
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 ${
                isListening ? 'bg-red-100 text-red-600' : 'bg-white text-gray-600'
              }`}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              data-testid="toolbar-mic"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span className="text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Listening...
                  </span>
                </>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
