/**
 * Notes Feature Index
 *
 * Central export point for notes feature.
 */

// Redux exports
export { default as noteReducer } from './noteSlice';
export * from './noteSlice';
export * from './noteThunks';
export * from './hooks';

// Container components
export { NoteListContainer } from './NoteListContainer';
export type { NoteListContainerProps } from './NoteListContainer';

export { NoteFormModal } from './NoteFormModal';
export type { NoteFormModalProps } from './NoteFormModal';
