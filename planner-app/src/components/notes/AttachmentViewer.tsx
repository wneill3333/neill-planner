import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NoteAttachment } from '../../types/note.types';

export interface AttachmentViewerProps {
  /** The attachment currently being viewed */
  attachment: NoteAttachment;
  /** All attachments for navigation (optional) */
  attachments?: NoteAttachment[];
  /** Called when the viewer should close */
  onClose: () => void;
  /** Called when navigating to a different attachment */
  onNavigate?: (attachment: NoteAttachment) => void;
  /** Called to delete the attachment (omit for view-only mode) */
  onDelete?: (attachmentId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentViewer({
  attachment,
  attachments = [],
  onClose,
  onNavigate,
  onDelete,
}: AttachmentViewerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';

  // Find current index for navigation
  const currentIndex = attachments.findIndex((a) => a.id === attachment.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < attachments.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev && onNavigate) {
      onNavigate(attachments[currentIndex - 1]);
    }
  }, [hasPrev, onNavigate, attachments, currentIndex]);

  const goToNext = useCallback(() => {
    if (hasNext && onNavigate) {
      onNavigate(attachments[currentIndex + 1]);
    }
  }, [hasNext, onNavigate, attachments, currentIndex]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteConfirm) return; // Don't navigate during confirmation
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPrev, goToNext, showDeleteConfirm]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(attachment.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(attachment.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = attachment.downloadUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Shared file: ${attachment.fileName}`);
    const body = encodeURIComponent(
      `Here's a file I wanted to share with you:\n\n${attachment.fileName}\n${attachment.downloadUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleDownload = () => {
    window.open(attachment.downloadUrl, '_blank');
  };

  // Reset copied state when attachment changes
  useEffect(() => {
    setCopied(false);
    setShowDeleteConfirm(false);
  }, [attachment.id]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/90"
      data-testid="attachment-viewer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-sm font-medium truncate">{attachment.fileName}</h3>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatFileSize(attachment.sizeBytes)}
          </span>
          {attachments.length > 1 && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {currentIndex + 1} / {attachments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            title={copied ? 'Copied!' : 'Copy link'}
            data-testid="attachment-copy-link"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </button>

          {/* Email */}
          <button
            type="button"
            onClick={handleEmail}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            title="Send via email"
            data-testid="attachment-email"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            title="Download"
            data-testid="attachment-download"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-300 hover:text-red-400"
              title="Delete attachment"
              data-testid="attachment-delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white ml-2"
            title="Close (Esc)"
            data-testid="attachment-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Previous button */}
        {hasPrev && (
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            title="Previous"
            data-testid="attachment-prev"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Image viewer */}
        {isImage && (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
            <img
              src={attachment.downloadUrl}
              alt={attachment.fileName}
              className="max-w-full max-h-full object-contain"
              data-testid="attachment-image"
            />
          </div>
        )}

        {/* PDF viewer */}
        {isPdf && (
          <iframe
            src={attachment.downloadUrl}
            title={attachment.fileName}
            className="w-full h-full bg-white"
            data-testid="attachment-pdf"
          />
        )}

        {/* Unsupported type fallback */}
        {!isImage && !isPdf && (
          <div className="text-center text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">{attachment.fileName}</p>
            <p className="text-sm mt-1">Preview not available. Use download to view this file.</p>
          </div>
        )}

        {/* Next button */}
        {hasNext && (
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            title="Next"
            data-testid="attachment-next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Delete Attachment</h4>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete &ldquo;{attachment.fileName}&rdquo;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                data-testid="attachment-delete-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                data-testid="attachment-delete-confirm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
