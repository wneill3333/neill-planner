# Neill Planner — Implementation TODO

**Project:** Neill Planner - Franklin-Covey Productivity Application
**Created:** January 24, 2026
**Status:** In Progress
**Last Updated:** February 2, 2026 (Step 6.1.2 Complete)
**Estimated Duration:** 18-27 days

---

## Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 25/25 |
| Phase 2: Data Layer | ✅ Complete | 22/22 |
| Phase 3: Core Tasks | ✅ Complete | 59/59 |
| Phase 4: Date & Daily View | ✅ Complete | 26/26 |
| Phase 5: Categories | ✅ Complete | 15/15 |
| Phase 6: Recurring Tasks | 🔄 In Progress | 2/20 |
| Phase 7: Events & Calendar | ⬜ Not Started | 0/22 |
| Phase 8: Notes System | ⬜ Not Started | 0/16 |
| Phase 9: Google Calendar | ⬜ Not Started | 0/14 |
| Phase 10: Reminders | ⬜ Not Started | 0/12 |
| Phase 11: Offline Support | ⬜ Not Started | 0/12 |
| Phase 12: Polish & Deploy | ⬜ Not Started | 0/18 |
| **TOTAL** | | **152/261** |

---

## Technology Stack Reference

- **Frontend:** React 18+ with TypeScript
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Testing:** Vitest + React Testing Library + Cypress
- **Build Tool:** Vite

---

# PHASE 1: Project Foundation & Core Infrastructure

**Estimated Time:** 1-2 days
**Dependencies:** None (starting point)

---

## 1.1 Project Scaffolding

### Step 1.1.1: Create React Project with TypeScript

- [x] **Initialize Vite project** ✅ Completed 2026-01-24
  - [x] Run `npm create vite@latest neill-planner -- --template react-ts`
  - [x] Navigate into project directory
  - [x] Verify initial project runs with `npm run dev`

- [x] **Install core dependencies** ✅ Completed 2026-01-24
  - [x] Install react-router-dom v6+: `npm install react-router-dom`
  - [x] Install Redux Toolkit: `npm install @reduxjs/toolkit react-redux`
  - [x] Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
  - [x] Install Firebase: `npm install firebase`
  - [x] Install date-fns: `npm install date-fns`
  - [x] Install Node types: `npm install -D @types/node`

- [x] **Install dev/testing dependencies** ✅ Completed 2026-01-24
  - [x] Install Vitest: `npm install -D vitest @vitest/ui`
  - [x] Install Testing Library: `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`
  - [x] Install jsdom: `npm install -D jsdom`
  - [x] Install type definitions: `npm install -D @types/react @types/react-dom`

- [x] **Create folder structure** ✅ Completed 2026-01-24
  - [x] Create `src/components/common/`
  - [x] Create `src/components/tasks/`
  - [x] Create `src/components/events/`
  - [x] Create `src/components/notes/`
  - [x] Create `src/components/categories/`
  - [x] Create `src/components/layout/`
  - [x] Create `src/components/icons/`
  - [x] Create `src/features/auth/`
  - [x] Create `src/features/tasks/`
  - [x] Create `src/features/events/`
  - [x] Create `src/features/notes/`
  - [x] Create `src/features/categories/`
  - [x] Create `src/hooks/`
  - [x] Create `src/services/firebase/`
  - [x] Create `src/services/sync/`
  - [x] Create `src/store/`
  - [x] Create `src/types/`
  - [x] Create `src/utils/`
  - [x] Create `src/test/`

- [x] **Configure Tailwind CSS** ✅ Completed 2026-01-24
  - [x] Run `npx tailwindcss init -p`
  - [x] Configure content paths in `tailwind.config.js`
  - [x] Add Tailwind directives to `src/index.css`
  - [x] Verify Tailwind classes work in App.tsx

- [x] **Configure Vitest** ✅ Completed 2026-01-24
  - [x] Create `vitest.config.ts`
  - [x] Configure jsdom environment
  - [x] Create `src/test/setup.ts` with Testing Library setup
  - [x] Update `package.json` with test scripts

- [x] **Create initial App component** ✅ Completed 2026-01-24
  - [x] Update `App.tsx` to render "Neill Planner" heading
  - [x] Add basic Tailwind styling

- [x] **Write first tests** ✅ Completed 2026-01-24 (6 tests passing)
  - [x] Create `src/App.test.tsx`
  - [x] Test App component renders without crashing
  - [x] Test "Neill Planner" text is present
  - [x] Verify all tests pass: `npm test`

- [x] **Verify complete setup** ✅ Completed 2026-01-24
  - [x] Run `npm run dev` - app displays correctly
  - [x] Run `npm test` - all tests pass (6/6)
  - [x] Run `npm run build` - builds without errors

---

### Step 1.1.2: Configure ESLint and Prettier

- [x] **Install ESLint dependencies** ✅ Completed 2026-01-25 (Already included in Vite template)
  - [x] Install ESLint: `npm install -D eslint`
  - [x] Install TypeScript ESLint: `npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin`
  - [x] Install React hooks plugin: `npm install -D eslint-plugin-react-hooks`
  - [x] Install React refresh plugin: `npm install -D eslint-plugin-react-refresh`

- [x] **Install Prettier** ✅ Completed 2026-01-25
  - [x] Install Prettier: `npm install -D prettier`
  - [x] Install ESLint Prettier config: `npm install -D eslint-config-prettier`

- [x] **Create ESLint configuration** ✅ Completed 2026-01-25 (Updated eslint.config.js with flat config)
  - [x] Create `.eslintrc.cjs` file (Using modern flat config instead)
  - [x] Configure extends (eslint:recommended, typescript, react-hooks)
  - [x] Configure parser (@typescript-eslint/parser)
  - [x] Configure plugins (react-refresh)
  - [x] Add React best practice rules
  - [x] Configure ignore patterns (dist, node_modules)

- [x] **Create Prettier configuration** ✅ Completed 2026-01-25
  - [x] Create `.prettierrc` file
  - [x] Set semi: true
  - [x] Set singleQuote: true
  - [x] Set tabWidth: 2
  - [x] Set trailingComma: 'es5'
  - [x] Set printWidth: 100

- [x] **Create ignore files** ✅ Completed 2026-01-25
  - [x] Create `.prettierignore` (dist, node_modules, coverage)
  - [x] Update `.eslintignore` if needed (Using globalIgnores in flat config)

- [x] **Add npm scripts** ✅ Completed 2026-01-25
  - [x] Add "lint" script to package.json
  - [x] Add "lint:fix" script to package.json
  - [x] Add "format" script to package.json
  - [x] Add "format:check" script to package.json

- [x] **Verify configuration** ✅ Completed 2026-01-25
  - [x] Run `npm run lint` - passes with no errors
  - [x] Run `npm run format:check` - passes
  - [x] Fix any existing lint issues (formatted 5 files)

---

## 1.2 Type Definitions

### Step 1.2.1: Define Core Type Definitions - Task

- [x] **Create task types file** ✅ Completed 2026-01-25
  - [x] Create `src/types/task.types.ts`

- [x] **Define TaskPriority type** ✅ Completed 2026-01-25
  - [x] Create interface with letter: 'A' | 'B' | 'C' | 'D'
  - [x] Add number: number field

- [x] **Define TaskStatus type** ✅ Completed 2026-01-25
  - [x] Create union type: 'in_progress' | 'forward' | 'complete' | 'delete' | 'delegate'

- [x] **Define TaskStatusSymbols constant** ✅ Completed 2026-01-25
  - [x] Map in_progress to '●'
  - [x] Map forward to '➜'
  - [x] Map complete to '✔'
  - [x] Map delete to '✘'
  - [x] Map delegate to '◯'

- [x] **Define RecurrenceType** ✅ Completed 2026-01-25
  - [x] Create union: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

- [x] **Define RecurrenceEndCondition interface** ✅ Completed 2026-01-25
  - [x] Add type: 'never' | 'date' | 'occurrences'
  - [x] Add endDate: Date | null
  - [x] Add maxOccurrences: number | null

- [x] **Define RecurrencePattern interface** ✅ Completed 2026-01-25
  - [x] Add type: RecurrenceType
  - [x] Add interval: number
  - [x] Add daysOfWeek: number[]
  - [x] Add dayOfMonth: number | null
  - [x] Add monthOfYear: number | null
  - [x] Add endCondition: RecurrenceEndCondition
  - [x] Add exceptions: Date[]

- [x] **Define Task interface** ✅ Completed 2026-01-25
  - [x] Add all required fields (id, userId, title, description, etc.)
  - [x] Add categoryId: string | null
  - [x] Add priority: TaskPriority
  - [x] Add status: TaskStatus
  - [x] Add scheduledDate, scheduledTime
  - [x] Add recurrence: RecurrencePattern | null
  - [x] Add linkedNoteIds, linkedEventId
  - [x] Add recurring instance fields
  - [x] Add timestamp fields (createdAt, updatedAt, deletedAt)

- [x] **Define input types** ✅ Completed 2026-01-25
  - [x] Create CreateTaskInput (omit auto-generated fields)
  - [x] Create UpdateTaskInput (Partial + id required)

- [x] **Create types index** ✅ Completed 2026-01-25
  - [x] Create `src/types/index.ts`
  - [x] Export all task types

- [x] **Write type tests** ✅ Completed 2026-01-25 (30 tests passing)
  - [x] Create `src/types/__tests__/task.types.test.ts`
  - [x] Test valid Task objects compile
  - [x] Test invalid objects fail compilation with @ts-expect-error

- [x] **Verify types** ✅ Completed 2026-01-25
  - [x] Run `npm run lint` - passes
  - [x] Run `npm run build` - compiles correctly

---

### Step 1.2.2: Define Core Type Definitions - Event, Category, Note, User

- [x] **Create Event types** ✅ Completed 2026-01-25
  - [x] Create `src/types/event.types.ts`
  - [x] Define Event interface with all fields
  - [x] Add confidential fields (isConfidential, alternateTitle)
  - [x] Add Google Calendar ID field
  - [x] Create CreateEventInput and UpdateEventInput

- [x] **Create Category types** ✅ Completed 2026-01-25
  - [x] Create `src/types/category.types.ts`
  - [x] Define CATEGORY_COLORS constant array (8 colors)
  - [x] Define Category interface
  - [x] Create CreateCategoryInput and UpdateCategoryInput

- [x] **Create Note types** ✅ Completed 2026-01-25
  - [x] Create `src/types/note.types.ts`
  - [x] Define Note interface
  - [x] Add linkedTaskIds and linkedEventIds arrays
  - [x] Create CreateNoteInput and UpdateNoteInput

- [x] **Create User types** ✅ Completed 2026-01-25
  - [x] Create `src/types/user.types.ts`
  - [x] Define UserRole type: 'admin' | 'standard'
  - [x] Define User interface
  - [x] Define UserSettings interface with all preferences

- [x] **Create common types** ✅ Completed 2026-01-25
  - [x] Create `src/types/common.types.ts`
  - [x] Define SyncStatus type
  - [x] Define any shared utility types (SyncQueueItem, DateRange, ApiResponse, ValidationResult, etc.)

- [x] **Update types index** ✅ Completed 2026-01-25
  - [x] Export all new types from `src/types/index.ts`
  - [x] Verify no circular dependencies

- [x] **Write type tests for all new types** ✅ Completed 2026-01-25 (154 total tests passing)
  - [x] Test Event types (15 tests)
  - [x] Test Category types (19 tests)
  - [x] Test Note types (21 tests)
  - [x] Test User types (31 tests)
  - [x] Test Common types (32 tests)

---

## 1.3 Firebase Configuration

### Step 1.3.1: Firebase Configuration Setup

- [x] **Create Firebase config file** ✅ Completed 2026-01-30
  - [x] Create `src/services/firebase/config.ts`
  - [x] Import firebase/app
  - [x] Import firebase/auth
  - [x] Import firebase/firestore

- [x] **Define Firebase configuration** ✅ Completed 2026-01-30
  - [x] Create firebaseConfig object
  - [x] Read VITE_FIREBASE_API_KEY from env
  - [x] Read VITE_FIREBASE_AUTH_DOMAIN from env
  - [x] Read VITE_FIREBASE_PROJECT_ID from env
  - [x] Read VITE_FIREBASE_STORAGE_BUCKET from env
  - [x] Read VITE_FIREBASE_MESSAGING_SENDER_ID from env
  - [x] Read VITE_FIREBASE_APP_ID from env

- [x] **Initialize Firebase** ✅ Completed 2026-01-30
  - [x] Check if app already initialized
  - [x] Initialize Firebase app
  - [x] Export auth instance (getAuth)
  - [x] Export db instance (getFirestore)
  - [x] Export app instance

- [x] **Create environment files** ✅ Completed 2026-01-30
  - [x] Create `.env.example` with placeholder values
  - [x] Create `.env.local` with real values (gitignored)
  - [x] Add `.env.local` to `.gitignore`

- [x] **Create Firebase index** ✅ Completed 2026-01-30
  - [x] Create `src/services/firebase/index.ts`
  - [x] Re-export auth, db, app

- [x] **Write Firebase config tests** ✅ Completed 2026-01-30 (7 tests)
  - [x] Create `src/services/firebase/__tests__/config.test.ts`
  - [x] Mock Firebase modules
  - [x] Test initializeApp called with correct config
  - [x] Test auth and db are exported
  - [x] Test app doesn't reinitialize

- [x] **Verify configuration** ✅ Completed 2026-01-30
  - [x] Ensure tests pass with mocked Firebase
  - [x] Update vite.config.ts for env variables if needed

---

### Step 1.3.2: Firestore Service Layer - Tasks

- [x] **Create tasks service file** ✅ Completed 2026-01-30
  - [x] Create `src/services/firebase/tasks.service.ts`
  - [x] Import Firestore functions
  - [x] Import db from config
  - [x] Import Task types

- [x] **Define collection constant** ✅ Completed 2026-01-30
  - [x] Define TASKS_COLLECTION = 'tasks'

- [x] **Create converter functions** ✅ Completed 2026-01-30
  - [x] Implement taskToFirestore() - convert Date to Timestamp
  - [x] Implement firestoreToTask() - convert Timestamp to Date, include doc ID

- [x] **Implement createTask function** ✅ Completed 2026-01-30
  - [x] Accept CreateTaskInput and userId
  - [x] Generate timestamps
  - [x] Set default values
  - [x] Add document to Firestore
  - [x] Return created task with ID

- [x] **Implement getTask function** ✅ Completed 2026-01-30
  - [x] Accept taskId
  - [x] Get document by ID
  - [x] Return null if not found
  - [x] Convert to Task type

- [x] **Implement getTasksByDate function** ✅ Completed 2026-01-30
  - [x] Accept userId and date
  - [x] Query with userId filter
  - [x] Filter by scheduledDate
  - [x] Exclude soft-deleted (deletedAt != null)
  - [x] Order by priority
  - [x] Return Task array

- [x] **Implement getTasksByDateRange function** ✅ Completed 2026-01-30
  - [x] Accept userId, startDate, endDate
  - [x] Query tasks within range
  - [x] Return Task array

- [x] **Implement updateTask function** ✅ Completed 2026-01-30
  - [x] Accept UpdateTaskInput
  - [x] Update updatedAt timestamp
  - [x] Merge with existing document
  - [x] Return updated task

- [x] **Implement softDeleteTask function** ✅ Completed 2026-01-30
  - [x] Accept taskId
  - [x] Set deletedAt to current timestamp

- [x] **Implement hardDeleteTask function** ✅ Completed 2026-01-30
  - [x] Accept taskId
  - [x] Permanently delete document

- [x] **Implement restoreTask function** ✅ Completed 2026-01-30
  - [x] Accept taskId
  - [x] Set deletedAt to null
  - [x] Return restored task

- [x] **Implement batchUpdateTasks function** ✅ Completed 2026-01-30
  - [x] Accept array of UpdateTaskInput
  - [x] Use Firestore batch/transaction
  - [x] Update multiple documents atomically

- [x] **Write service tests** ✅ Completed 2026-01-30 (12 tests)
  - [x] Create `src/services/firebase/__tests__/tasks.service.test.ts`
  - [x] Mock Firestore functions
  - [x] Test createTask
  - [x] Test getTask returns null for non-existent
  - [x] Test getTasksByDate filtering
  - [x] Test updateTask merges fields
  - [x] Test softDeleteTask
  - [x] Test restoreTask

- [x] **Export from Firebase index** ✅ Completed 2026-01-30
  - [x] Add tasks service exports to `src/services/firebase/index.ts`

---

## 1.4 Authentication Flow

### Step 1.4.1: Authentication Context and Hook

- [x] **Create auth feature folder structure** ✅ Completed 2026-01-30
  - [x] Ensure `src/features/auth/` exists

- [x] **Create AuthContext** ✅ Completed 2026-01-30
  - [x] Create `src/features/auth/AuthContext.tsx`
  - [x] Define AuthContextType interface
  - [x] Create AuthContext with createContext

- [x] **Implement AuthProvider component** ✅ Completed 2026-01-30
  - [x] Add user state (User | null)
  - [x] Add loading state (boolean, initial true)
  - [x] Add error state (string | null)
  - [x] Subscribe to onAuthStateChanged in useEffect
  - [x] Fetch/create user document on auth change
  - [x] Update lastLoginAt
  - [x] Set loading false when done
  - [x] Clean up subscription on unmount

- [x] **Implement signInWithGoogle** ✅ Completed 2026-01-30
  - [x] Create GoogleAuthProvider
  - [x] Call signInWithPopup
  - [x] Handle errors, set error state

- [x] **Implement signOut** ✅ Completed 2026-01-30
  - [x] Call Firebase signOut
  - [x] Clear user state

- [x] **Provide context value** ✅ Completed 2026-01-30
  - [x] Pass user, loading, error, signInWithGoogle, signOut

- [x] **Create useAuth hook** ✅ Completed 2026-01-30
  - [x] Create `src/features/auth/useAuth.ts`
  - [x] Use useContext(AuthContext)
  - [x] Throw error if used outside AuthProvider

- [x] **Create auth index** ✅ Completed 2026-01-30
  - [x] Create `src/features/auth/index.ts`
  - [x] Export AuthProvider, useAuth, AuthContext

- [x] **Create users service** ✅ Completed 2026-01-30
  - [x] Create `src/services/firebase/users.service.ts`
  - [x] Implement getUser function
  - [x] Implement createUser function
  - [x] Implement updateLastLogin function
  - [x] Implement getUserSettings function
  - [x] Implement updateUserSettings function

- [x] **Write auth tests** ✅ Completed 2026-01-30 (27 tests)
  - [x] Create `src/features/auth/__tests__/AuthContext.test.tsx`
  - [x] Mock Firebase auth
  - [x] Test AuthProvider renders children
  - [x] Test loading state initially true
  - [x] Test user state updates on auth change
  - [x] Test signInWithGoogle calls Firebase
  - [x] Test signOut clears user
  - [x] Test useAuth throws outside provider

- [x] **Update App.tsx** ✅ Completed 2026-01-30
  - [x] Wrap app with AuthProvider
  - [x] Show loading spinner while auth loading
  - [x] Conditionally render based on auth state

---

### Step 1.4.2: Login Page Component

- [x] **Create common components** ✅ Completed 2026-01-30
  - [x] Create `src/components/common/Button.tsx`
    - [x] Define props (variant, size, disabled, loading, children, onClick)
    - [x] Implement loading state with spinner
    - [x] Add Tailwind styling with variants
  - [x] Create `src/components/common/Spinner.tsx`
    - [x] Configurable size prop
    - [x] Tailwind animation
  - [x] Create `src/components/common/index.ts`
    - [x] Export Button, Spinner

- [x] **Create LoginPage component** ✅ Completed 2026-01-30
  - [x] Create `src/features/auth/LoginPage.tsx`
  - [x] Use useAuth hook
  - [x] Display app logo/title "Neill Planner"
  - [x] Display tagline "Franklin-Covey Productivity System"
  - [x] Add "Sign in with Google" button
  - [x] Handle loading state during sign-in
  - [x] Display error message if auth fails
  - [x] Style with Tailwind (centered, card, amber theme, responsive)

- [x] **Write component tests** ✅ Completed 2026-01-30
  - [x] Test Button renders children
  - [x] Test Button variants apply correct styles
  - [x] Test Button loading state shows spinner
  - [x] Test Spinner renders with correct size
  - [x] Test LoginPage renders app title
  - [x] Test LoginPage renders Google sign-in button
  - [x] Test clicking button calls signInWithGoogle
  - [x] Test displays error when present
  - [x] Test shows loading state

- [x] **Update App.tsx routing** ✅ Completed 2026-01-30
  - [x] Add react-router setup
  - [x] If not authenticated, show LoginPage
  - [x] If authenticated, show placeholder main app

- [x] **Create test utilities** ✅ Completed 2026-01-30
  - [x] Create `src/test/test-utils.tsx`
  - [x] Export custom render with providers (Redux, Auth, Router)
  - [x] Re-export @testing-library/react

- [x] **Verify login flow** ✅ Completed 2026-01-30
  - [x] All tests pass
  - [x] Login page displays correctly
  - [x] Auth flow works (with real Firebase or mocked)

---

# PHASE 2: Data Layer & State Management

**Estimated Time:** 1-2 days
**Dependencies:** Phase 1 complete

---

## 2.1 Redux Store Setup

### Step 2.1.1: Redux Store Configuration

- [x] **Create store file** ✅ Completed 2026-01-31
  - [x] Create `src/store/store.ts`
  - [x] Import configureStore from @reduxjs/toolkit
  - [x] Create store with empty reducer initially
  - [x] Export store
  - [x] Export RootState type
  - [x] Export AppDispatch type

- [x] **Create typed hooks** ✅ Completed 2026-01-31
  - [x] Create `src/store/hooks.ts`
  - [x] Create useAppDispatch hook
  - [x] Create useAppSelector hook

- [x] **Create store index** ✅ Completed 2026-01-31
  - [x] Create `src/store/index.ts`
  - [x] Export store, RootState, AppDispatch
  - [x] Export useAppDispatch, useAppSelector

- [x] **Update main.tsx** ✅ Completed 2026-01-31
  - [x] Import Provider from react-redux
  - [x] Wrap App with Provider, passing store

- [x] **Write store tests** ✅ Completed 2026-01-31 (67 tests: 21 store + 17 hooks + 29 test-utils)
  - [x] Create `src/store/__tests__/store.test.ts`
  - [x] Test store initializes without errors
  - [x] Test getState returns expected shape
  - [x] Test dispatch accepts actions

- [x] **Update test utilities** ✅ Completed 2026-01-31
  - [x] Update `src/test/test-utils.tsx` to include Redux Provider
  - [x] Update existing tests to use new render utility

---

## 2.2 Task Slice (CRUD)

### Step 2.2.1: Task Slice - Basic State

- [x] **Create task slice file** ✅ Completed 2026-01-31
  - [x] Create `src/features/tasks/taskSlice.ts`

- [x] **Define TasksState interface** ✅ Completed 2026-01-31
  - [x] Add tasks: Record<string, Task> (normalized)
  - [x] Add taskIdsByDate: Record<string, string[]>
  - [x] Add selectedDate: string
  - [x] Add loading: boolean
  - [x] Add error: string | null
  - [x] Add syncStatus: SyncStatus

- [x] **Define initial state** ✅ Completed 2026-01-31
  - [x] Initialize all fields with defaults
  - [x] Set selectedDate to today

- [x] **Create taskSlice with createSlice** ✅ Completed 2026-01-31
  - [x] Implement setTasks reducer
  - [x] Implement addTask reducer
  - [x] Implement updateTask reducer
  - [x] Implement removeTask reducer
  - [x] Implement setSelectedDate reducer
  - [x] Implement setLoading reducer
  - [x] Implement setError reducer
  - [x] Implement setSyncStatus reducer
  - [x] Implement clearTasks reducer
  - [x] Implement reorderTasksLocal reducer
  - [x] Implement batchUpdateTasks reducer

- [x] **Create selectors** ✅ Completed 2026-01-31
  - [x] Create selectAllTasks
  - [x] Create selectTaskById
  - [x] Create selectTasksByDate
  - [x] Create selectTasksForSelectedDate
  - [x] Create selectSelectedDate
  - [x] Create selectTasksLoading
  - [x] Create selectTasksError
  - [x] Create selectTasksSyncStatus
  - [x] Create selectTasksByPriorityForDate
  - [x] Create selectTaskCountForDate
  - [x] Create selectCompletedTaskCountForDate
  - [x] Create selectTasksLoadedForDate

- [x] **Export and add to store** ✅ Completed 2026-01-31
  - [x] Export actions and reducer
  - [x] Add taskReducer to store

- [x] **Write slice tests** ✅ Completed 2026-01-31 (930 lines of comprehensive tests)
  - [x] Create `src/features/tasks/__tests__/taskSlice.test.ts`
  - [x] Test initial state
  - [x] Test setTasks normalizes correctly
  - [x] Test addTask adds to correct date
  - [x] Test updateTask handles date changes
  - [x] Test removeTask cleans up
  - [x] Test all selectors

---

### Step 2.2.2: Task Async Thunks

- [x] **Create async thunks** ✅ Completed 2026-01-31
  - [x] Create fetchTasksByDate thunk
  - [x] Create createTask thunk
  - [x] Create updateTaskAsync thunk
  - [x] Create deleteTask thunk
  - [x] Create hardDeleteTask thunk
  - [x] Create restoreTask thunk
  - [x] Create batchUpdateTasksAsync thunk
  - [x] Create fetchTasksByDateRange thunk

- [x] **Add extraReducers for thunk states** ✅ Completed 2026-01-31
  - [x] Handle fetchTasksByDate.pending
  - [x] Handle fetchTasksByDate.fulfilled
  - [x] Handle fetchTasksByDate.rejected
  - [x] Handle createTask states
  - [x] Handle updateTaskAsync states
  - [x] Handle deleteTask states
  - [x] Handle hardDeleteTask states
  - [x] Handle restoreTask states
  - [x] Handle batchUpdateTasksAsync states
  - [x] Handle fetchTasksByDateRange states

- [x] **Export thunks** ✅ Completed 2026-01-31
  - [x] Add exports for all thunks in index.ts

- [x] **Write thunk tests** ✅ Completed 2026-01-31 (33 tests)
  - [x] Create `src/features/tasks/__tests__/taskThunks.test.ts`
  - [x] Mock tasksService
  - [x] Test fetchTasksByDate pending/fulfilled/rejected
  - [x] Test createTask calls service
  - [x] Test updateTaskAsync updates state
  - [x] Test deleteTask removes from state
  - [x] Test hardDeleteTask removes permanently
  - [x] Test restoreTask adds back to state
  - [x] Test batchUpdateTasksAsync updates multiple
  - [x] Test fetchTasksByDateRange fetches range
  - [x] Test integration scenarios

---

## 2.3 Category Slice

### Step 2.3.1: Category Slice

- [x] **Create category slice** ✅ Completed 2026-01-31
  - [x] Create `src/features/categories/categorySlice.ts`
  - [x] Define CategoriesState interface
  - [x] Create categorySlice with reducers (setCategories, addCategory, updateCategory, removeCategory, etc.)
  - [x] Create async thunks (fetchCategories, createCategory, updateCategoryAsync, deleteCategory, checkCategoryNameExists)
  - [x] Create selectors (selectAllCategories, selectCategoryById, selectCategoryByName, etc.)

- [x] **Create categories service** ✅ Completed 2026-01-31
  - [x] Create `src/services/firebase/categories.service.ts`
  - [x] Implement createCategory
  - [x] Implement getCategory
  - [x] Implement getCategories
  - [x] Implement updateCategory
  - [x] Implement deleteCategory
  - [x] Implement getCategoryCount
  - [x] Implement categoryNameExists (for duplicate checking)

- [x] **Add to store** ✅ Completed 2026-01-31
  - [x] Add categoryReducer to store
  - [x] Configure serializableCheck for categories

- [x] **Write tests** ✅ Completed 2026-01-31 (76 tests)
  - [x] Test all reducers (32 slice tests)
  - [x] Test all thunks (24 thunk tests)
  - [x] Test selectors
  - [x] Test service layer (20 service tests)

- [x] **Create categories index** ✅ Completed 2026-01-31
  - [x] Create `src/features/categories/index.ts`
  - [x] Export slice, actions, thunks, selectors, types

---

# PHASE 3: Core Task Features

**Estimated Time:** 2-3 days
**Dependencies:** Phase 2 complete

---

## 3.1 Task List Component

### Step 3.1.1: Task List Component - Basic Rendering

- [x] **Create TaskList component** ✅ Completed 2026-01-31
  - [x] Create `src/components/tasks/TaskList.tsx`
  - [x] Define TaskListProps interface
  - [x] Group tasks by priority letter
  - [x] Render TaskPriorityGroup for each group
  - [x] Show empty state if no tasks

- [x] **Create TaskPriorityGroup component** ✅ Completed 2026-01-31
  - [x] Create component with priority header
  - [x] Apply color coding (A=red, B=orange, C=yellow, D=gray)
  - [x] Render TaskItem for each task

- [x] **Create TaskItem component** ✅ Completed 2026-01-31
  - [x] Display priority label (e.g., "A1")
  - [x] Display status symbol
  - [x] Display task title
  - [x] Display category color
  - [x] Show recurrence icon if applicable
  - [x] Apply completed styling
  - [x] Handle click

- [x] **Create task components index** ✅ Completed 2026-01-31
  - [x] Create `src/components/tasks/index.ts`
  - [x] Export TaskList, TaskItem, TaskPriorityGroup

- [x] **Create task utilities** ✅ Completed 2026-01-31
  - [x] Create `src/utils/taskUtils.ts`
  - [x] Implement groupTasksByPriority
  - [x] Implement sortTasksByPriority
  - [x] Implement getStatusSymbol
  - [x] Implement getPriorityColor

- [x] **Write component tests** ✅ Completed 2026-01-31 (89 tests)
  - [x] Test TaskList renders empty state
  - [x] Test TaskList groups by priority
  - [x] Test TaskItem renders title
  - [x] Test TaskItem renders status symbol
  - [x] Test TaskItem shows recurrence icon

- [x] **Write utility tests** ✅ Completed 2026-01-31 (43 tests)
  - [x] Test groupTasksByPriority
  - [x] Test sortTasksByPriority
  - [x] Test getStatusSymbol

---

### Step 3.1.2: Task List Integration with Redux

- [x] **Create TaskListContainer** ✅ Completed 2026-01-31
  - [x] Create `src/features/tasks/TaskListContainer.tsx`
  - [x] Use useAppSelector for tasks
  - [x] Use useAppSelector for categories
  - [x] Use useAppDispatch
  - [x] Use useAuth for current user
  - [x] Dispatch fetchTasksByDate on mount
  - [x] Handle onTaskClick
  - [x] Handle onStatusChange
  - [x] Show loading/error states

- [x] **Update TaskItem for category colors** ✅ Completed 2026-01-31
  - [x] Look up category by task.categoryId
  - [x] Apply category color to left border

- [x] **Create useTasksByDate hook** ✅ Completed 2026-01-31
  - [x] Create `src/features/tasks/hooks.ts`
  - [x] Implement hook that fetches and returns tasks
  - [x] Implement useSelectedDateTasks hook

- [x] **Write integration tests** ✅ Completed 2026-01-31
  - [x] Test renders loading state
  - [x] Test dispatches fetch on mount
  - [x] Test renders tasks from store
  - [x] Test status change dispatches update
  - [x] Test shows error message

- [x] **Create mock data utilities** ✅ Completed 2026-01-31
  - [x] Create `src/test/mockData.ts`
  - [x] Implement createMockTask
  - [x] Implement createMockCategory
  - [x] Implement createMockUser
  - [x] Implement createMockTasksState
  - [x] Implement createMockCategoriesState

- [x] **Create status utilities** ✅ Completed 2026-01-31
  - [x] Create `src/utils/statusUtils.ts`
  - [x] Implement getNextStatus (status cycling)
  - [x] Implement getStatusLabel
  - [x] Define STATUS_ORDER constant

---

## 3.2 Task Creation

### Step 3.2.1: Task Creation Form

- [x] **Create form components** ✅ Completed 2026-02-01
  - [x] Create `src/components/common/Input.tsx`
  - [x] Create `src/components/common/Select.tsx`
  - [x] Create `src/components/common/TextArea.tsx`
  - [x] Create `src/components/common/DatePicker.tsx`
  - [x] Create `src/components/common/TimePicker.tsx`
  - [x] Update common index exports

- [x] **Create TaskForm component** ✅ Completed 2026-02-01
  - [x] Create `src/components/tasks/TaskForm.tsx`
  - [x] Define TaskFormProps interface
  - [x] Add title field (required)
  - [x] Add description field (optional)
  - [x] Add priority letter select (A/B/C/D)
  - [x] Add priority number input
  - [x] Add category select
  - [x] Add scheduled date picker
  - [x] Add scheduled time picker
  - [x] Implement validation
  - [x] Handle submit and cancel

- [x] **Write form tests** ✅ Completed 2026-02-02
  - [x] Test renders all fields
  - [x] Test title is required
  - [x] Test submits with valid data
  - [x] Test calls onCancel
  - [x] Test populates initialValues
  - [x] Test priority letter defaults correctly

- [x] **Write input component tests** ✅ Completed 2026-02-02
  - [x] Test Input renders label
  - [x] Test Input displays error
  - [x] Test Select renders options (46 tests)

---

### Step 3.2.2: Task Creation Modal and Integration

- [x] **Create Modal component** ✅ Completed 2026-02-01
  - [x] Create `src/components/common/Modal.tsx`
  - [x] Define ModalProps interface
  - [x] Implement overlay with backdrop
  - [x] Implement centered modal card
  - [x] Add close button
  - [x] Handle backdrop click close
  - [x] Handle Escape key close
  - [x] Prevent body scroll when open

- [x] **Create CreateTaskModal** ✅ Completed 2026-02-01
  - [x] Create `src/features/tasks/CreateTaskModal.tsx`
  - [x] Use Modal component
  - [x] Render TaskForm inside
  - [x] Dispatch createTask thunk on submit
  - [x] Close modal on success
  - [x] Show error in form on failure
  - [x] Pass selected date as default

- [x] **Create TasksPage** ✅ Completed 2026-02-01
  - [x] Create `src/features/tasks/TasksPage.tsx`
  - [x] Render TaskListContainer
  - [x] Add "Add Task" button
  - [x] Manage CreateTaskModal open state

- [x] **Create FloatingActionButton** ✅ Completed 2026-02-01
  - [x] Create `src/components/common/FloatingActionButton.tsx`
  - [x] Fixed position bottom-right
  - [x] Round button with + icon
  - [x] onClick handler

- [x] **Update App routing** ✅ Completed 2026-02-01
  - [x] Route "/" to TasksPage when authenticated

- [x] **Write tests** ✅ Completed 2026-02-02
  - [x] Test Modal renders when open (30 tests)
  - [x] Test Modal closes on backdrop click
  - [x] Test Modal closes on Escape
  - [x] Test CreateTaskModal dispatches action (18 tests)
  - [x] Test CreateTaskModal closes on success
  - [x] Test TasksPage opens modal on button click (21 tests)

---

## 3.3 Task Editing

### Step 3.3.1: Task Editing

- [x] **Create EditTaskModal** ✅ Completed 2026-02-02
  - [x] Create `src/features/tasks/EditTaskModal.tsx`
  - [x] Accept task prop
  - [x] Use Modal and TaskForm
  - [x] Pass initialValues from task
  - [x] Pass isEditing={true}
  - [x] Dispatch updateTaskAsync on submit
  - [x] Add delete button with ConfirmDialog

- [x] **Update TaskForm for editing** ✅ Completed 2026-02-02
  - [x] Change submit button text based on isEditing
  - [x] Show status dropdown when editing
  - [x] Show created date read-only when editing
  - [x] Handle pre-populated fields

- [x] **Create ConfirmDialog** ✅ Already existed (created 2026-02-01)
  - [x] Create `src/components/common/ConfirmDialog.tsx`
  - [x] Define props (isOpen, onConfirm, onCancel, title, message, etc.)
  - [x] Implement small modal with message
  - [x] Add Cancel and Confirm buttons
  - [x] Support danger variant

- [x] **Update TasksPage for editing** ✅ Completed 2026-02-02
  - [x] Add selectedTask state
  - [x] Open EditTaskModal when task clicked
  - [x] Clear selectedTask on modal close

- [x] **Update TaskItem** ✅ Already had onClick support
  - [x] On click, call onTaskClick with task

- [x] **Write tests** ✅ Completed 2026-02-02
  - [x] Test form populated with task data (37 EditTaskModal tests)
  - [x] Test dispatches updateTaskAsync
  - [x] Test delete button opens confirmation
  - [x] Test confirming delete dispatches deleteTask
  - [x] Test ConfirmDialog renders message (35 tests)
  - [x] Test ConfirmDialog calls handlers

---

## 3.4 Priority System

### Step 3.4.1: Priority System - Auto-numbering

- [x] **Create priority utilities** ✅ Completed 2026-02-02
  - [x] Create `src/utils/priorityUtils.ts`
  - [x] Implement getNextPriorityNumber
  - [x] Implement reorderTasksInPriority
  - [x] Implement reorderAllTasks

- [x] **Update createTask thunk** ✅ Completed 2026-02-02
  - [x] Calculate next priority number before creating
  - [x] Include in CreateTaskInput

- [x] **Add reorderTasks thunk** ✅ Completed 2026-02-02
  - [x] Create reorderTasks async thunk
  - [x] Batch update tasks with new priority numbers

- [x] **Add "Reorder All" button** ✅ Completed 2026-02-02
  - [x] Add button to TasksPage
  - [x] Dispatch reorderTasks for all tasks on selected date

- [x] **Implement batch update service** ✅ Already existed (batchUpdateTasks in tasks.service.ts)
  - [x] Add batchUpdatePriorityNumbers to tasks.service.ts
  - [x] Use Firestore batch/transaction

- [x] **Write tests** ✅ Completed 2026-02-02 (51 new tests: 40 priorityUtils + 11 thunks)
  - [x] Test getNextPriorityNumber returns 1 for empty
  - [x] Test getNextPriorityNumber returns next number
  - [x] Test reorderTasksInPriority fills gaps
  - [x] Test reorderAllTasks handles multiple priorities
  - [x] Integration test: create tasks with gaps, reorder, verify

---

## 3.5 Status Symbols

### Step 3.5.1: Status Symbols - Click to Change

- [x] **Create StatusSymbol component** ✅ Completed 2026-02-02
  - [x] Create `src/components/tasks/StatusSymbol.tsx`
  - [x] Accept status, onClick, size props
  - [x] Render appropriate symbol
  - [x] Apply color coding per status
  - [x] Show tooltip on hover (using native title attribute)
  - [x] Clickable when onClick provided
  - [x] Keyboard navigation (arrow keys to cycle forward/backward)
  - [x] Loading spinner during updates

- [x] **Status utilities already existed** ✅ (Created in Step 3.1.2)
  - [x] `src/utils/statusUtils.ts` already had:
  - [x] STATUS_ORDER constant
  - [x] getNextStatus / getPreviousStatus
  - [x] getStatusLabel / getStatusDescription
  - [x] getStatusColor / getStatusColorClasses

- [x] **Update TaskItem** ✅ Completed 2026-02-02
  - [x] Replace inline status button with StatusSymbol component
  - [x] Added onStatusCycleBackward callback for arrow key navigation
  - [x] Event propagation handled by StatusSymbol

- [x] **Tooltip implemented** ✅ Completed 2026-02-02
  - [x] Using native HTML title attribute for simplicity
  - [x] Shows current status, description, and next status

- [x] **Write tests** ✅ Completed 2026-02-02 (50 new tests)
  - [x] Test StatusSymbol renders correct symbol for all statuses
  - [x] Test StatusSymbol applies correct color
  - [x] Test StatusSymbol calls onClick
  - [x] Test StatusSymbol shows tooltip
  - [x] Test size variants (sm, md, lg)
  - [x] Test keyboard navigation (arrow keys)
  - [x] Test disabled and updating states
  - [x] Test accessibility (aria-label, aria-busy, aria-disabled)

---

## 3.6 Drag-and-Drop Reordering

### Step 3.6.1: Drag and Drop - Setup

- [x] **Install dnd-kit** ✅ Completed 2026-02-02
  - [x] Install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

- [x] **Create DraggableTaskList** ✅ Completed 2026-02-02
  - [x] Create `src/components/tasks/DraggableTaskList.tsx`
  - [x] Wrap with DndContext
  - [x] Use SortableContext per priority group (via SortablePriorityGroup)
  - [x] Handle onDragEnd with same-priority validation

- [x] **Create SortableTaskItem** ✅ Completed 2026-02-02
  - [x] Create `src/components/tasks/SortableTaskItem.tsx`
  - [x] Use useSortable hook
  - [x] Apply transform/transition styles
  - [x] Add drag handle

- [x] **Create DragHandle component** ✅ Completed 2026-02-02
  - [x] Create `src/components/common/DragHandle.tsx`
  - [x] Six dots SVG icon
  - [x] Cursor grab/grabbing
  - [x] Always visible with hover styles

- [x] **Create SortablePriorityGroup** ✅ Completed 2026-02-02
  - [x] Create `src/components/tasks/SortablePriorityGroup.tsx`
  - [x] Wrap tasks in SortableContext
  - [x] Use verticalListSortingStrategy

- [x] **Handle reorder on drop** ✅ Completed 2026-02-02
  - [x] Get old and new index using arrayMove
  - [x] Verify same priority group (cancel if different)
  - [x] Calculate new order
  - [x] Dispatch reorderTasksLocal action

- [x] **Reorder action in taskSlice** ✅ Already existed
  - [x] reorderTasksLocal reducer was already implemented

- [x] **Update test setup** ✅ Completed 2026-02-02
  - [x] Add PointerEvent mock for dnd-kit
  - [x] Add setPointerCapture/releasePointerCapture mocks

- [x] **Write tests** ✅ Completed 2026-02-02 (32 new tests)
  - [x] DragHandle tests (15 tests)
  - [x] DraggableTaskList tests (17 tests)
  - [x] Test drag handle is visible
  - [x] Test reorder callback
  - [x] Test items restricted to same priority

---

### Step 3.6.2: Drag and Drop - Persist and Polish ✅ Completed 2026-02-02

- [x] **Create persist thunk** ✅
  - [x] Implement reorderTasksAsync thunk
  - [x] Persist to Firestore

- [x] **Update onDragEnd handler** ✅
  - [x] Calculate new priority numbers
  - [x] Dispatch optimistic local update
  - [x] Dispatch async persist
  - [x] Handle error (revert with rollback state)

- [x] **Add visual feedback** ✅
  - [x] Scale transform when dragging (scale-95, opacity-40)
  - [x] Show drop indicator line (blue line when isOver)
  - [x] Dim other items
  - [x] Smooth transitions (200ms cubic-bezier)

- [x] **Create drag overlay** ✅
  - [x] Use DragOverlay from @dnd-kit
  - [x] Style preview (shadow-2xl, border-blue-500)

- [x] **Prevent cross-priority drag** ✅
  - [x] Verify source/destination same priority
  - [x] Validation in thunk rejects wrong priority

- [x] **Add animation on reorder** ✅
  - [x] CSS transitions for smooth movement

- [x] **Optimizations** ✅
  - [x] React.memo on SortableTaskItem and SortablePriorityGroup
  - [x] Early return for empty taskIds
  - [x] Increased DragHandle touch target for mobile

- [x] **Accessibility improvements** ✅
  - [x] aria-describedby for keyboard instructions
  - [x] Screen reader announcements

- [x] **Write tests** ✅ (33 new tests)
  - [x] Test reorderTasksAsync calls batch update
  - [x] Test optimistic update applied
  - [x] Test error reverts update (rollback test)
  - [x] Test empty array early return
  - [x] Test wrong priority rejection

---

# PHASE 4: Date Navigation & Daily View

**Estimated Time:** 1 day
**Dependencies:** Phase 3 complete

---

## 4.1 Date Navigation Component

### Step 4.1.1: Date Navigation Component ✅ Completed 2026-02-02

- [x] **Install date-fns** ✅ (Already installed v4.1.0)
  - [x] npm install date-fns (if not already)

- [x] **Create date utilities** ✅ Completed
  - [x] Create `src/utils/dateUtils.ts`
  - [x] Implement formatDisplayDate
  - [x] Implement addDays
  - [x] Implement isToday
  - [x] Implement parseISODate
  - [x] Implement toISODateString
  - [x] Implement getTodayString (additional utility)

- [x] **Create DateNavigation component** ✅ Completed
  - [x] Create `src/components/common/DateNavigation.tsx`
  - [x] Define props (selectedDate, onDateChange)
  - [x] Add left arrow button (previous day)
  - [x] Display formatted date
  - [x] Add right arrow button (next day)
  - [x] Add "Today" button
  - [x] Disable Today if already on today
  - [x] Keyboard shortcuts (Arrow keys, 'T')
  - [x] Full accessibility with ARIA labels
  - [x] Memoization with React.memo

- [x] **Create DateNavigationContainer** ✅ Completed
  - [x] Create `src/features/tasks/DateNavigationContainer.tsx`
  - [x] Use useAppSelector for selectedDate
  - [x] Use useAppDispatch for setSelectedDate
  - [x] Connect to DateNavigation

- [x] **Write tests** ✅ 102 new tests (39 dateUtils + 44 DateNavigation + 19 Container)
  - [x] Test formatDisplayDate
  - [x] Test addDays
  - [x] Test isToday
  - [x] Test toISODateString
  - [x] Test DateNavigation displays formatted date
  - [x] Test previous button
  - [x] Test next button
  - [x] Test today button
  - [x] Test today button disabled when on today
  - [x] Test keyboard navigation
  - [x] Test accessibility attributes
  - [x] Test Redux integration

---

## 4.2 Daily View Layout

### Step 4.2.1: Daily View Layout ✅ Completed 2026-02-02

- [x] **Create DailyView component** ✅
  - [x] Create `src/features/tasks/DailyView.tsx`
  - [x] Define layout structure
  - [x] Include Header area
  - [x] Include DateNavigation area
  - [x] Include Tab bar area
  - [x] Include content area
  - [x] Include footer actions area

- [x] **Create Header component** ✅
  - [x] Create `src/components/layout/Header.tsx`
  - [x] App logo/title "Neill Planner"
  - [x] Hamburger menu button
  - [x] User avatar/menu

- [x] **Create UserMenu component** ✅
  - [x] Create `src/components/layout/UserMenu.tsx`
  - [x] Dropdown menu component
  - [x] Show user name/email
  - [x] Settings link
  - [x] Sign out button

- [x] **Create AppLayout component** ✅
  - [x] Create `src/components/layout/AppLayout.tsx`
  - [x] Header at top
  - [x] Main content area
  - [x] Responsive design

- [x] **Update TasksPage** ✅
  - [x] Wrap content in AppLayout
  - [x] Render DailyView inside

- [x] **Write tests** ✅
  - [x] Test DailyView renders header (85 tests)
  - [x] Test DailyView renders date navigation
  - [x] Test DailyView renders content
  - [x] Test Header renders app title (53 tests)
  - [x] Test Header renders user menu
  - [x] Test AppLayout renders children (36 tests)
  - [x] Test UserMenu dropdown functionality (74 tests)
  - [x] Test keyboard navigation (Escape, Arrow keys)
  - [x] Test accessibility (ARIA attributes)

---

## 4.3 Tab System (Tasks/Calendar/Notes)

### Step 4.3.1: Tab System ✅ Completed 2026-02-02

- [x] **Create Tab types**
  - [x] Define Tab interface (id, label, icon)
  - [x] Define TabsProps interface

- [x] **Create Tabs component**
  - [x] Create `src/components/common/Tabs.tsx`
  - [x] Horizontal tab bar
  - [x] Active tab highlighted
  - [x] Click to switch
  - [x] Keyboard accessible

- [x] **Create TabPanel component**
  - [x] Only renders when active
  - [x] ARIA attributes

- [x] **Define daily view tabs constant**
  - [x] Tasks tab
  - [x] Calendar tab
  - [x] Notes tab

- [x] **Create icon components**
  - [x] Create `src/components/icons/index.tsx`
  - [x] CheckIcon
  - [x] CalendarIcon
  - [x] NoteIcon

- [x] **Update DailyView to use tabs**
  - [x] State for activeTab
  - [x] Render Tabs component
  - [x] Render TabPanel for each tab
  - [x] Tasks tab: TaskListContainer
  - [x] Calendar tab: placeholder
  - [x] Notes tab: placeholder

- [x] **Write tests**
  - [x] Test Tabs renders all labels
  - [x] Test active tab styling
  - [x] Test clicking tab calls onTabChange
  - [x] Test keyboard navigation
  - [x] Test TabPanel renders when active
  - [x] Test TabPanel hidden when inactive
  - [x] Test switching tabs shows correct content

---

## 4.4 FloatingActionButton Integration

### Step 4.4.1: FloatingActionButton in Daily View ✅ Completed 2026-02-02

- [x] **Add FloatingActionButton to DailyView**
  - [x] Import FloatingActionButton from common components
  - [x] Add FAB that opens CreateTaskModal
  - [x] Only show FAB when Tasks tab is active
  - [x] Use icon="plus" and ariaLabel="Add new task"
  - [x] Add memoized callback for onClick handler

- [x] **Update footer section**
  - [x] Remove old inline "Add Task" button
  - [x] Footer now only shows when Reorder All is needed
  - [x] Cleaner UI when no reorder needed

- [x] **Add FloatingActionButton unit tests**
  - [x] Create `src/components/common/__tests__/FloatingActionButton.test.tsx`
  - [x] Test rendering with default plus icon
  - [x] Test all icon variants (plus, edit, save)
  - [x] Test custom icon rendering
  - [x] Test click handler invocation
  - [x] Test disabled state behavior
  - [x] Test accessibility attributes (aria-label, aria-hidden)
  - [x] Test styling (fixed positioning, colors, transitions)
  - [x] 37 comprehensive tests

- [x] **Update DailyView tests**
  - [x] Test FAB renders on Tasks tab
  - [x] Test FAB does NOT render on Calendar tab
  - [x] Test FAB does NOT render on Notes tab
  - [x] Test clicking FAB opens CreateTaskModal
  - [x] Test FAB has correct aria-label

---

## 4.5 Today Highlighting

### Step 4.5.1: Today Highlighting ✅ Completed 2026-02-02

- [x] **Add Today indicator badge**
  - [x] Show "Today" badge above date when viewing today
  - [x] Badge styling: amber background, rounded-full
  - [x] Only visible when `isTodaySelected` is true

- [x] **Conditional date display styling**
  - [x] When viewing today: amber text color (text-amber-700)
  - [x] When viewing other dates: neutral gray (text-gray-800)
  - [x] Smooth transition between states

- [x] **Accessibility**
  - [x] aria-label="Today" on indicator badge
  - [x] Existing aria-live region announces date changes
  - [x] Screen reader support maintained

- [x] **Write tests**
  - [x] Test Today indicator shows when today is selected
  - [x] Test Today indicator hidden on other dates
  - [x] Test amber styling when today is selected
  - [x] Test neutral styling on other dates
  - [x] Test state transitions when date changes
  - [x] Test ARIA attributes
  - [x] 7 new tests added

---

# PHASE 5: Categories & Colors

**Estimated Time:** 1 day
**Dependencies:** Phase 4 complete

---

## 5.1 Category Management

### Step 5.1.1: Category List Component ✅ Completed 2026-02-02

- [x] **Create CategoryList component** ✅
  - [x] Show all user categories
  - [x] Display color swatch, name, edit/delete buttons
  - [x] "Add Category" button
  - [x] Connect to Redux

- [x] **Write tests** ✅ (81 tests: 56 presentation + 25 container)
  - [x] Test renders list
  - [x] Test shows colors
  - [x] Test add button opens form

---

### Step 5.1.2: Category Form ✅ Completed 2026-02-02

- [x] **Create CategoryForm component** ✅
  - [x] Name input (required, max 50 chars)
  - [x] Color picker (ColorPicker component with 8 preset colors)
  - [x] Create/Update/Cancel buttons
  - [x] Validation for unique names (case-insensitive)
  - [x] CategoryFormModal wrapper with Redux integration
  - [x] Server error display
  - [x] Loading states during submission

- [x] **Write tests** ✅ 101 tests total
  - [x] ColorPicker tests (33 tests) - color selection, keyboard nav, accessibility
  - [x] CategoryForm tests (41 tests) - validation, submission, error handling
  - [x] CategoryFormModal tests (27 tests) - create/edit, Redux integration

---

## 5.2 Color Picker

### Step 5.2.1: Color Picker Component ✅ Completed 2026-02-02 (as part of Step 5.1.2)

- [x] **Create ColorPicker component**
  - [x] Grid of preset colors (8 colors: red, orange, yellow, green, teal, blue, purple, pink)
  - [x] Preview of selected color (checkmark on selected, amber ring)
  - [x] Accessible (keyboard navigation, ARIA radiogroup/radio pattern)
  - [ ] Custom color input (hex) - deferred to future enhancement

- [x] **Write tests** ✅ 33 tests
  - [x] Test preset colors selectable
  - [x] Test preview updates
  - [x] Test keyboard navigation (Arrow keys, Enter, Space)

---

## 5.3 Category Assignment

### Step 5.3.1: Category Assignment in Task Form ✅ Completed 2026-02-02

- [x] **Update TaskForm**
  - [x] Add category dropdown (custom CategorySelect component)
  - [x] Color preview next to selection (color dots in dropdown)
  - [x] "Uncategorized" as default (first option)

- [x] **Update TaskItem**
  - [x] Show category color (already implemented - vertical color bar)

- [x] **Write tests** ✅ 55 CategorySelect tests + TaskForm integration tests
  - [x] Test dropdown shows categories with color dots
  - [x] Test selection saves (calls onChange with category id)
  - [x] Test color displays (in trigger button and dropdown options)

---

# PHASE 6: Recurring Tasks

**Estimated Time:** 2 days
**Dependencies:** Phase 5 complete

---

## 6.1 Recurrence Pattern Definition

### Step 6.1.1: Recurrence Pattern Form ✅ Completed 2026-02-02

- [x] **Create RecurrenceForm component** ✅
  - [x] Type selector (daily, weekly, monthly, yearly, custom) with button toggles
  - [x] Interval input with type-specific labels
  - [x] Days of week checkboxes (Su-Sa) for weekly recurrence
  - [x] Day of month selector (1-31) for monthly/yearly
  - [x] Month (1-12) and day (1-31) selectors for yearly
  - [x] End condition options (never, on date, after occurrences)
  - [x] Touched state validation for better UX
  - [x] Full accessibility (ARIA roles, labels, keyboard navigation)

- [x] **Write tests** ✅ 36 tests
  - [x] Test all recurrence types (daily, weekly, monthly, yearly, custom)
  - [x] Test interval input for each type
  - [x] Test days of week selection and toggling
  - [x] Test day/month selectors
  - [x] Test end conditions (never, date, occurrences)
  - [x] Test validation and error messages
  - [x] Test accessibility (aria-pressed, role="group", keyboard nav)
  - [x] Test touched state behavior
  - [x] Test component integration with props

---

### Step 6.1.2: Integrate Recurrence with Task Form ✅ Completed 2026-02-02

- [x] **Update TaskForm** ✅
  - [x] Add Toggle component for enabling/disabling recurrence
  - [x] Show RecurrenceForm when enabled
  - [x] Save pattern with task

- [x] **Update TaskItem** ✅
  - [x] Show recurrence icon (already implemented)

- [x] **Write tests** ✅
  - [x] Test toggle shows/hides form (8 tests)
  - [x] Test pattern saved
  - [x] Test icon displayed

---

## 6.2 Instance Generation

### Step 6.2.1: Instance Generation Logic

- [ ] **Create recurrence utilities**
  - [ ] Create `src/utils/recurrenceUtils.ts`
  - [ ] Implement generateRecurringInstances
  - [ ] Handle all pattern types
  - [ ] Respect end conditions
  - [ ] Handle exceptions

- [ ] **Write tests**
  - [ ] Test daily generates correct dates
  - [ ] Test weekly handles days
  - [ ] Test monthly edge cases
  - [ ] Test end conditions

---

### Step 6.2.2: Display Recurring Instances

- [ ] **Update task fetching**
  - [ ] Fetch parent recurring tasks
  - [ ] Generate instances for date range
  - [ ] Display instances

- [ ] **Show recurrence indicator**
  - [ ] (↻) icon on recurring instances

- [ ] **Write tests**
  - [ ] Test instances appear on correct dates
  - [ ] Test indicator visible
  - [ ] Test linked to parent

---

## 6.3 Edit This/All Future Logic

### Step 6.3.1: Edit Recurring Options

- [ ] **Create edit dialog**
  - [ ] "Edit this occurrence only" option
  - [ ] "Edit all future occurrences" option

- [ ] **Implement "this only"**
  - [ ] Create exception
  - [ ] Store modification

- [ ] **Implement "all future"**
  - [ ] Update pattern
  - [ ] Regenerate instances

- [ ] **Write tests**
  - [ ] Test dialog appears
  - [ ] Test "this only" creates exception
  - [ ] Test "all future" updates pattern

---

### Step 6.3.2: Delete Recurring Options

- [ ] **Create delete dialog**
  - [ ] "Delete this occurrence" option
  - [ ] "Delete all future" option

- [ ] **Implement "this only"**
  - [ ] Add to exceptions

- [ ] **Implement "all future"**
  - [ ] Set end date to today

- [ ] **Write tests**
  - [ ] Test dialog appears
  - [ ] Test "this only" adds exception
  - [ ] Test "all future" ends series

---

# PHASE 7: Events & Calendar

**Estimated Time:** 2-3 days
**Dependencies:** Phase 6 complete

---

## 7.1 Event Data Model

### Step 7.1.1: Event Service Layer

- [ ] **Create event service**
  - [ ] Create `src/services/firebase/events.service.ts`
  - [ ] Implement CRUD operations

- [ ] **Create event Redux slice**
  - [ ] Create `src/features/events/eventSlice.ts`
  - [ ] Define state, reducers, thunks, selectors

- [ ] **Write tests**
  - [ ] Test create event
  - [ ] Test fetch events
  - [ ] Test update and delete

---

## 7.2 Event CRUD

### Step 7.2.1: Event Form

- [ ] **Create EventForm component**
  - [ ] Title, description
  - [ ] Start time, end time pickers
  - [ ] Location
  - [ ] Category
  - [ ] Confidential toggle with alternate title
  - [ ] Recurrence (reuse RecurrenceForm)

- [ ] **Write tests**
  - [ ] Test all fields
  - [ ] Test time validation
  - [ ] Test confidential field

---

## 7.3 Calendar Time-Block View

### Step 7.3.1: Calendar Time-Block View

- [ ] **Create TimeBlockCalendar component**
  - [ ] Vertical time slots
  - [ ] Events as blocks
  - [ ] Height based on duration
  - [ ] Handle overlapping events
  - [ ] Click empty slot to create

- [ ] **Write tests**
  - [ ] Test time slots render
  - [ ] Test events positioned
  - [ ] Test overlap handling
  - [ ] Test click creates event

---

## 7.4 Week/Month Views

### Step 7.4.1: Week View

- [ ] **Create WeekView component**
  - [ ] 7-day grid (Sun-Sat)
  - [ ] Events with times
  - [ ] Navigate between weeks
  - [ ] Click day for daily view

- [ ] **Write tests**
  - [ ] Test 7 days displayed
  - [ ] Test events on correct days
  - [ ] Test navigation

---

### Step 7.4.2: Month View

- [ ] **Create MonthView component**
  - [ ] Calendar grid
  - [ ] Events with day/time/name
  - [ ] Navigate between months
  - [ ] Click day for daily view

- [ ] **Write tests**
  - [ ] Test calendar grid
  - [ ] Test events displayed
  - [ ] Test navigation

---

# PHASE 8: Notes System

**Estimated Time:** 1-2 days
**Dependencies:** Phase 7 complete

---

## 8.1 Notes Data Model

### Step 8.1.1: Note Service and Redux

- [ ] **Create note service**
  - [ ] Create `src/services/firebase/notes.service.ts`
  - [ ] Implement CRUD

- [ ] **Create note Redux slice**
  - [ ] Create `src/features/notes/noteSlice.ts`
  - [ ] Fetch notes by date

- [ ] **Write tests**
  - [ ] Test CRUD operations
  - [ ] Test date filtering

---

## 8.2 Notes CRUD

### Step 8.2.1: Notes Tab Implementation

- [ ] **Implement Notes tab**
  - [ ] List notes for selected date
  - [ ] Click to edit
  - [ ] Add note button

- [ ] **Write tests**
  - [ ] Test notes displayed
  - [ ] Test click opens editor
  - [ ] Test add creates note

---

## 8.3 Rich Text Editor

### Step 8.3.1: Rich Text Editor

- [ ] **Add rich text editor**
  - [ ] Install TipTap or similar
  - [ ] Bold, italic, bullet lists
  - [ ] Keyboard shortcuts
  - [ ] Autosave

- [ ] **Write tests**
  - [ ] Test formatting works
  - [ ] Test shortcuts work
  - [ ] Test content saves

---

## 8.4 Task/Event Linking

### Step 8.4.1: Note Linking

- [ ] **Add linking to notes**
  - [ ] "Link to" button in editor
  - [ ] Select tasks or events
  - [ ] Show link indicator
  - [ ] Click link to navigate

- [ ] **Write tests**
  - [ ] Test link selection
  - [ ] Test links saved
  - [ ] Test navigation works

---

# PHASE 9: Google Calendar Integration

**Estimated Time:** 2-3 days
**Dependencies:** Phase 8 complete

---

## 9.1 OAuth Setup

### Step 9.1.1: Google Calendar OAuth

- [ ] **Configure Google Cloud project**
  - [ ] Create project in Google Cloud Console
  - [ ] Enable Google Calendar API
  - [ ] Configure OAuth consent screen
  - [ ] Create OAuth credentials

- [ ] **Add OAuth scopes**
  - [ ] calendar.readonly
  - [ ] calendar.events

- [ ] **Implement authorization flow**
  - [ ] Add sign in with additional scopes
  - [ ] Handle token exchange

- [ ] **Store tokens securely**
  - [ ] Save refresh token in Firestore
  - [ ] Implement token refresh

- [ ] **Write tests**
  - [ ] Test OAuth flow completes
  - [ ] Test tokens stored
  - [ ] Test refresh works

---

## 9.2 Two-Way Sync

### Step 9.2.1: Sync Events to Google

- [ ] **Create sync to Google**
  - [ ] On event create, create in Google
  - [ ] On update, update in Google
  - [ ] On delete, delete in Google
  - [ ] Store Google event ID

- [ ] **Write tests**
  - [ ] Test create syncs
  - [ ] Test update syncs
  - [ ] Test delete syncs

---

### Step 9.2.2: Sync Events from Google

- [ ] **Create sync from Google**
  - [ ] Fetch Google events
  - [ ] Create/update local events
  - [ ] Handle conflicts
  - [ ] Background sync every 5 min

- [ ] **Write tests**
  - [ ] Test import works
  - [ ] Test updates detected
  - [ ] Test conflicts handled

---

## 9.3 Confidential Events

### Step 9.3.1: Confidential Event Sync

- [ ] **Handle confidential events**
  - [ ] Use alternateTitle for Google
  - [ ] Keep real title local only

- [ ] **Write tests**
  - [ ] Test alternate title sent to Google
  - [ ] Test real title stays local

---

# PHASE 10: Reminders & Notifications

**Estimated Time:** 1-2 days
**Dependencies:** Phase 9 complete

---

## 10.1 Reminder Data Model

### Step 10.1.1: Reminder Model

- [ ] **Add reminders to tasks/events**
  - [ ] Define Reminder interface
  - [ ] Support multiple reminders per item
  - [ ] Store with task/event

- [ ] **Write tests**
  - [ ] Test reminders stored
  - [ ] Test multiple allowed

---

## 10.2 Push Notification Setup

### Step 10.2.1: Push Notifications

- [ ] **Configure Firebase Cloud Messaging**
  - [ ] Set up FCM in Firebase console
  - [ ] Add FCM SDK to app

- [ ] **Request permission**
  - [ ] Prompt user for notification permission
  - [ ] Handle denied permission

- [ ] **Store device token**
  - [ ] Save token to user document

- [ ] **Create cloud function**
  - [ ] Function to send notifications
  - [ ] Trigger on reminder time

- [ ] **Write tests**
  - [ ] Test permission requested
  - [ ] Test token stored
  - [ ] Test notification received

---

## 10.3 Snooze Functionality

### Step 10.3.1: Snooze

- [ ] **Add snooze options**
  - [ ] 5, 15, 30, 60 minutes

- [ ] **Reschedule reminder**
  - [ ] Update reminder time on snooze

- [ ] **In-app notification banner**
  - [ ] Show banner for in-app notifications

- [ ] **Write tests**
  - [ ] Test snooze options work
  - [ ] Test reminder rescheduled

---

# PHASE 11: Offline Support & Sync

**Estimated Time:** 2-3 days
**Dependencies:** Phase 10 complete

---

## 11.1 IndexedDB Setup

### Step 11.1.1: IndexedDB Setup

- [ ] **Install IndexedDB library**
  - [ ] Install Dexie or idb

- [ ] **Configure local database**
  - [ ] Create tables mirroring Firestore
  - [ ] Define schemas

- [ ] **Sync to local on fetch**
  - [ ] Store fetched data locally
  - [ ] Read from local when offline

- [ ] **Write tests**
  - [ ] Test data stored locally
  - [ ] Test queries work offline

---

## 11.2 Sync Queue

### Step 11.2.1: Sync Queue

- [ ] **Create sync queue**
  - [ ] Define SyncQueueItem interface
  - [ ] Store pending changes

- [ ] **Intercept mutations offline**
  - [ ] Detect offline state
  - [ ] Queue changes with timestamps

- [ ] **Replay on reconnect**
  - [ ] Detect online state
  - [ ] Process queue in order

- [ ] **Write tests**
  - [ ] Test changes queued offline
  - [ ] Test replayed on connect

---

## 11.3 Conflict Resolution

### Step 11.3.1: Conflict Resolution

- [ ] **Detect conflicts**
  - [ ] Compare timestamps
  - [ ] Identify conflicting changes

- [ ] **Show conflict UI**
  - [ ] Display both versions
  - [ ] Let user choose resolution

- [ ] **Apply resolution**
  - [ ] Keep chosen version
  - [ ] Discard other

- [ ] **Write tests**
  - [ ] Test conflicts detected
  - [ ] Test UI shows options
  - [ ] Test resolution applied

---

# PHASE 12: Search, Filters & Polish

**Estimated Time:** 2-3 days
**Dependencies:** Phase 11 complete

---

## 12.1 Unified Search

### Step 12.1.1: Unified Search

- [ ] **Create search bar**
  - [ ] Add to header

- [ ] **Implement search**
  - [ ] Search tasks, events, notes
  - [ ] Partial matches
  - [ ] Case insensitive

- [ ] **Display results**
  - [ ] Highlight matches
  - [ ] Group by type

- [ ] **Write tests**
  - [ ] Test search returns results
  - [ ] Test partial matches
  - [ ] Test results grouped

---

## 12.2 Filter System

### Step 12.2.1: Filters

- [ ] **Create filter controls**
  - [ ] Filter by status
  - [ ] Filter by category
  - [ ] Filter by priority

- [ ] **Implement filtering logic**
  - [ ] Filters combine
  - [ ] Apply to task list

- [ ] **Add reset functionality**
  - [ ] Clear all filters

- [ ] **Write tests**
  - [ ] Test each filter works
  - [ ] Test combinations work
  - [ ] Test reset clears filters

---

## 12.3 Settings & Preferences

### Step 12.3.1: Settings Page

- [ ] **Create Settings page**
  - [ ] Theme (light/dark/system)
  - [ ] Font size
  - [ ] Default priority
  - [ ] Timezone
  - [ ] Notification preferences

- [ ] **Persist settings**
  - [ ] Save to UserSettings
  - [ ] Apply on load

- [ ] **Write tests**
  - [ ] Test settings save
  - [ ] Test theme applies
  - [ ] Test preferences respected

---

## 12.4 Final Integration & Testing

### Step 12.4.1: Final Integration Testing

- [ ] **Create E2E test suite**
  - [ ] Install Cypress
  - [ ] Configure for project

- [ ] **Write comprehensive E2E tests**
  - [ ] Test full user flow: login → create → edit → complete
  - [ ] Test recurring task lifecycle
  - [ ] Test event creation and Google sync
  - [ ] Test offline/online transition
  - [ ] Test search and filter

- [ ] **Performance testing**
  - [ ] Check load times
  - [ ] Verify no console errors

- [ ] **Verify all tests pass**
  - [ ] Run full test suite
  - [ ] Fix any failures

---

### Step 12.4.2: Deployment Setup

- [ ] **Configure hosting**
  - [ ] Set up Vercel/Netlify/Firebase Hosting

- [ ] **Configure production environment**
  - [ ] Set production environment variables
  - [ ] Configure domain (if applicable)

- [ ] **Set up CI/CD**
  - [ ] Create GitHub Actions workflow
  - [ ] Run tests on PR
  - [ ] Deploy on merge to main

- [ ] **Final verification**
  - [ ] Verify build succeeds
  - [ ] Verify deploy works
  - [ ] Test production app

- [ ] **Write deployment tests**
  - [ ] Test build succeeds
  - [ ] Test deploy works
  - [ ] Test production functional

---

# Post-Launch Tasks

- [ ] **Monitor for errors**
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Monitor Firebase usage

- [ ] **Gather user feedback**
  - [ ] Create feedback mechanism
  - [ ] Review and prioritize improvements

- [ ] **Documentation**
  - [ ] Write user guide
  - [ ] Document code architecture
  - [ ] Create API documentation

---

# Notes Section

## Progress Notes

_Use this section to track progress, blockers, and decisions._

| Date | Note |
|------|------|
| 2026-01-24 | Phase 1.1.1 complete - Project scaffolding with Vite, React, TypeScript, Tailwind CSS, Vitest. 6 tests passing. |
| 2026-01-25 | Phase 1.1.2 complete - ESLint and Prettier configured with flat config format. |
| 2026-01-25 | Phase 1.2.1 complete - Task type definitions created with comprehensive tests (30 tests). |
| 2026-01-25 | Phase 1.2.2 complete - Event, Category, Note, User, and Common type definitions created with tests (154 total tests passing). |
| 2026-01-30 | Phase 1.3.1 complete - Firebase configuration with environment variables and singleton pattern. |
| 2026-01-30 | Phase 1.3.2 complete - Tasks service layer with full CRUD operations and tests. |
| 2026-01-30 | Phase 1.4.1 complete - Authentication context, AuthProvider, useAuth hook, and users service. |
| 2026-01-30 | Phase 1.4.2 complete - Login page, Button, Spinner components, routing with auth guards. |
| 2026-01-31 | Phase 1 fully complete - All type definitions, Firebase config, Auth flow, and project foundation in place. |
| 2026-01-31 | Step 2.1.1 complete - Redux store configuration with typed hooks, Provider setup, comprehensive tests (67 new tests: 21 store + 17 hooks + 29 test-utils). Total: 325 tests passing. |
| 2026-01-31 | Step 2.2.1 complete - Task slice with normalized state, all reducers (setTasks, addTask, updateTask, removeTask, etc.), comprehensive selectors, 55 tests. |
| 2026-01-31 | Step 2.2.2 complete - Task async thunks (fetchTasksByDate, createTask, updateTaskAsync, deleteTask, hardDeleteTask, restoreTask, batchUpdateTasksAsync, fetchTasksByDateRange), extraReducers for all thunk states, 33 thunk tests. Total: 88 task tests, overall 358+ tests passing. |
| 2026-01-31 | Step 2.3.1 complete - Category slice with full CRUD, service layer, async thunks. Added categoryReducer to store. 76 new tests (20 service + 32 slice + 24 thunk). Phase 2 complete! Total: 434 tests passing. |
| 2026-01-31 | Step 3.1.1 complete - Task List components (TaskItem, TaskPriorityGroup, TaskList) with taskUtils. 132 new tests (43 utility + 38 TaskItem + 25 TaskPriorityGroup + 26 TaskList). Total: 566 tests passing. |
| 2026-01-31 | Step 3.1.2 complete - TaskListContainer with Redux integration, useTasksByDate/useSelectedDateTasks hooks, statusUtils, mock data utilities. 104 new tests (36 mockData + 11 hooks + 16 TaskListContainer + 8 statusUtils + 33 existing). Total: 670 tests passing. |
| 2026-02-01 | Step 3.2.1 complete - Form components (Input, Select, TextArea, DatePicker, TimePicker) with accessibility, validation, React useId() hook. TaskForm with full validation and create/edit modes. |
| 2026-02-01 | Step 3.2.2 complete - Modal component with focus trap, body scroll lock, accessibility. CreateTaskModal with Redux integration. TasksPage with FloatingActionButton. App.tsx updated to render TasksPage. |
| 2026-02-01 | Backend security review - Added authorization checks to all service methods, improved XSS sanitization, added batch size limits, enhanced Firestore security rules. |
| 2026-02-01 | Frontend code review - Fixed race conditions in hooks, improved accessibility (ARIA labels), added useAnnouncement hook for screen reader support, optimized performance. |
| 2026-02-01 | Code review fixes applied - Fixed testId TypeScript interfaces, replaced manual ID generation with useId(), added user-friendly error messages. Tests in progress. |
| 2026-02-02 | Steps 3.2.1 and 3.2.2 tests complete - Fixed 64 failing tests, added 72 new tests. Total: 874 tests passing across 33 test files. |
| 2026-02-02 | Step 3.3.1 complete - EditTaskModal with update/delete, TaskForm edit mode (status dropdown, created date), ConfirmDialog tests. Added 72 new tests. Total: 946 tests passing across 35 test files. |
| 2026-02-02 | UI tweak - Simplified priority dropdown to show only A, B, C, D without descriptions. |
| 2026-02-02 | Step 3.4.1 complete - Priority System Auto-numbering. Created priorityUtils.ts with getNextPriorityNumber, reorderTasksInPriority, reorderAllTasks, hasGapsInPriorityNumbering. Updated createTask thunk for auto-numbering. Added reorderTasks thunk. Added "Reorder All" button to TasksPage. 51 new tests. Total: 997 tests passing across 36 test files. |
| 2026-02-02 | Step 3.5.1 complete - Status Symbols Click-to-Change. Created StatusSymbol component with click-to-cycle, arrow key navigation, tooltips, loading states, size variants. Updated TaskItem to use StatusSymbol. Added onStatusCycleBackward support through TaskList, TaskPriorityGroup, TaskListContainer. 50 new tests. Total: 1047 tests passing across 37 test files. |
| 2026-02-02 | Step 3.6.1 complete - Drag and Drop Setup. Installed @dnd-kit packages. Created DragHandle, SortableTaskItem, SortablePriorityGroup, DraggableTaskList components. Updated TaskListContainer to use DraggableTaskList with reorder callback. Fixed test setup with PointerEvent mock. 32 new tests. Total: 1079 tests passing across 39 test files. |
| 2026-02-02 | Step 3.6.2 complete - Drag and Drop Persist and Polish. Created reorderTasksAsync thunk with Firestore persistence. Added rollback functionality for error recovery. Visual feedback (scale, opacity, drop indicator, DragOverlay). Performance optimizations (React.memo, early returns). Accessibility improvements (keyboard instructions, larger touch targets). Code review fixes applied: missing import, rollback state, memoization. 33 new tests. Total: 1112 tests passing across 42 test files. **Phase 3 Complete!** |
| 2026-02-02 | Step 4.3.1 complete - Tab System. Created Tabs component with horizontal tab bar, active tab highlighting, click-to-switch, keyboard accessible (Arrow Left/Right). Created TabPanel component with conditional rendering and ARIA attributes. Created icon components (CheckIcon, CalendarIcon, NoteIcon) in `src/components/icons/index.tsx`. Updated DailyView to use tabs with activeTab state, renderTabPanel, three panels for Tasks/Calendar/Notes. Code review fixes applied: roving tabindex pattern (tabIndex={0/-1}), removed auto-focus useEffect, DAILY_VIEW_TABS moved inside component with useMemo, runtime validation in handleTabChange. 156 new tests (Tabs 80 + TabPanel 43 + Icons 33). Total: 1468 tests passing across 52 test files. |
| 2026-02-02 | Step 4.2.1 complete - Daily View Layout. Created AppLayout wrapper with skip-to-content link, Header with branding and hamburger menu, UserMenu dropdown with user info and sign out, DailyView main container with DateNavigation, tab bar (Tasks/Calendar/Notes), and content area. Implemented keyboard navigation (Arrow keys for tabs, Escape to close menus). Code review fixes applied: Tab id attributes for ARIA, removed redundant role="main", arrow key navigation for tabs, modal integration tests. 152 new tests (AppLayout 36 + Header 53 + UserMenu 74 + DailyView 85). Total: 1366 tests passing across 49 test files. |
| 2026-02-02 | Step 4.1.1 complete - Date Navigation Component. Created dateUtils.ts with formatDisplayDate, addDays, isToday, parseISODate, toISODateString, getTodayString. Created DateNavigation component with prev/next day buttons, Today button, keyboard shortcuts (Arrow keys, 'T'), full accessibility (ARIA labels, aria-live). Created DateNavigationContainer with Redux integration. Memoization with React.memo and custom arePropsEqual. Code review fixes applied: use getTodayString utility, add testId to arePropsEqual. 102 new tests (39 dateUtils + 44 DateNavigation + 19 Container). Total: 1214 tests passing across 45 test files. **Phase 4 Started!** |
| 2026-02-02 | Step 5.1.1 complete - Category List Component. Created CategoryList presentation component with color swatches, edit/delete buttons, loading/empty states. Created CategoryListContainer with Redux integration. Code review identified Critical hooks violation (conditional useCallback), fixed. Added React.memo optimization to CategoryItem. 81 new tests (56 presentation + 25 container). Total: 1588 tests passing across 55 test files. **Phase 5 Started!** |
| 2026-02-02 | Step 5.3.1 complete - Category Assignment in Task Form. Created CategorySelect custom dropdown component with color dots next to category names, full keyboard navigation (Arrow keys, Enter, Escape, Home, End), accessibility (ARIA listbox/option pattern), click-outside-to-close. Replaced native Select in TaskForm with CategorySelect. Code review optimizations applied: React.memo, useMemo for options, useCallback for handleKeyDown. 55 new tests. Total: 1763 tests passing across 60 test files. **Phase 5 Complete!** |
| 2026-02-02 | UI Change - Priority input changed from dropdown to text field. Users now type "A1", "B2", "C" etc. directly. Added parsePriority() function, auto-uppercase, validation (letter A-D required, number 1-99 optional). 5 new tests. Total: 1768 tests passing across 60 test files. |
| 2026-02-02 | Step 6.1.1 complete - RecurrenceForm component. Supports daily/weekly/monthly/yearly/custom recurrence types with button toggles. Interval input, days of week checkboxes (Su-Sa), day/month selectors, end conditions (never/date/occurrences). Touched state validation for UX. Full accessibility support (ARIA, keyboard nav). Code review fixes: prop sync, stale closure fixes. 36 new tests. Total: 1804 tests passing across 61 test files. **Phase 6 Started!** |
| 2026-02-02 | Step 6.1.2 complete - Recurrence integration with Task Form. Created Toggle component (reusable switch with accessibility). Updated TaskForm to add Repeat toggle, conditional RecurrenceForm display, default recurrence pattern when enabled. Added 34 new tests (26 Toggle + 8 TaskForm recurrence integration). Total: 1838 tests passing across 62 test files. **Phase 6: 2/20 complete (10%).** |

## Blockers

_Track any blockers here._

| Blocker | Status | Resolution |
|---------|--------|------------|
| | | |

## Decisions Made

_Document key technical decisions._

| Decision | Rationale | Date |
|----------|-----------|------|
| Use ESLint flat config format | Vite template uses modern flat config; more maintainable than legacy .eslintrc | 2026-01-25 |
| Store dates as ISO strings in types | Easier JSON serialization and Firestore compatibility | 2026-01-25 |
| Use string union types for enums | Better TypeScript inference and tree-shaking | 2026-01-25 |
| Comprehensive type testing | Ensures type contracts are maintained; catches breaking changes early | 2026-01-25 |
| Priority as text input (not dropdown) | Faster entry - user types "A1" directly instead of selecting letter then number; more intuitive for Franklin-Covey power users | 2026-02-02 |

---

**End of TODO Document**

_Total Tasks: 225_
_Estimated Duration: 18-27 days_
