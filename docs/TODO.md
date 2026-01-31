# Neill Planner — Implementation TODO

**Project:** Neill Planner - Franklin-Covey Productivity Application
**Created:** January 24, 2026
**Status:** In Progress
**Last Updated:** January 31, 2026
**Estimated Duration:** 18-27 days

---

## Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 25/25 |
| Phase 2: Data Layer | 🟡 In Progress | 17/22 |
| Phase 3: Core Tasks | ⬜ Not Started | 0/35 |
| Phase 4: Date & Daily View | ⬜ Not Started | 0/18 |
| Phase 5: Categories | ⬜ Not Started | 0/15 |
| Phase 6: Recurring Tasks | ⬜ Not Started | 0/20 |
| Phase 7: Events & Calendar | ⬜ Not Started | 0/22 |
| Phase 8: Notes System | ⬜ Not Started | 0/16 |
| Phase 9: Google Calendar | ⬜ Not Started | 0/14 |
| Phase 10: Reminders | ⬜ Not Started | 0/12 |
| Phase 11: Offline Support | ⬜ Not Started | 0/12 |
| Phase 12: Polish & Deploy | ⬜ Not Started | 0/18 |
| **TOTAL** | | **42/229** |

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

- [ ] **Create category slice**
  - [ ] Create `src/features/categories/categorySlice.ts`
  - [ ] Define CategoriesState interface
  - [ ] Create categorySlice with reducers
  - [ ] Create async thunks (fetchCategories, createCategory, updateCategoryAsync, deleteCategory)
  - [ ] Create selectors

- [ ] **Create categories service**
  - [ ] Create `src/services/firebase/categories.service.ts`
  - [ ] Implement createCategory
  - [ ] Implement getCategories
  - [ ] Implement updateCategory
  - [ ] Implement deleteCategory

- [ ] **Add to store**
  - [ ] Add categoryReducer to store

- [ ] **Write tests**
  - [ ] Test all reducers
  - [ ] Test all thunks
  - [ ] Test selectors
  - [ ] Test service layer

- [ ] **Create categories index**
  - [ ] Create `src/features/categories/index.ts`
  - [ ] Export slice, actions, thunks, selectors

---

# PHASE 3: Core Task Features

**Estimated Time:** 2-3 days
**Dependencies:** Phase 2 complete

---

## 3.1 Task List Component

### Step 3.1.1: Task List Component - Basic Rendering

- [ ] **Create TaskList component**
  - [ ] Create `src/components/tasks/TaskList.tsx`
  - [ ] Define TaskListProps interface
  - [ ] Group tasks by priority letter
  - [ ] Render TaskPriorityGroup for each group
  - [ ] Show empty state if no tasks

- [ ] **Create TaskPriorityGroup component**
  - [ ] Create component with priority header
  - [ ] Apply color coding (A=red, B=orange, C=yellow, D=gray)
  - [ ] Render TaskItem for each task

- [ ] **Create TaskItem component**
  - [ ] Display priority label (e.g., "A1")
  - [ ] Display status symbol
  - [ ] Display task title
  - [ ] Display category color
  - [ ] Show recurrence icon if applicable
  - [ ] Apply completed styling
  - [ ] Handle click

- [ ] **Create task components index**
  - [ ] Create `src/components/tasks/index.ts`
  - [ ] Export TaskList, TaskItem, TaskPriorityGroup

- [ ] **Create task utilities**
  - [ ] Create `src/utils/taskUtils.ts`
  - [ ] Implement groupTasksByPriority
  - [ ] Implement sortTasksByPriority
  - [ ] Implement getStatusSymbol
  - [ ] Implement getPriorityColor

- [ ] **Write component tests**
  - [ ] Test TaskList renders empty state
  - [ ] Test TaskList groups by priority
  - [ ] Test TaskItem renders title
  - [ ] Test TaskItem renders status symbol
  - [ ] Test TaskItem shows recurrence icon

- [ ] **Write utility tests**
  - [ ] Test groupTasksByPriority
  - [ ] Test sortTasksByPriority
  - [ ] Test getStatusSymbol

---

### Step 3.1.2: Task List Integration with Redux

- [ ] **Create TaskListContainer**
  - [ ] Create `src/features/tasks/TaskListContainer.tsx`
  - [ ] Use useAppSelector for tasks
  - [ ] Use useAppSelector for categories
  - [ ] Use useAppDispatch
  - [ ] Use useAuth for current user
  - [ ] Dispatch fetchTasksByDate on mount
  - [ ] Handle onTaskClick
  - [ ] Handle onStatusChange
  - [ ] Show loading/error states

- [ ] **Update TaskItem for category colors**
  - [ ] Look up category by task.categoryId
  - [ ] Apply category color to left border

- [ ] **Create useTasksByDate hook**
  - [ ] Create `src/features/tasks/hooks.ts`
  - [ ] Implement hook that fetches and returns tasks

- [ ] **Write integration tests**
  - [ ] Test renders loading state
  - [ ] Test dispatches fetch on mount
  - [ ] Test renders tasks from store
  - [ ] Test status change dispatches update
  - [ ] Test shows error message

- [ ] **Create mock data utilities**
  - [ ] Create `src/test/mockData.ts`
  - [ ] Implement createMockTask
  - [ ] Implement createMockCategory
  - [ ] Implement createMockUser

---

## 3.2 Task Creation

### Step 3.2.1: Task Creation Form

- [ ] **Create form components**
  - [ ] Create `src/components/common/Input.tsx`
  - [ ] Create `src/components/common/Select.tsx`
  - [ ] Create `src/components/common/TextArea.tsx`
  - [ ] Create `src/components/common/DatePicker.tsx`
  - [ ] Create `src/components/common/TimePicker.tsx`
  - [ ] Update common index exports

- [ ] **Create TaskForm component**
  - [ ] Create `src/components/tasks/TaskForm.tsx`
  - [ ] Define TaskFormProps interface
  - [ ] Add title field (required)
  - [ ] Add description field (optional)
  - [ ] Add priority letter select (A/B/C/D)
  - [ ] Add priority number input
  - [ ] Add category select
  - [ ] Add scheduled date picker
  - [ ] Add scheduled time picker
  - [ ] Implement validation
  - [ ] Handle submit and cancel

- [ ] **Write form tests**
  - [ ] Test renders all fields
  - [ ] Test title is required
  - [ ] Test submits with valid data
  - [ ] Test calls onCancel
  - [ ] Test populates initialValues
  - [ ] Test priority letter defaults correctly

- [ ] **Write input component tests**
  - [ ] Test Input renders label
  - [ ] Test Input displays error
  - [ ] Test Select renders options

---

### Step 3.2.2: Task Creation Modal and Integration

- [ ] **Create Modal component**
  - [ ] Create `src/components/common/Modal.tsx`
  - [ ] Define ModalProps interface
  - [ ] Implement overlay with backdrop
  - [ ] Implement centered modal card
  - [ ] Add close button
  - [ ] Handle backdrop click close
  - [ ] Handle Escape key close
  - [ ] Prevent body scroll when open

- [ ] **Create CreateTaskModal**
  - [ ] Create `src/features/tasks/CreateTaskModal.tsx`
  - [ ] Use Modal component
  - [ ] Render TaskForm inside
  - [ ] Dispatch createTask thunk on submit
  - [ ] Close modal on success
  - [ ] Show error in form on failure
  - [ ] Pass selected date as default

- [ ] **Create TasksPage**
  - [ ] Create `src/features/tasks/TasksPage.tsx`
  - [ ] Render TaskListContainer
  - [ ] Add "Add Task" button
  - [ ] Manage CreateTaskModal open state

- [ ] **Create FloatingActionButton**
  - [ ] Create `src/components/common/FloatingActionButton.tsx`
  - [ ] Fixed position bottom-right
  - [ ] Round button with + icon
  - [ ] onClick handler

- [ ] **Update App routing**
  - [ ] Route "/" to TasksPage when authenticated

- [ ] **Write tests**
  - [ ] Test Modal renders when open
  - [ ] Test Modal closes on backdrop click
  - [ ] Test Modal closes on Escape
  - [ ] Test CreateTaskModal dispatches action
  - [ ] Test CreateTaskModal closes on success
  - [ ] Test TasksPage opens modal on button click

---

## 3.3 Task Editing

### Step 3.3.1: Task Editing

- [ ] **Create EditTaskModal**
  - [ ] Create `src/features/tasks/EditTaskModal.tsx`
  - [ ] Accept task prop
  - [ ] Use Modal and TaskForm
  - [ ] Pass initialValues from task
  - [ ] Pass isEditing={true}
  - [ ] Dispatch updateTaskAsync on submit
  - [ ] Add delete button

- [ ] **Update TaskForm for editing**
  - [ ] Change submit button text based on isEditing
  - [ ] Show status dropdown when editing
  - [ ] Show created date read-only when editing
  - [ ] Handle pre-populated fields

- [ ] **Create ConfirmDialog**
  - [ ] Create `src/components/common/ConfirmDialog.tsx`
  - [ ] Define props (isOpen, onConfirm, onCancel, title, message, etc.)
  - [ ] Implement small modal with message
  - [ ] Add Cancel and Confirm buttons
  - [ ] Support danger variant

- [ ] **Update TasksPage for editing**
  - [ ] Add selectedTask state
  - [ ] Open EditTaskModal when task clicked
  - [ ] Clear selectedTask on modal close

- [ ] **Update TaskItem**
  - [ ] On click, call onTaskClick with task

- [ ] **Write tests**
  - [ ] Test form populated with task data
  - [ ] Test dispatches updateTaskAsync
  - [ ] Test delete button opens confirmation
  - [ ] Test confirming delete dispatches deleteTask
  - [ ] Test ConfirmDialog renders message
  - [ ] Test ConfirmDialog calls handlers

---

## 3.4 Priority System

### Step 3.4.1: Priority System - Auto-numbering

- [ ] **Create priority utilities**
  - [ ] Create `src/utils/priorityUtils.ts`
  - [ ] Implement getNextPriorityNumber
  - [ ] Implement reorderTasksInPriority
  - [ ] Implement reorderAllTasks

- [ ] **Update createTask thunk**
  - [ ] Calculate next priority number before creating
  - [ ] Include in CreateTaskInput

- [ ] **Add reorderTasks thunk**
  - [ ] Create reorderTasks async thunk
  - [ ] Batch update tasks with new priority numbers

- [ ] **Add "Reorder All" button**
  - [ ] Add button to TasksPage
  - [ ] Dispatch reorderTasks for all tasks on selected date

- [ ] **Implement batch update service**
  - [ ] Add batchUpdatePriorityNumbers to tasks.service.ts
  - [ ] Use Firestore batch/transaction

- [ ] **Write tests**
  - [ ] Test getNextPriorityNumber returns 1 for empty
  - [ ] Test getNextPriorityNumber returns next number
  - [ ] Test reorderTasksInPriority fills gaps
  - [ ] Test reorderAllTasks handles multiple priorities
  - [ ] Integration test: create tasks with gaps, reorder, verify

---

## 3.5 Status Symbols

### Step 3.5.1: Status Symbols - Click to Change

- [ ] **Create StatusSymbol component**
  - [ ] Create `src/components/tasks/StatusSymbol.tsx`
  - [ ] Accept status, onClick, size props
  - [ ] Render appropriate symbol
  - [ ] Apply color coding per status
  - [ ] Show tooltip on hover
  - [ ] Clickable when onClick provided

- [ ] **Create status utilities**
  - [ ] Create `src/utils/statusUtils.ts`
  - [ ] Define STATUS_ORDER constant
  - [ ] Implement getNextStatus
  - [ ] Implement getStatusLabel
  - [ ] Implement getStatusColor

- [ ] **Update TaskItem**
  - [ ] Replace static symbol with StatusSymbol
  - [ ] On click, call onStatusChange with next status
  - [ ] Prevent event propagation

- [ ] **Create Tooltip component**
  - [ ] Create `src/components/common/Tooltip.tsx`
  - [ ] Show on hover
  - [ ] Configurable position

- [ ] **Write tests**
  - [ ] Test StatusSymbol renders correct symbol
  - [ ] Test StatusSymbol applies correct color
  - [ ] Test StatusSymbol calls onClick
  - [ ] Test StatusSymbol shows tooltip
  - [ ] Test getNextStatus cycles correctly
  - [ ] Test getStatusLabel returns correct labels
  - [ ] Integration: click status, verify it changes

---

## 3.6 Drag-and-Drop Reordering

### Step 3.6.1: Drag and Drop - Setup

- [ ] **Install dnd-kit**
  - [ ] Install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

- [ ] **Create DraggableTaskList**
  - [ ] Create `src/components/tasks/DraggableTaskList.tsx`
  - [ ] Wrap with DndContext
  - [ ] Use SortableContext per priority group
  - [ ] Handle onDragEnd

- [ ] **Create SortableTaskItem**
  - [ ] Create `src/components/tasks/SortableTaskItem.tsx`
  - [ ] Use useSortable hook
  - [ ] Apply transform/transition styles
  - [ ] Add drag handle

- [ ] **Create DragHandle component**
  - [ ] Create `src/components/common/DragHandle.tsx`
  - [ ] Six dots icon
  - [ ] Cursor grab/grabbing
  - [ ] Always visible

- [ ] **Update TaskPriorityGroup**
  - [ ] Wrap tasks in SortableContext
  - [ ] Use verticalListSortingStrategy

- [ ] **Handle reorder on drop**
  - [ ] Get old and new index
  - [ ] Verify same priority group
  - [ ] Calculate new order
  - [ ] Dispatch action

- [ ] **Add reorder action to taskSlice**
  - [ ] Implement reorderTaskLocal reducer

- [ ] **Write tests**
  - [ ] Test drag handle is visible
  - [ ] Test reorder logic works
  - [ ] Test items restricted to same priority

---

### Step 3.6.2: Drag and Drop - Persist and Polish

- [ ] **Create persist thunk**
  - [ ] Implement reorderTasksAsync thunk
  - [ ] Persist to Firestore

- [ ] **Update onDragEnd handler**
  - [ ] Calculate new priority numbers
  - [ ] Dispatch optimistic local update
  - [ ] Dispatch async persist
  - [ ] Handle error (revert)

- [ ] **Add visual feedback**
  - [ ] Scale transform when dragging
  - [ ] Show drop indicator line
  - [ ] Dim other items
  - [ ] Smooth transitions

- [ ] **Create drag overlay**
  - [ ] Use DragOverlay from @dnd-kit
  - [ ] Style preview (shadow, rotation)

- [ ] **Prevent cross-priority drag**
  - [ ] Verify source/destination same priority
  - [ ] Show visual indicator for invalid drop

- [ ] **Add animation on reorder**
  - [ ] CSS transitions for smooth movement

- [ ] **Write tests**
  - [ ] Test reorderTasksAsync calls batch update
  - [ ] Test optimistic update applied
  - [ ] Test error reverts update
  - [ ] Visual verification

---

# PHASE 4: Date Navigation & Daily View

**Estimated Time:** 1 day
**Dependencies:** Phase 3 complete

---

## 4.1 Date Navigation Component

### Step 4.1.1: Date Navigation Component

- [ ] **Install date-fns**
  - [ ] npm install date-fns (if not already)

- [ ] **Create date utilities**
  - [ ] Create `src/utils/dateUtils.ts`
  - [ ] Implement formatDisplayDate
  - [ ] Implement addDays
  - [ ] Implement isToday
  - [ ] Implement parseISODate
  - [ ] Implement toISODateString

- [ ] **Create DateNavigation component**
  - [ ] Create `src/components/common/DateNavigation.tsx`
  - [ ] Define props (selectedDate, onDateChange)
  - [ ] Add left arrow button (previous day)
  - [ ] Display formatted date
  - [ ] Add right arrow button (next day)
  - [ ] Add "Today" button
  - [ ] Disable Today if already on today
  - [ ] Optional: keyboard shortcuts

- [ ] **Create DateNavigationContainer**
  - [ ] Create `src/features/tasks/DateNavigationContainer.tsx`
  - [ ] Use useAppSelector for selectedDate
  - [ ] Use useAppDispatch for setSelectedDate
  - [ ] Connect to DateNavigation

- [ ] **Write tests**
  - [ ] Test formatDisplayDate
  - [ ] Test addDays
  - [ ] Test isToday
  - [ ] Test toISODateString
  - [ ] Test DateNavigation displays formatted date
  - [ ] Test previous button
  - [ ] Test next button
  - [ ] Test today button
  - [ ] Test today button disabled when on today

---

## 4.2 Daily View Layout

### Step 4.2.1: Daily View Layout

- [ ] **Create DailyView component**
  - [ ] Create `src/features/tasks/DailyView.tsx`
  - [ ] Define layout structure
  - [ ] Include Header area
  - [ ] Include DateNavigation area
  - [ ] Include Tab bar area
  - [ ] Include content area
  - [ ] Include footer actions area

- [ ] **Create Header component**
  - [ ] Create `src/components/layout/Header.tsx`
  - [ ] App logo/title "Neill Planner"
  - [ ] Hamburger menu button
  - [ ] User avatar/menu

- [ ] **Create UserMenu component**
  - [ ] Create `src/components/layout/UserMenu.tsx`
  - [ ] Dropdown menu component
  - [ ] Show user name/email
  - [ ] Settings link
  - [ ] Sign out button

- [ ] **Create AppLayout component**
  - [ ] Create `src/components/layout/AppLayout.tsx`
  - [ ] Header at top
  - [ ] Main content area
  - [ ] Responsive design

- [ ] **Update TasksPage**
  - [ ] Wrap content in AppLayout
  - [ ] Render DailyView inside

- [ ] **Write tests**
  - [ ] Test DailyView renders header
  - [ ] Test DailyView renders date navigation
  - [ ] Test DailyView renders content
  - [ ] Test Header renders app title
  - [ ] Test Header renders user menu
  - [ ] Test AppLayout renders children

---

## 4.3 Tab System (Tasks/Calendar/Notes)

### Step 4.3.1: Tab System

- [ ] **Create Tab types**
  - [ ] Define Tab interface (id, label, icon)
  - [ ] Define TabsProps interface

- [ ] **Create Tabs component**
  - [ ] Create `src/components/common/Tabs.tsx`
  - [ ] Horizontal tab bar
  - [ ] Active tab highlighted
  - [ ] Click to switch
  - [ ] Keyboard accessible

- [ ] **Create TabPanel component**
  - [ ] Only renders when active
  - [ ] ARIA attributes

- [ ] **Define daily view tabs constant**
  - [ ] Tasks tab
  - [ ] Calendar tab
  - [ ] Notes tab

- [ ] **Create icon components**
  - [ ] Create `src/components/icons/index.tsx`
  - [ ] CheckIcon
  - [ ] CalendarIcon
  - [ ] NoteIcon

- [ ] **Update DailyView to use tabs**
  - [ ] State for activeTab
  - [ ] Render Tabs component
  - [ ] Render TabPanel for each tab
  - [ ] Tasks tab: TaskListContainer
  - [ ] Calendar tab: placeholder
  - [ ] Notes tab: placeholder

- [ ] **Write tests**
  - [ ] Test Tabs renders all labels
  - [ ] Test active tab styling
  - [ ] Test clicking tab calls onTabChange
  - [ ] Test keyboard navigation
  - [ ] Test TabPanel renders when active
  - [ ] Test TabPanel hidden when inactive
  - [ ] Test switching tabs shows correct content

---

# PHASE 5: Categories & Colors

**Estimated Time:** 1 day
**Dependencies:** Phase 4 complete

---

## 5.1 Category Management

### Step 5.1.1: Category List Component

- [ ] **Create CategoryList component**
  - [ ] Show all user categories
  - [ ] Display color swatch, name, edit/delete buttons
  - [ ] "Add Category" button
  - [ ] Connect to Redux

- [ ] **Write tests**
  - [ ] Test renders list
  - [ ] Test shows colors
  - [ ] Test add button opens form

---

### Step 5.1.2: Category Form

- [ ] **Create CategoryForm component**
  - [ ] Name input (required, max 50 chars)
  - [ ] Color picker
  - [ ] Create/Update/Cancel buttons
  - [ ] Validation for unique names

- [ ] **Write tests**
  - [ ] Test form validation
  - [ ] Test color picker works
  - [ ] Test submit creates/updates

---

## 5.2 Color Picker

### Step 5.2.1: Color Picker Component

- [ ] **Create ColorPicker component**
  - [ ] Grid of preset colors
  - [ ] Custom color input (hex)
  - [ ] Preview of selected color
  - [ ] Accessible

- [ ] **Write tests**
  - [ ] Test preset colors selectable
  - [ ] Test custom color input
  - [ ] Test preview updates

---

## 5.3 Category Assignment

### Step 5.3.1: Category Assignment in Task Form

- [ ] **Update TaskForm**
  - [ ] Add category dropdown
  - [ ] Color preview next to selection
  - [ ] "Uncategorized" as default

- [ ] **Update TaskItem**
  - [ ] Show category color

- [ ] **Write tests**
  - [ ] Test dropdown shows categories
  - [ ] Test selection saves
  - [ ] Test color displays

---

# PHASE 6: Recurring Tasks

**Estimated Time:** 2 days
**Dependencies:** Phase 5 complete

---

## 6.1 Recurrence Pattern Definition

### Step 6.1.1: Recurrence Pattern Form

- [ ] **Create RecurrenceForm component**
  - [ ] Type selector (daily, weekly, monthly, yearly, custom)
  - [ ] Interval input
  - [ ] Days of week checkboxes (for weekly)
  - [ ] End condition options

- [ ] **Write tests**
  - [ ] Test all recurrence types
  - [ ] Test validation
  - [ ] Test end conditions

---

### Step 6.1.2: Integrate Recurrence with Task Form

- [ ] **Update TaskForm**
  - [ ] Add "Repeat" toggle
  - [ ] Show RecurrenceForm when enabled
  - [ ] Save pattern with task

- [ ] **Update TaskItem**
  - [ ] Show recurrence icon

- [ ] **Write tests**
  - [ ] Test toggle shows/hides form
  - [ ] Test pattern saved
  - [ ] Test icon displayed

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

---

**End of TODO Document**

_Total Tasks: 225_
_Estimated Duration: 18-27 days_
