/**
 * Redux Store Configuration
 *
 * Central store configuration for Neill Planner application.
 * Uses Redux Toolkit for simplified setup and best practices.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import taskReducer from '../features/tasks/taskSlice';
import categoryReducer from '../features/categories/categorySlice';
import eventReducer from '../features/events/eventSlice';
import noteReducer from '../features/notes/noteSlice';
import googleCalendarReducer from '../features/googleCalendar/googleCalendarSlice';
import reminderReducer from '../features/reminders/reminderSlice';
import syncReducer from '../features/sync/syncSlice';
import filterReducer from '../features/filters/filterSlice';
import settingsReducer from '../features/settings/settingsSlice';
import searchReducer from '../features/search/searchSlice';

// =============================================================================
// Root Reducer
// =============================================================================

/**
 * Root reducer combining all feature slices.
 */
const rootReducer = combineReducers({
  tasks: taskReducer,
  categories: categoryReducer,
  events: eventReducer,
  notes: noteReducer,
  googleCalendar: googleCalendarReducer,
  reminders: reminderReducer,
  sync: syncReducer,
  filters: filterReducer,
  settings: settingsReducer,
  search: searchReducer,
});

// =============================================================================
// Store Configuration
// =============================================================================

/**
 * Configure and create the Redux store
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Serializable check configuration
      serializableCheck: {
        // Ignore these action types (useful for thunks with non-serializable payloads)
        ignoredActions: [
          'tasks/fetchTasksByDate/fulfilled',
          'tasks/createTask/fulfilled',
          'tasks/updateTaskAsync/fulfilled',
          'tasks/restoreTask/fulfilled',
          'tasks/fetchTasksByDateRange/fulfilled',
          'categories/fetchCategories/fulfilled',
          'categories/createCategory/fulfilled',
          'categories/updateCategoryAsync/fulfilled',
          'events/fetchUserEvents/fulfilled',
          'events/fetchEventsByDate/fulfilled',
          'events/createEvent/fulfilled',
          'events/updateEventAsync/fulfilled',
          'events/fetchRecurringEvents/fulfilled',
          'notes/fetchUserNotes/fulfilled',
          'notes/fetchNotesByDate/fulfilled',
          'notes/createNote/fulfilled',
          'notes/updateNoteAsync/fulfilled',
          'notes/restoreNote/fulfilled',
          'reminders/fetchUserReminders/fulfilled',
          'reminders/fetchRemindersForItem/fulfilled',
          'reminders/createReminder/fulfilled',
          'reminders/updateReminder/fulfilled',
          'reminders/snoozeReminder/fulfilled',
          'reminders/dismissReminder/fulfilled',
          'reminders/fetchPendingReminders/fulfilled',
          'search/searchAll/fulfilled',
        ],
        // Ignore these paths in the state (Date objects in tasks, categories, and events)
        ignoredPaths: [
          'tasks.tasks',
          'categories.categories',
          'events.events',
          'events.recurringParentEvents',
          'notes.notes',
          'reminders.reminders',
          'reminders.activeNotifications',
        ],
        // Ignore Date values in action payloads
        ignoredActionPaths: [
          'payload.tasks',
          'payload.task',
          'payload.category',
          'payload.events',
          'payload.event',
          'payload.notes',
          'payload.note',
          'payload.reminder',
          'payload.reminders',
          'payload',
          'meta.arg',
        ],
      },
    }),
  // Enable Redux DevTools in development
  devTools: import.meta.env.MODE !== 'production',
});

// =============================================================================
// Type Exports
// =============================================================================

/**
 * RootState type inferred from the store
 * Use this type for useSelector hooks
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch type inferred from the store
 * Use this type for useDispatch hooks
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Store type for testing and other purposes
 */
export type AppStore = typeof store;
