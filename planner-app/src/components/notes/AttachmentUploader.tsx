import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import type { NoteAttachment } from '../../types/note.types';
import { ATTACHMENT_LIMITS } from '../../types/note.types';
import { AttachmentThumbnail } from './AttachmentThumbnail';

export interface AttachmentUploaderProps {
  existingAttachments?: NoteAttachment[];
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onRemoveExistingAttachment?: (attachmentId: string) => void;
  onViewAttachment?: (attachment: NoteAttachment) => void;
  isUploading?: boolean;
  disabled?: boolean;
  testId?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AttachmentUploader = memo(function AttachmentUploader({
  existingAttachments = [],
  pendingFiles,
  onAddFiles,
  onRemovePendingFile,
  onRemoveExistingAttachment,
  onViewAttachment,
  isUploading = false,
  disabled = false,
  testId,
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCount = existingAttachments.length + pendingFiles.length;
  const canAddMore = totalCount < ATTACHMENT_LIMITS.maxAttachments;

  // Create object URLs for pending image files and clean them up on change/unmount
  const pendingImageUrls = useMemo(() => {
    return pendingFiles.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    );
  }, [pendingFiles]);

  useEffect(() => {
    return () => {
      pendingImageUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [pendingImageUrls]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Validate count
    const newTotal = existingAttachments.length + pendingFiles.length + selectedFiles.length;
    if (newTotal > ATTACHMENT_LIMITS.maxAttachments) {
      setError(`Cannot add ${selectedFiles.length} files. Maximum ${ATTACHMENT_LIMITS.maxAttachments} attachments per note.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (file.size > ATTACHMENT_LIMITS.maxFileSizeBytes) {
        setError(`"${file.name}" exceeds the ${ATTACHMENT_LIMITS.maxFileSizeBytes / (1024 * 1024)}MB limit.`);
        return;
      }
      const allowedTypes: readonly string[] = ATTACHMENT_LIMITS.allowedMimeTypes;
      if (!allowedTypes.includes(file.type)) {
        setError(`"${file.name}" has an unsupported file type (${file.type || 'unknown'}).`);
        return;
      }
      validFiles.push(file);
    }

    // Validate total size
    const existingSize = existingAttachments.reduce((sum, a) => sum + a.sizeBytes, 0);
    const pendingSize = pendingFiles.reduce((sum, f) => sum + f.size, 0);
    const newSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    if (existingSize + pendingSize + newSize > ATTACHMENT_LIMITS.maxTotalSizeBytes) {
      setError(`Total attachment size would exceed ${ATTACHMENT_LIMITS.maxTotalSizeBytes / (1024 * 1024)}MB limit.`);
      return;
    }

    onAddFiles(validFiles);

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [existingAttachments, pendingFiles, onAddFiles]);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2" data-testid={testId || 'attachment-uploader'}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Attachments
          {totalCount > 0 && (
            <span className="ml-1 text-gray-400 font-normal">
              ({totalCount}/{ATTACHMENT_LIMITS.maxAttachments})
            </span>
          )}
        </label>
        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={isUploading}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="add-attachment-button"
          >
            + Add File
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="attachment-file-input"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600" data-testid="attachment-error">
          {error}
        </p>
      )}

      {/* Upload spinner */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Uploading...
        </div>
      )}

      {/* Attachment grid */}
      {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {/* Existing attachments */}
          {existingAttachments.map((attachment) => (
            <AttachmentThumbnail
              key={attachment.id}
              attachment={attachment}
              onRemove={!disabled ? onRemoveExistingAttachment : undefined}
              onView={onViewAttachment}
            />
          ))}

          {/* Pending files (not yet uploaded) */}
          {pendingFiles.map((file, index) => (
            <div
              key={`pending-${index}`}
              className="group relative inline-block"
              title={`${file.name} (${formatFileSize(file.size)}) - pending upload`}
              data-testid={`pending-file-${index}`}
            >
              <div className="
                w-20 h-20 rounded-lg overflow-hidden
                border-2 border-dashed border-gray-300
                flex items-center justify-center
                bg-gray-50 text-gray-500
              ">
                {pendingImageUrls[index] ? (
                  <img
                    src={pendingImageUrls[index]}
                    alt={file.name}
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div className="flex flex-col items-center text-xs">
                    <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                    </svg>
                    <span className="text-[10px] mt-0.5 text-gray-400 truncate max-w-[72px]">{file.name}</span>
                  </div>
                )}
              </div>
              {/* Remove pending file button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemovePendingFile(index)}
                  className="
                    absolute -top-1.5 -right-1.5
                    w-5 h-5 rounded-full
                    bg-gray-500 text-white
                    flex items-center justify-center
                    text-xs font-bold leading-none
                    opacity-0 group-hover:opacity-100
                    hover:bg-gray-600
                    focus:outline-none focus:opacity-100
                    transition-opacity duration-150
                    shadow-sm
                  "
                  title="Remove pending file"
                  data-testid={`remove-pending-${index}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
