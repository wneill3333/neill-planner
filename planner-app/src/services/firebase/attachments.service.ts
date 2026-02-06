/**
 * Attachments Service
 *
 * Firebase Storage and Firestore service for note file attachments.
 * Handles upload, download URL generation, and deletion.
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import {
  doc,
  getDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db, storage } from './config';
import type { NoteAttachment } from '../../types/note.types';
import { ATTACHMENT_LIMITS } from '../../types/note.types';
import {
  validateUserId,
  ValidationError,
} from '../../utils/validation';

/** Firestore collection name for notes */
const NOTES_COLLECTION = 'notes';

/**
 * Generate a unique ID for an attachment
 */
function generateAttachmentId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate a single file against attachment limits
 */
function validateFile(file: File): void {
  if (file.size > ATTACHMENT_LIMITS.maxFileSizeBytes) {
    throw new ValidationError(
      `File "${file.name}" exceeds maximum size of ${ATTACHMENT_LIMITS.maxFileSizeBytes / (1024 * 1024)}MB`,
      'file',
      'FILE_TOO_LARGE'
    );
  }

  const allowedTypes: readonly string[] = ATTACHMENT_LIMITS.allowedMimeTypes;
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `File type "${file.type}" is not allowed. Allowed types: ${ATTACHMENT_LIMITS.allowedMimeTypes.join(', ')}`,
      'file',
      'INVALID_FILE_TYPE'
    );
  }
}

/**
 * Verify note ownership - returns the note data if authorized
 */
async function verifyNoteOwnership(noteId: string, userId: string): Promise<DocumentData> {
  const docRef = doc(db, NOTES_COLLECTION, noteId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new ValidationError('Note not found', 'noteId', 'NOT_FOUND');
  }

  const data = docSnap.data();
  if (data.userId !== userId) {
    throw new ValidationError('Unauthorized access to note', 'noteId', 'UNAUTHORIZED');
  }

  return data;
}

/**
 * Upload one or more files as attachments to a note.
 *
 * Validates files, verifies note ownership, uploads to Firebase Storage,
 * and appends attachment metadata to the Note's Firestore document.
 *
 * @param noteId - The note to attach files to
 * @param userId - The authenticated user's ID
 * @param files - Array of File objects to upload
 * @returns Array of NoteAttachment metadata for the uploaded files
 */
export async function uploadAttachments(
  noteId: string,
  userId: string,
  files: File[]
): Promise<NoteAttachment[]> {
  validateUserId(userId);

  if (!noteId || typeof noteId !== 'string') {
    throw new ValidationError('noteId is required', 'noteId', 'INVALID_NOTE_ID');
  }

  if (!files.length) {
    return [];
  }

  // Validate all files first
  for (const file of files) {
    validateFile(file);
  }

  // Verify ownership and get existing attachments
  const noteData = await verifyNoteOwnership(noteId, userId);
  const existingAttachments: NoteAttachment[] = noteData.attachments || [];

  // Check attachment count limit
  if (existingAttachments.length + files.length > ATTACHMENT_LIMITS.maxAttachments) {
    throw new ValidationError(
      `Cannot add ${files.length} files. Note already has ${existingAttachments.length} attachments (max ${ATTACHMENT_LIMITS.maxAttachments})`,
      'files',
      'TOO_MANY_ATTACHMENTS'
    );
  }

  // Check total size limit
  const existingTotalSize = existingAttachments.reduce((sum, a) => sum + a.sizeBytes, 0);
  const newTotalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (existingTotalSize + newTotalSize > ATTACHMENT_LIMITS.maxTotalSizeBytes) {
    throw new ValidationError(
      `Total attachment size would exceed ${ATTACHMENT_LIMITS.maxTotalSizeBytes / (1024 * 1024)}MB limit`,
      'files',
      'TOTAL_SIZE_EXCEEDED'
    );
  }

  // Upload files and collect metadata
  const newAttachments: NoteAttachment[] = [];

  for (const file of files) {
    const attachmentId = generateAttachmentId();
    const storagePath = `notes/${userId}/${noteId}/${attachmentId}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
      // Upload the file
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      const isImage = file.type.startsWith('image/');

      const attachment: NoteAttachment = {
        id: attachmentId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath,
        downloadUrl,
        thumbnailUrl: isImage ? downloadUrl : null,
        uploadedAt: new Date(),
      };

      newAttachments.push(attachment);
    } catch (error) {
      console.error(`Error uploading file "${file.name}":`, error);
      throw new Error(
        `Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Append new attachments to Firestore
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const allAttachments = [...existingAttachments, ...newAttachments];

    // Serialize for Firestore (Date -> ISO string for uploadedAt)
    const serializedAttachments = allAttachments.map((a) => ({
      ...a,
      uploadedAt: a.uploadedAt instanceof Date ? a.uploadedAt.toISOString() : a.uploadedAt,
    }));

    await updateDoc(docRef, {
      attachments: serializedAttachments,
    });
  } catch (error) {
    console.error('Error updating note with attachments:', error);
    throw new Error(
      `Failed to update note with attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return newAttachments;
}

/**
 * Delete a single attachment from a note.
 *
 * Verifies ownership, deletes the file from Storage,
 * and removes the attachment metadata from Firestore.
 *
 * @param noteId - The note containing the attachment
 * @param userId - The authenticated user's ID
 * @param attachmentId - The ID of the attachment to delete
 */
export async function deleteAttachment(
  noteId: string,
  userId: string,
  attachmentId: string
): Promise<void> {
  validateUserId(userId);

  if (!noteId || typeof noteId !== 'string') {
    throw new ValidationError('noteId is required', 'noteId', 'INVALID_NOTE_ID');
  }

  if (!attachmentId || typeof attachmentId !== 'string') {
    throw new ValidationError('attachmentId is required', 'attachmentId', 'INVALID_ATTACHMENT_ID');
  }

  // Verify ownership and get existing attachments
  const noteData = await verifyNoteOwnership(noteId, userId);
  const existingAttachments: NoteAttachment[] = noteData.attachments || [];

  // Find the attachment to delete
  const attachment = existingAttachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    throw new ValidationError('Attachment not found', 'attachmentId', 'NOT_FOUND');
  }

  // Delete from Storage
  try {
    const storageRef = ref(storage, attachment.storagePath);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    // If file doesn't exist in storage, continue with Firestore cleanup
    const firebaseError = error as { code?: string };
    if (firebaseError?.code !== 'storage/object-not-found') {
      console.error('Error deleting file from Storage:', error);
      throw new Error(
        `Failed to delete file from Storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Remove from Firestore
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const updatedAttachments = existingAttachments
      .filter((a) => a.id !== attachmentId)
      .map((a) => ({
        ...a,
        uploadedAt: a.uploadedAt instanceof Date ? a.uploadedAt.toISOString() : a.uploadedAt,
      }));

    await updateDoc(docRef, {
      attachments: updatedAttachments,
    });
  } catch (error) {
    console.error('Error updating note after attachment deletion:', error);
    throw new Error(
      `Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete all attachments for a note.
 *
 * Used when hard-deleting a note to clean up Storage files.
 *
 * @param noteId - The note whose attachments should be deleted
 * @param userId - The authenticated user's ID
 */
export async function deleteAllAttachments(
  noteId: string,
  userId: string
): Promise<void> {
  validateUserId(userId);

  if (!noteId || typeof noteId !== 'string') {
    return; // Silently skip if no noteId (note may not have attachments)
  }

  try {
    // List all files in the note's storage folder
    const folderRef = ref(storage, `notes/${userId}/${noteId}`);
    const listResult = await listAll(folderRef);

    // Delete each file
    const deletePromises = listResult.items.map((itemRef) =>
      deleteObject(itemRef).catch((error) => {
        console.warn(`Failed to delete storage object ${itemRef.fullPath}:`, error);
      })
    );

    await Promise.all(deletePromises);
  } catch (error: unknown) {
    // If folder doesn't exist, that's fine
    const firebaseError = error as { code?: string };
    if (firebaseError?.code !== 'storage/object-not-found') {
      console.warn('Error deleting note attachments from Storage:', error);
    }
  }
}
