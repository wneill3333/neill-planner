import { memo, useState } from 'react';
import type { NoteAttachment } from '../../types/note.types';

export interface AttachmentThumbnailProps {
  attachment: NoteAttachment;
  onRemove?: (attachmentId: string) => void;
  onView?: (attachment: NoteAttachment) => void;
  size?: 'sm' | 'md';
  testId?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AttachmentThumbnail = memo(function AttachmentThumbnail({
  attachment,
  onRemove,
  onView,
  size = 'md',
  testId,
}: AttachmentThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';

  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-20 h-20';
  const iconTextSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(attachment);
    }
  };

  return (
    <div
      className="group relative inline-block"
      title={`${attachment.fileName} (${formatFileSize(attachment.sizeBytes)})`}
      data-testid={testId || `attachment-thumb-${attachment.id}`}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`
          ${sizeClasses}
          rounded-lg overflow-hidden border border-gray-200
          hover:border-blue-400 hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-all duration-150 cursor-pointer
          flex items-center justify-center bg-gray-50
        `}
      >
        {isImage && !imageError ? (
          <img
            src={attachment.thumbnailUrl || attachment.downloadUrl}
            alt={attachment.fileName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : isPdf ? (
          <div className={`flex flex-col items-center justify-center text-red-600 ${iconTextSize}`}>
            <svg className={size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
              <path d="M8 12h3v1.5H9.5V14h1v1.5H8V12zm4 0h1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H12V12zm1 2h.5a.5.5 0 0 0 0-1H13v1zm2-2h2v1h-1v.5h1V14h-1v1.5h-1V12z"/>
            </svg>
            {size === 'md' && <span className="mt-0.5 font-medium">PDF</span>}
          </div>
        ) : (
          <div className={`text-gray-400 ${iconTextSize}`}>File</div>
        )}
      </button>

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(attachment.id);
          }}
          className="
            absolute -top-1.5 -right-1.5
            w-5 h-5 rounded-full
            bg-red-500 text-white
            flex items-center justify-center
            text-xs font-bold leading-none
            hover:bg-red-600
            focus:outline-none
            transition-opacity duration-150
            shadow-sm
          "
          title="Remove attachment"
          data-testid={`remove-attachment-${attachment.id}`}
        >
          &times;
        </button>
      )}
    </div>
  );
});
