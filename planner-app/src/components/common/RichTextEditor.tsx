/**
 * RichTextEditor Component
 *
 * Rich text editor using TipTap for note content.
 * Provides toolbar with formatting options and keyboard shortcuts.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

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
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
