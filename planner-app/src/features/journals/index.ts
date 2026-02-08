/**
 * Journals Feature Index
 *
 * Central export point for journals feature.
 */

// Redux exports
export { default as journalReducer } from './journalSlice';
export * from './journalSlice';
export * from './journalThunks';
export * from './hooks';

// Container components
export { JournalListContainer } from './JournalListContainer';
export type { JournalListContainerProps } from './JournalListContainer';

export { JournalDetailContainer } from './JournalDetailContainer';
export type { JournalDetailContainerProps } from './JournalDetailContainer';

export { JournalFormModal } from './JournalFormModal';
export type { JournalFormModalProps } from './JournalFormModal';

export { JournalEntryFormModal } from './JournalEntryFormModal';
export type { JournalEntryFormModalProps } from './JournalEntryFormModal';
