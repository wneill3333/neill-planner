# Neill Planner — Implementation Blueprint

## Project Overview

This document provides a detailed, step-by-step blueprint for building the Neill Planner application. Each phase is broken into small, iterative chunks with test-driven development prompts suitable for a code-generation LLM.

**Target Stack:**
- Frontend: React 18+ with TypeScript
- State Management: Redux Toolkit
- Styling: Tailwind CSS
- Backend: Firebase (Auth, Firestore, Cloud Functions)
- Testing: Jest + React Testing Library + Cypress

---

## Phase 1: Project Foundation & Core Infrastructure

### 1.1 Project Scaffolding
### 1.2 Type Definitions
### 1.3 Firebase Configuration
### 1.4 Authentication Flow

## Phase 2: Data Layer & State Management

### 2.1 Redux Store Setup
### 2.2 Task Slice (CRUD)
### 2.3 Category Slice
### 2.4 Firestore Integration

## Phase 3: Core Task Features

### 3.1 Task List Component
### 3.2 Task Creation
### 3.3 Task Editing
### 3.4 Priority System
### 3.5 Status Symbols
### 3.6 Drag-and-Drop Reordering

## Phase 4: Date Navigation & Daily View

### 4.1 Date Navigation Component
### 4.2 Daily View Layout
### 4.3 Tab System (Tasks/Calendar/Notes)

## Phase 5: Categories & Colors

### 5.1 Category Management
### 5.2 Color Picker
### 5.3 Category Assignment

## Phase 6: Recurring Tasks

### 6.1 Recurrence Pattern Definition
### 6.2 Instance Generation
### 6.3 Edit This/All Future Logic

## Phase 7: Events & Calendar

### 7.1 Event Data Model
### 7.2 Event CRUD
### 7.3 Calendar Time-Block View
### 7.4 Week/Month Views

## Phase 8: Notes System

### 8.1 Notes Data Model
### 8.2 Notes CRUD
### 8.3 Rich Text Editor
### 8.4 Task/Event Linking

## Phase 9: Google Calendar Integration

### 9.1 OAuth Setup
### 9.2 Two-Way Sync
### 9.3 Confidential Events

## Phase 10: Reminders & Notifications

### 10.1 Reminder Data Model
### 10.2 Push Notification Setup
### 10.3 Snooze Functionality

## Phase 11: Offline Support & Sync

### 11.1 IndexedDB Setup
### 11.2 Sync Queue
### 11.3 Conflict Resolution

## Phase 12: Search, Filters & Polish

### 12.1 Unified Search
### 12.2 Filter System
### 12.3 Settings & Preferences
### 12.4 Final Integration & Testing

---

# Detailed Implementation Prompts

---

## PHASE 1: Project Foundation & Core Infrastructure

---

### Step 1.1.1: Create React Project with TypeScript

**Context:** Initialize the project with all required dependencies and folder structure.

**Testing Focus:** Verify project builds and runs without errors.

```text
PROMPT 1.1.1 - Project Initialization

Create a new React project for "Neill Planner" using Vite with TypeScript. Set up the following:

1. Initialize project:
   - Use Vite with React-TS template
   - Project name: neill-planner

2. Install core dependencies:
   - react-router-dom (v6+)
   - @reduxjs/toolkit react-redux
   - tailwindcss postcss autoprefixer
   - firebase
   - @types/node

3. Install dev dependencies:
   - vitest @vitest/ui
   - @testing-library/react @testing-library/jest-dom @testing-library/user-event
   - jsdom
   - @types/react @types/react-dom
   - eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   - prettier

4. Create folder structure:
   src/
   ├── components/
   │   ├── common/
   │   ├── tasks/
   │   ├── events/
   │   ├── notes/
   │   └── categories/
   ├── features/
   │   ├── auth/
   │   ├── tasks/
   │   ├── events/
   │   ├── notes/
   │   └── categories/
   ├── hooks/
   ├── services/
   │   ├── firebase/
   │   └── sync/
   ├── store/
   ├── types/
   ├── utils/
   └── test/
       └── setup.ts

5. Configure Tailwind CSS:
   - Initialize tailwind.config.js
   - Add Tailwind directives to index.css
   - Configure content paths

6. Configure Vitest:
   - Create vitest.config.ts
   - Set up jsdom environment
   - Configure test setup file

7. Create a simple App.tsx that renders "Neill Planner" heading

8. Write first test (src/App.test.tsx):
   - Test that App component renders without crashing
   - Test that "Neill Planner" text is present

Ensure all tests pass and the app runs in development mode.
```

---

### Step 1.1.2: Configure ESLint and Prettier

**Context:** Set up code quality tools for consistent code style.

**Testing Focus:** Linting passes on all files.

```text
PROMPT 1.1.2 - ESLint and Prettier Configuration

Configure ESLint and Prettier for the Neill Planner project:

1. Create .eslintrc.cjs with:
   - Extends: eslint:recommended, plugin:@typescript-eslint/recommended, plugin:react-hooks/recommended
   - Parser: @typescript-eslint/parser
   - Plugins: react-refresh
   - Rules for React best practices
   - Ignore patterns for dist, node_modules

2. Create .prettierrc with:
   - Semi: true
   - Single quotes: true
   - Tab width: 2
   - Trailing comma: es5
   - Print width: 100

3. Create .prettierignore:
   - dist, node_modules, coverage

4. Add npm scripts to package.json:
   - "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
   - "lint:fix": "eslint src --ext ts,tsx --fix"
   - "format": "prettier --write src"
   - "format:check": "prettier --check src"

5. Run linter and fix any issues in existing files

Verify: npm run lint and npm run format:check both pass
```

---

### Step 1.2.1: Define Core Type Definitions - Task

**Context:** Create TypeScript interfaces for the Task data model based on the specification.

**Testing Focus:** Type tests compile successfully.

```text
PROMPT 1.2.1 - Task Type Definitions

Create TypeScript type definitions for the Task entity in src/types/task.types.ts:

1. Define TaskPriority type:
   - letter: 'A' | 'B' | 'C' | 'D'
   - number: number

2. Define TaskStatus type as union:
   - 'not_started' | 'in_progress' | 'forward' | 'complete' | 'delete' | 'delegate'

3. Define TaskStatusSymbols constant object mapping:
   - not_started: '-'
   - in_progress: '●'
   - forward: '➜'
   - complete: '✔'
   - delete: '✘'
   - delegate: '◯'

4. Define RecurrenceType:
   - 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

5. Define RecurrenceEndCondition interface:
   - type: 'never' | 'date' | 'occurrences'
   - endDate: Date | null
   - maxOccurrences: number | null

6. Define RecurrencePattern interface:
   - type: RecurrenceType
   - interval: number
   - daysOfWeek: number[] (0=Sun to 6=Sat)
   - dayOfMonth: number | null
   - monthOfYear: number | null
   - endCondition: RecurrenceEndCondition
   - exceptions: Date[]

7. Define Task interface:
   - id: string
   - userId: string
   - title: string
   - description: string
   - categoryId: string | null
   - priority: TaskPriority
   - status: TaskStatus
   - scheduledDate: Date | null (defaults to selected date when creating)
   - recurrence: RecurrencePattern | null
   - linkedNoteIds: string[]
   - linkedEventId: string | null
   - isRecurringInstance: boolean
   - recurringParentId: string | null
   - instanceDate: Date | null
   - createdAt: Date
   - updatedAt: Date
   - deletedAt: Date | null

8. Define CreateTaskInput (omit auto-generated fields):
   - Omit id, createdAt, updatedAt, deletedAt, isRecurringInstance, recurringParentId, instanceDate

9. Define UpdateTaskInput:
   - Partial<CreateTaskInput> & { id: string }

10. Create src/types/index.ts that re-exports all types

Write type tests in src/types/__tests__/task.types.test.ts:
- Test that valid Task objects compile
- Test that invalid objects (wrong status, missing required fields) fail compilation
- Use @ts-expect-error comments to verify type safety

Ensure: npm run lint passes and types compile correctly
```

---

### Step 1.2.2: Define Core Type Definitions - Event, Category, Note

**Context:** Create remaining core type definitions.

**Testing Focus:** All types compile and integrate together.

```text
PROMPT 1.2.2 - Event, Category, Note Type Definitions

Create TypeScript type definitions for remaining entities:

1. Create src/types/event.types.ts:
   
   Event interface:
   - id: string
   - userId: string
   - title: string
   - description: string
   - categoryId: string | null
   - startTime: Date
   - endTime: Date
   - location: string
   - isConfidential: boolean
   - alternateTitle: string | null
   - recurrence: RecurrencePattern | null (reuse from task.types)
   - linkedNoteIds: string[]
   - linkedTaskIds: string[]
   - googleCalendarId: string | null
   - isRecurringInstance: boolean
   - recurringParentId: string | null
   - instanceDate: Date | null
   - createdAt: Date
   - updatedAt: Date
   - deletedAt: Date | null

   CreateEventInput and UpdateEventInput types

2. Create src/types/category.types.ts:
   
   Define CATEGORY_COLORS constant array:
   ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899']

   Category interface:
   - id: string
   - userId: string
   - name: string
   - color: string
   - sortOrder: number
   - createdAt: Date
   - updatedAt: Date

   CreateCategoryInput and UpdateCategoryInput types

3. Create src/types/note.types.ts:
   
   Note interface:
   - id: string
   - userId: string
   - title: string
   - content: string (HTML or Markdown)
   - date: Date
   - categoryId: string | null
   - linkedTaskIds: string[]
   - linkedEventIds: string[]
   - createdAt: Date
   - updatedAt: Date
   - deletedAt: Date | null

   CreateNoteInput and UpdateNoteInput types

4. Create src/types/user.types.ts:
   
   UserRole type: 'admin' | 'standard'
   
   User interface:
   - id: string
   - email: string
   - displayName: string
   - role: UserRole
   - googleCalendarConnected: boolean
   - createdAt: Date
   - lastLoginAt: Date

   UserSettings interface:
   - userId: string
   - theme: 'light' | 'dark' | 'system'
   - fontSize: 'small' | 'medium' | 'large'
   - defaultPriorityLetter: 'A' | 'B' | 'C' | 'D'
   - defaultReminderMinutes: number
   - timezone: string
   - weekStartsOn: 0 | 1
   - notifications: { push: boolean, email: boolean, inApp: boolean }
   - googleCalendarSyncEnabled: boolean

5. Update src/types/index.ts to export all types

6. Create src/types/common.types.ts:
   - Timestamp type alias
   - SyncStatus type: 'synced' | 'syncing' | 'pending' | 'offline' | 'error'

Write type compilation tests for each file.

Ensure all types are properly exported and no circular dependencies exist.
```

---

### Step 1.3.1: Firebase Configuration

**Context:** Set up Firebase configuration with environment variables.

**Testing Focus:** Firebase initializes without errors.

```text
PROMPT 1.3.1 - Firebase Configuration

Set up Firebase configuration for Neill Planner:

1. Create src/services/firebase/config.ts:
   - Import firebase/app, firebase/auth, firebase/firestore
   - Define firebaseConfig object reading from environment variables:
     - VITE_FIREBASE_API_KEY
     - VITE_FIREBASE_AUTH_DOMAIN
     - VITE_FIREBASE_PROJECT_ID
     - VITE_FIREBASE_STORAGE_BUCKET
     - VITE_FIREBASE_MESSAGING_SENDER_ID
     - VITE_FIREBASE_APP_ID
   - Initialize Firebase app (check if already initialized)
   - Export auth instance (getAuth)
   - Export db instance (getFirestore)
   - Export app instance

2. Create .env.example file with placeholder values:
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id

3. Add .env to .gitignore

4. Create src/services/firebase/index.ts:
   - Re-export auth, db, app from config

5. Create src/services/firebase/__tests__/config.test.ts:
   - Mock Firebase modules
   - Test that initializeApp is called with correct config
   - Test that auth and db are exported
   - Test that app doesn't reinitialize if already exists

6. Update vite.config.ts to handle environment variables properly

Ensure: Tests pass with mocked Firebase
```

---

### Step 1.3.2: Firestore Service Layer - Tasks

**Context:** Create Firestore service functions for Task CRUD operations.

**Testing Focus:** Service functions work with mocked Firestore.

```text
PROMPT 1.3.2 - Firestore Task Service

Create Firestore service layer for Tasks in src/services/firebase/tasks.service.ts:

1. Import necessary Firestore functions:
   - collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc
   - query, where, orderBy, Timestamp
   - Import db from config
   - Import Task types

2. Define TASKS_COLLECTION constant: 'tasks'

3. Create helper functions:
   
   taskToFirestore(task: Task): converts Task to Firestore document format
   - Convert Date objects to Firestore Timestamps
   - Handle null values appropriately
   
   firestoreToTask(doc: DocumentSnapshot): converts Firestore doc to Task
   - Convert Timestamps back to Date objects
   - Include document ID

4. Create service functions:

   async function createTask(input: CreateTaskInput, userId: string): Promise<Task>
   - Generate timestamps (createdAt, updatedAt)
   - Set default values (isRecurringInstance: false, etc.)
   - Add to Firestore
   - Return created task with ID

   async function getTask(taskId: string): Promise<Task | null>
   - Get document by ID
   - Return null if not found
   - Convert to Task type

   async function getTasksByDate(userId: string, date: Date): Promise<Task[]>
   - Query tasks where userId matches AND scheduledDate equals date
   - Exclude soft-deleted (deletedAt != null)
   - Order by priority.letter, then priority.number
   - Return array of Tasks

   async function getTasksByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]>
   - Query tasks within date range
   - For recurring tasks and instances

   async function updateTask(input: UpdateTaskInput): Promise<Task>
   - Update updatedAt timestamp
   - Merge with existing document
   - Return updated task

   async function softDeleteTask(taskId: string): Promise<void>
   - Set deletedAt to current timestamp
   - Don't actually delete document

   async function hardDeleteTask(taskId: string): Promise<void>
   - Permanently delete document

   async function restoreTask(taskId: string): Promise<Task>
   - Set deletedAt to null
   - Return restored task

5. Create src/services/firebase/__tests__/tasks.service.test.ts:
   - Mock Firestore functions
   - Test createTask adds document and returns Task with ID
   - Test getTask returns null for non-existent
   - Test getTasksByDate filters correctly
   - Test updateTask merges fields
   - Test softDeleteTask sets deletedAt
   - Test restoreTask clears deletedAt

Export all functions from src/services/firebase/index.ts

Ensure: All tests pass with mocked Firestore
```

---

### Step 1.4.1: Authentication Context and Hook

**Context:** Create React context for authentication state management.

**Testing Focus:** Auth context provides user state correctly.

```text
PROMPT 1.4.1 - Authentication Context

Create authentication context and hook in src/features/auth/:

1. Create src/features/auth/AuthContext.tsx:
   
   Define AuthContextType interface:
   - user: User | null
   - loading: boolean
   - error: string | null
   - signInWithGoogle: () => Promise<void>
   - signOut: () => Promise<void>

   Create AuthContext with createContext<AuthContextType>

   Create AuthProvider component:
   - State: user, loading (initial true), error
   - useEffect to subscribe to Firebase auth state changes (onAuthStateChanged)
   - On auth state change:
     - If user exists, fetch/create user document in Firestore
     - Update lastLoginAt
     - Set user state
   - If no user, set user to null
   - Set loading to false when done

   Implement signInWithGoogle:
   - Use GoogleAuthProvider and signInWithPopup
   - Handle errors, set error state

   Implement signOut:
   - Call Firebase signOut
   - Clear user state

   Provide context value to children

2. Create src/features/auth/useAuth.ts:
   - Custom hook that uses useContext(AuthContext)
   - Throw error if used outside AuthProvider

3. Create src/features/auth/index.ts:
   - Export AuthProvider, useAuth, AuthContext

4. Create src/services/firebase/users.service.ts:
   
   async function getUser(userId: string): Promise<User | null>
   async function createUser(firebaseUser: FirebaseUser): Promise<User>
   async function updateLastLogin(userId: string): Promise<void>
   async function getUserSettings(userId: string): Promise<UserSettings | null>
   async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void>

5. Write tests in src/features/auth/__tests__/AuthContext.test.tsx:
   - Mock Firebase auth
   - Test AuthProvider renders children
   - Test loading state is true initially
   - Test user state updates on auth change
   - Test signInWithGoogle calls Firebase
   - Test signOut clears user
   - Test useAuth throws outside provider

6. Update App.tsx:
   - Wrap app with AuthProvider
   - Show loading spinner while auth loading
   - Conditionally render based on auth state

Ensure: All auth tests pass
```

---

### Step 1.4.2: Login Page Component

**Context:** Create the login page UI with Google sign-in button.

**Testing Focus:** Login page renders and sign-in button works.

```text
PROMPT 1.4.2 - Login Page Component

Create the login page in src/features/auth/LoginPage.tsx:

1. Create LoginPage component:
   - Use useAuth hook to get signInWithGoogle and error
   - Display app logo/title: "Neill Planner"
   - Display tagline: "Franklin-Covey Productivity System"
   - Show "Sign in with Google" button
   - Handle loading state during sign-in
   - Display error message if authentication fails
   - Style with Tailwind CSS:
     - Centered layout
     - Card with shadow
     - Amber/warm color scheme
     - Responsive design

2. Create src/components/common/Button.tsx:
   - Reusable button component
   - Props: variant ('primary' | 'secondary' | 'danger'), size, disabled, loading, children, onClick
   - Loading state shows spinner
   - Tailwind styling with variants

3. Create src/components/common/Spinner.tsx:
   - Simple loading spinner component
   - Configurable size
   - Uses Tailwind animation

4. Create src/components/common/index.ts:
   - Export Button, Spinner

5. Write tests in src/features/auth/__tests__/LoginPage.test.tsx:
   - Test renders app title
   - Test renders Google sign-in button
   - Test clicking button calls signInWithGoogle
   - Test displays error when present
   - Test shows loading state

6. Write tests for Button and Spinner components:
   - Test Button renders children
   - Test Button variants apply correct styles
   - Test Button loading state shows spinner
   - Test Spinner renders with correct size

7. Update App.tsx:
   - If not authenticated, show LoginPage
   - If authenticated, show main app (placeholder for now)

Ensure: All tests pass and login page displays correctly
```

---

## PHASE 2: Data Layer & State Management

---

### Step 2.1.1: Redux Store Setup

**Context:** Configure Redux store with TypeScript support.

**Testing Focus:** Store initializes and accepts actions.

```text
PROMPT 2.1.1 - Redux Store Configuration

Set up Redux store in src/store/:

1. Create src/store/store.ts:
   - Import configureStore from @reduxjs/toolkit
   - Create empty store initially (we'll add slices incrementally)
   - Export store
   - Export RootState type (ReturnType<typeof store.getState>)
   - Export AppDispatch type (typeof store.dispatch)

2. Create src/store/hooks.ts:
   - Create useAppDispatch hook (typed version of useDispatch)
   - Create useAppSelector hook (typed version of useSelector)
   - These provide proper TypeScript inference

3. Create src/store/index.ts:
   - Export store, RootState, AppDispatch
   - Export useAppDispatch, useAppSelector

4. Update main.tsx:
   - Import Provider from react-redux
   - Wrap App with Provider, passing store

5. Write tests in src/store/__tests__/store.test.ts:
   - Test store initializes without errors
   - Test getState returns expected shape
   - Test dispatch accepts actions

6. Update App.tsx test to work with Redux Provider:
   - Create test utility that wraps components with Provider
   - Update existing tests to use this utility

Create src/test/test-utils.tsx:
   - Export custom render function that includes:
     - Redux Provider
     - AuthProvider (mocked)
     - Router (BrowserRouter)
   - Export all from @testing-library/react

Ensure: Store works and all tests pass with Provider
```

---

### Step 2.2.1: Task Slice - Basic State

**Context:** Create Redux slice for task state management.

**Testing Focus:** Reducers update state correctly.

```text
PROMPT 2.2.1 - Task Slice Basic State

Create task slice in src/features/tasks/taskSlice.ts:

1. Define TasksState interface:
   - tasks: Record<string, Task> (normalized by ID)
   - taskIdsByDate: Record<string, string[]> (date string -> task IDs)
   - selectedDate: string (ISO date string)
   - loading: boolean
   - error: string | null
   - syncStatus: SyncStatus

2. Define initial state:
   - tasks: {}
   - taskIdsByDate: {}
   - selectedDate: new Date().toISOString().split('T')[0]
   - loading: false
   - error: null
   - syncStatus: 'synced'

3. Create taskSlice using createSlice:
   
   Reducers:
   
   setTasks(state, action: PayloadAction<Task[]>)
   - Normalize tasks into record
   - Group by scheduledDate
   - Clear loading, error
   
   addTask(state, action: PayloadAction<Task>)
   - Add to tasks record
   - Add ID to appropriate date array
   - Sort by priority
   
   updateTask(state, action: PayloadAction<Task>)
   - Update in tasks record
   - Handle date change (move between date arrays)
   
   removeTask(state, action: PayloadAction<string>)
   - Remove from tasks record
   - Remove from date array
   
   setSelectedDate(state, action: PayloadAction<string>)
   - Update selectedDate
   
   setLoading(state, action: PayloadAction<boolean>)
   setError(state, action: PayloadAction<string | null>)
   setSyncStatus(state, action: PayloadAction<SyncStatus>)

4. Create selectors in same file:
   
   selectAllTasks(state: RootState): Task[]
   selectTaskById(state: RootState, taskId: string): Task | undefined
   selectTasksByDate(state: RootState, date: string): Task[]
   selectTasksForSelectedDate(state: RootState): Task[]
   selectSelectedDate(state: RootState): string
   selectTasksLoading(state: RootState): boolean
   selectTasksError(state: RootState): string | null

5. Export actions and reducer

6. Add taskReducer to store

7. Write tests in src/features/tasks/__tests__/taskSlice.test.ts:
   - Test initial state
   - Test setTasks normalizes correctly
   - Test addTask adds to correct date
   - Test updateTask handles date changes
   - Test removeTask cleans up properly
   - Test selectors return correct data

Ensure: All reducer tests pass
```

---

### Step 2.2.2: Task Async Thunks

**Context:** Create async thunks for task operations that integrate with Firestore.

**Testing Focus:** Thunks dispatch correct actions and call services.

```text
PROMPT 2.2.2 - Task Async Thunks

Add async thunks to src/features/tasks/taskSlice.ts:

1. Create async thunks using createAsyncThunk:

   fetchTasksByDate = createAsyncThunk(
     'tasks/fetchByDate',
     async ({ userId, date }: { userId: string; date: Date }, { rejectWithValue }) => {
       try {
         const tasks = await tasksService.getTasksByDate(userId, date);
         return tasks;
       } catch (error) {
         return rejectWithValue(error.message);
       }
     }
   )

   createTask = createAsyncThunk(
     'tasks/create',
     async ({ input, userId }: { input: CreateTaskInput; userId: string }, { rejectWithValue }) => {
       try {
         const task = await tasksService.createTask(input, userId);
         return task;
       } catch (error) {
         return rejectWithValue(error.message);
       }
     }
   )

   updateTaskAsync = createAsyncThunk(
     'tasks/update',
     async (input: UpdateTaskInput, { rejectWithValue }) => {
       try {
         const task = await tasksService.updateTask(input);
         return task;
       } catch (error) {
         return rejectWithValue(error.message);
       }
     }
   )

   deleteTask = createAsyncThunk(
     'tasks/delete',
     async (taskId: string, { rejectWithValue }) => {
       try {
         await tasksService.softDeleteTask(taskId);
         return taskId;
       } catch (error) {
         return rejectWithValue(error.message);
       }
     }
   )

2. Add extraReducers to handle thunk states:

   builder
     .addCase(fetchTasksByDate.pending, (state) => {
       state.loading = true;
       state.error = null;
     })
     .addCase(fetchTasksByDate.fulfilled, (state, action) => {
       state.loading = false;
       // Normalize and add tasks
     })
     .addCase(fetchTasksByDate.rejected, (state, action) => {
       state.loading = false;
       state.error = action.payload as string;
     })
     // Similar for create, update, delete

3. Export thunks

4. Write tests in src/features/tasks/__tests__/taskThunks.test.ts:
   - Mock tasksService
   - Test fetchTasksByDate dispatches pending/fulfilled
   - Test fetchTasksByDate dispatches rejected on error
   - Test createTask calls service and returns task
   - Test updateTaskAsync updates state
   - Test deleteTask removes from state

Use Redux mock store or actual store for testing.

Ensure: All thunk tests pass
```

---

### Step 2.3.1: Category Slice

**Context:** Create Redux slice for category management.

**Testing Focus:** Category CRUD operations work correctly.

```text
PROMPT 2.3.1 - Category Slice

Create category slice in src/features/categories/categorySlice.ts:

1. Define CategoriesState interface:
   - categories: Record<string, Category>
   - categoryIds: string[] (for ordering)
   - loading: boolean
   - error: string | null

2. Create categorySlice with:

   Reducers:
   - setCategories(state, action: PayloadAction<Category[]>)
   - addCategory(state, action: PayloadAction<Category>)
   - updateCategory(state, action: PayloadAction<Category>)
   - removeCategory(state, action: PayloadAction<string>)
   - reorderCategories(state, action: PayloadAction<string[]>)
   - setLoading, setError

3. Create async thunks:
   - fetchCategories
   - createCategory
   - updateCategoryAsync
   - deleteCategory

4. Create selectors:
   - selectAllCategories: Category[]
   - selectCategoryById: Category | undefined
   - selectCategoryByName: Category | undefined
   - selectCategoriesLoading: boolean

5. Create src/services/firebase/categories.service.ts:
   - createCategory
   - getCategories (by userId)
   - updateCategory
   - deleteCategory

6. Add categoryReducer to store

7. Write comprehensive tests:
   - Test all reducers
   - Test all thunks
   - Test selectors
   - Test service layer

8. Create src/features/categories/index.ts:
   - Export slice, actions, thunks, selectors

Ensure: All category tests pass
```

---

## PHASE 3: Core Task Features

---

### Step 3.1.1: Task List Component - Basic Rendering

**Context:** Create the main task list component that displays tasks grouped by priority.

**Testing Focus:** Component renders tasks correctly grouped by priority.

```text
PROMPT 3.1.1 - Task List Component

Create task list component in src/components/tasks/TaskList.tsx:

1. Create TaskList component:
   
   Props interface:
   - tasks: Task[]
   - onTaskClick?: (task: Task) => void
   - onStatusChange?: (taskId: string, status: TaskStatus) => void
   
   Implementation:
   - Group tasks by priority letter (A, B, C, D)
   - Render each priority group with header
   - Within each group, sort by priority number
   - Use TaskItem component for each task (create below)
   - Show empty state if no tasks

2. Create TaskPriorityGroup component:
   
   Props:
   - priorityLetter: 'A' | 'B' | 'C' | 'D'
   - tasks: Task[]
   - onTaskClick, onStatusChange
   
   Implementation:
   - Display priority header with color coding:
     - A: Red (#EF4444)
     - B: Orange (#F97316)
     - C: Yellow (#EAB308)
     - D: Gray (#9CA3AF)
   - Render TaskItem for each task
   - Collapsible section (optional enhancement)

3. Create TaskItem component:
   
   Props:
   - task: Task
   - onClick?: () => void
   - onStatusChange?: (status: TaskStatus) => void
   
   Implementation:
   - Display priority label (e.g., "A1")
   - Display status symbol (●, ➜, ✔, ✘, ◯)
   - Display task title
   - Display category color (left border or badge)
   - Show recurrence icon if task.recurrence exists
   - Apply completed styling if status is 'complete'
   - Handle click to select/edit task

4. Create src/components/tasks/index.ts:
   - Export TaskList, TaskItem, TaskPriorityGroup

5. Create helper function in src/utils/taskUtils.ts:
   - groupTasksByPriority(tasks: Task[]): Record<string, Task[]>
   - sortTasksByPriority(tasks: Task[]): Task[]
   - getStatusSymbol(status: TaskStatus): string
   - getPriorityColor(letter: string): string

6. Write tests:

   src/components/tasks/__tests__/TaskList.test.tsx:
   - Test renders empty state when no tasks
   - Test renders tasks grouped by priority
   - Test A priority tasks appear first
   - Test clicking task calls onTaskClick

   src/components/tasks/__tests__/TaskItem.test.tsx:
   - Test renders task title
   - Test renders correct status symbol
   - Test renders priority label
   - Test applies completed styling
   - Test shows recurrence icon when applicable

   src/utils/__tests__/taskUtils.test.ts:
   - Test groupTasksByPriority groups correctly
   - Test sortTasksByPriority orders correctly
   - Test getStatusSymbol returns correct symbol

Ensure: All component tests pass
```

---

### Step 3.1.2: Task List Integration with Redux

**Context:** Connect TaskList to Redux store and display real data.

**Testing Focus:** Component reads from store and dispatches actions.

```text
PROMPT 3.1.2 - Task List Redux Integration

Create connected task list in src/features/tasks/TaskListContainer.tsx:

1. Create TaskListContainer component:
   
   Implementation:
   - Use useAppSelector to get tasks for selected date
   - Use useAppSelector to get categories (for color display)
   - Use useAppDispatch for dispatching actions
   - Use useAuth to get current user
   
   - On mount, dispatch fetchTasksByDate if user exists
   - Pass tasks to TaskList component
   - Handle onTaskClick (store selected task, open modal/detail)
   - Handle onStatusChange (dispatch updateTaskAsync)
   - Show loading state while fetching
   - Show error state if fetch failed

2. Update TaskItem to show category color:
   - Accept categories prop or use selector
   - Look up category by task.categoryId
   - Apply category color to left border

3. Create useTasksByDate custom hook in src/features/tasks/hooks.ts:
   
   function useTasksByDate(date: string) {
     const dispatch = useAppDispatch();
     const { user } = useAuth();
     const tasks = useAppSelector(state => selectTasksByDate(state, date));
     const loading = useAppSelector(selectTasksLoading);
     const error = useAppSelector(selectTasksError);
     
     useEffect(() => {
       if (user) {
         dispatch(fetchTasksByDate({ userId: user.id, date: new Date(date) }));
       }
     }, [dispatch, user, date]);
     
     return { tasks, loading, error };
   }

4. Write integration tests:

   src/features/tasks/__tests__/TaskListContainer.test.tsx:
   - Test renders loading state initially
   - Test dispatches fetchTasksByDate on mount
   - Test renders tasks from store
   - Test status change dispatches update
   - Test shows error message on fetch failure

5. Create mock data for testing in src/test/mockData.ts:
   - createMockTask(overrides?: Partial<Task>): Task
   - createMockCategory(overrides?: Partial<Category>): Category
   - createMockUser(overrides?: Partial<User>): User

Ensure: Integration tests pass with mocked store
```

---

### Step 3.2.1: Task Creation Form

**Context:** Create a form component for adding new tasks.

**Testing Focus:** Form validates input and submits correctly.

```text
PROMPT 3.2.1 - Task Creation Form

Create task form in src/components/tasks/TaskForm.tsx:

1. Define TaskFormProps:
   - onSubmit: (input: CreateTaskInput) => void
   - onCancel: () => void
   - initialValues?: Partial<CreateTaskInput>
   - isEditing?: boolean

2. Create TaskForm component:
   
   Form fields:
   - Title (required, text input)
   - Description (optional, textarea)
   - Priority (required, text input: "A1", "B2", etc. - letter required, number auto-assigned if omitted)
   - Category (optional, select from categories)
   - Scheduled Date (date picker, defaults to currently selected date)
   
   Implementation:
   - Use React Hook Form or controlled inputs
   - Validate title is not empty
   - Default priority letter to user's preference or 'B'
   - Show validation errors inline
   - Submit button disabled while invalid
   - Cancel button to close form

3. Create reusable form components:

   src/components/common/Input.tsx:
   - Label, input, error message
   - Props: label, error, type, ...inputProps
   
   src/components/common/Select.tsx:
   - Label, select, error message
   - Props: label, options, error, ...selectProps
   
   src/components/common/TextArea.tsx:
   - Label, textarea, error message

   src/components/common/DatePicker.tsx:
   - Simple date input (can enhance later)
   
   src/components/common/TimePicker.tsx:
   - Simple time input

4. Write tests:

   src/components/tasks/__tests__/TaskForm.test.tsx:
   - Test renders all form fields
   - Test title is required (shows error when empty)
   - Test submits with valid data
   - Test calls onCancel when cancelled
   - Test populates initialValues when editing
   - Test priority letter defaults correctly

   src/components/common/__tests__/Input.test.tsx:
   - Test renders label
   - Test displays error message
   - Test passes props to input

Ensure: Form validation and submission tests pass
```

---

### Step 3.2.2: Task Creation Modal and Integration

**Context:** Create modal for task creation and wire up to Redux.

**Testing Focus:** Modal opens, form submits, and task appears in list.

```text
PROMPT 3.2.2 - Task Creation Modal

Create task creation modal and integrate with app:

1. Create src/components/common/Modal.tsx:
   
   Props:
   - isOpen: boolean
   - onClose: () => void
   - title: string
   - children: ReactNode
   - size?: 'sm' | 'md' | 'lg'
   
   Implementation:
   - Overlay with backdrop
   - Centered modal card
   - Close button (X) in header
   - Close on backdrop click
   - Close on Escape key
   - Prevent body scroll when open
   - Animate in/out (optional)

2. Create src/features/tasks/CreateTaskModal.tsx:
   
   Props:
   - isOpen: boolean
   - onClose: () => void
   
   Implementation:
   - Use Modal component
   - Render TaskForm inside
   - On submit:
     - Dispatch createTask thunk
     - On success, close modal
     - On error, show error in form
   - Pass selected date as scheduledDate default

3. Create src/features/tasks/TasksPage.tsx:
   
   Main page component that:
   - Renders TaskListContainer
   - Has "Add Task" button
   - Manages CreateTaskModal open state
   - Shows modal when button clicked

4. Update App.tsx routing:
   - Add react-router setup
   - Route "/" to TasksPage (when authenticated)
   - Route "/login" to LoginPage

5. Add "Add Task" floating action button:
   
   Create src/components/common/FloatingActionButton.tsx:
   - Fixed position bottom-right
   - Round button with + icon
   - onClick handler

6. Write tests:

   src/components/common/__tests__/Modal.test.tsx:
   - Test renders when isOpen true
   - Test doesn't render when isOpen false
   - Test calls onClose on backdrop click
   - Test calls onClose on Escape key
   - Test renders title and children

   src/features/tasks/__tests__/CreateTaskModal.test.tsx:
   - Test renders TaskForm when open
   - Test dispatches createTask on submit
   - Test closes on successful creation
   - Test shows error on failure

   src/features/tasks/__tests__/TasksPage.test.tsx:
   - Test renders task list
   - Test renders add button
   - Test opens modal on button click

Ensure: Full flow works - open modal, fill form, submit, see task in list
```

---

### Step 3.3.1: Task Editing

**Context:** Add ability to edit existing tasks.

**Testing Focus:** Edit form populates correctly and updates save.

```text
PROMPT 3.3.1 - Task Editing

Add task editing functionality:

1. Create src/features/tasks/EditTaskModal.tsx:
   
   Props:
   - isOpen: boolean
   - onClose: () => void
   - task: Task | null
   
   Implementation:
   - Use Modal component
   - Render TaskForm with initialValues from task
   - Pass isEditing={true} to form
   - On submit:
     - Dispatch updateTaskAsync thunk
     - On success, close modal
   - Add delete button (opens confirmation)

2. Update TaskForm for editing mode:
   - Change submit button text: "Create Task" vs "Save Changes"
   - Show additional fields when editing:
     - Status (dropdown)
     - Created date (read-only)
   - Handle all fields being pre-populated

3. Create src/components/common/ConfirmDialog.tsx:
   
   Props:
   - isOpen: boolean
   - onConfirm: () => void
   - onCancel: () => void
   - title: string
   - message: string
   - confirmText?: string
   - confirmVariant?: 'primary' | 'danger'
   
   Implementation:
   - Small modal with message
   - Cancel and Confirm buttons
   - Danger variant for destructive actions

4. Update TasksPage:
   - Add selectedTask state
   - When task clicked, set selectedTask and open EditTaskModal
   - On modal close, clear selectedTask

5. Add task selection to TaskItem:
   - On click, call onTaskClick prop with task

6. Write tests:

   src/features/tasks/__tests__/EditTaskModal.test.tsx:
   - Test form populated with task data
   - Test dispatches updateTaskAsync on submit
   - Test delete button opens confirmation
   - Test confirming delete dispatches deleteTask

   src/components/common/__tests__/ConfirmDialog.test.tsx:
   - Test renders message
   - Test calls onConfirm when confirmed
   - Test calls onCancel when cancelled

Ensure: Edit flow works end-to-end
```

---

### Step 3.4.1: Priority System - Auto-numbering

**Context:** Implement automatic priority number assignment and reordering.

**Testing Focus:** Numbers assigned correctly and reorder works.

```text
PROMPT 3.4.1 - Priority Auto-numbering

Implement priority number auto-assignment:

1. Create src/utils/priorityUtils.ts:

   function getNextPriorityNumber(
     tasks: Task[],
     priorityLetter: string
   ): number
   - Filter tasks by priority letter
   - Find highest existing number
   - Return next number (or 1 if none exist)

   function reorderTasksInPriority(
     tasks: Task[],
     priorityLetter: string
   ): Task[]
   - Filter tasks by priority letter
   - Sort by current priority number
   - Reassign numbers sequentially (1, 2, 3...)
   - Return updated tasks

   function reorderAllTasks(tasks: Task[]): Task[]
   - Group by priority letter
   - Reorder each group
   - Return all updated tasks

2. Update createTask thunk:
   - Before creating, calculate next priority number
   - Include in CreateTaskInput

3. Add reorderTasks thunk to taskSlice:

   reorderTasks = createAsyncThunk(
     'tasks/reorder',
     async (tasks: Task[], { rejectWithValue }) => {
       // Batch update all tasks with new priority numbers
     }
   )

4. Add "Reorder All" button to TasksPage:
   - Dispatches reorderTasks for all tasks on selected date
   - Renumbers A1, A2... B1, B2... etc.

5. Update Firestore batch update in tasks.service.ts:
   
   async function batchUpdateTasks(tasks: UpdateTaskInput[]): Promise<void>
   - Use Firestore batch or transaction
   - Update multiple documents atomically

6. Write tests:

   src/utils/__tests__/priorityUtils.test.ts:
   - Test getNextPriorityNumber returns 1 for empty
   - Test getNextPriorityNumber returns next number
   - Test reorderTasksInPriority fills gaps
   - Test reorderAllTasks handles multiple priorities

   Integration test:
   - Create tasks with gaps (A1, A3, A5)
   - Click reorder
   - Verify tasks are now A1, A2, A3

Ensure: Auto-numbering works correctly
```

---

### Step 3.5.1: Status Symbols - Click to Change

**Context:** Make status symbols interactive for quick status changes.

**Testing Focus:** Clicking symbol cycles through statuses.

```text
PROMPT 3.5.1 - Interactive Status Symbols

Make status symbols clickable:

1. Create src/components/tasks/StatusSymbol.tsx:
   
   Props:
   - status: TaskStatus
   - onClick?: () => void
   - size?: 'sm' | 'md' | 'lg'
   
   Implementation:
   - Render appropriate symbol based on status
   - Apply color coding:
     - in_progress: blue
     - forward: orange
     - complete: green
     - delete: red
     - delegate: purple
   - Show tooltip with status name on hover
   - Clickable if onClick provided
   - Cursor pointer when clickable

2. Create status cycling logic in src/utils/statusUtils.ts:

   const STATUS_ORDER: TaskStatus[] = [
     'in_progress', 'forward', 'complete', 'delete', 'delegate'
   ];

   function getNextStatus(current: TaskStatus): TaskStatus
   - Find current index
   - Return next in cycle (wrap around)

   function getStatusLabel(status: TaskStatus): string
   - Return human-readable label

   function getStatusColor(status: TaskStatus): string
   - Return Tailwind color class

3. Update TaskItem component:
   - Replace static symbol with StatusSymbol component
   - On click, call onStatusChange with next status
   - Prevent event propagation (don't open edit modal)

4. Create src/components/common/Tooltip.tsx:
   - Simple tooltip component
   - Shows on hover
   - Configurable position (top, bottom, left, right)

5. Write tests:

   src/components/tasks/__tests__/StatusSymbol.test.tsx:
   - Test renders correct symbol for each status
   - Test applies correct color
   - Test calls onClick when clicked
   - Test shows tooltip on hover

   src/utils/__tests__/statusUtils.test.ts:
   - Test getNextStatus cycles correctly
   - Test wraps from delegate back to in_progress
   - Test getStatusLabel returns correct labels

   Integration:
   - Render task with in_progress status
   - Click status symbol
   - Verify status changes to forward
   - Verify UI updates

Ensure: Status cycling works smoothly
```

---

### Step 3.6.1: Drag and Drop - Setup

**Context:** Add drag and drop for reordering tasks within same priority.

**Testing Focus:** Items can be dragged and dropped, order updates.

```text
PROMPT 3.6.1 - Drag and Drop Setup

Implement drag and drop for task reordering:

1. Install dependency:
   - @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

2. Create src/components/tasks/DraggableTaskList.tsx:
   
   Wrap TaskList with DnD context:
   - Use DndContext from @dnd-kit/core
   - Use SortableContext for each priority group
   - Handle onDragEnd to reorder

3. Create src/components/tasks/SortableTaskItem.tsx:
   
   Wrap TaskItem to be sortable:
   - Use useSortable hook
   - Apply transform and transition styles
   - Add drag handle (always visible per spec)
   - Prevent drag if different priority letter

4. Create drag handle component:
   
   src/components/common/DragHandle.tsx:
   - Six dots icon (⋮⋮)
   - Cursor grab/grabbing
   - Always visible (per spec requirement)

5. Update TaskPriorityGroup:
   - Wrap tasks in SortableContext
   - Use verticalListSortingStrategy
   - Pass unique IDs

6. Handle reorder on drop:
   
   In DraggableTaskList:
   - onDragEnd: get old and new index
   - Verify same priority group
   - Calculate new order
   - Dispatch action to update task order
   - Update priority numbers accordingly

7. Add reorder action to taskSlice:
   
   reorderTaskLocal(state, action: PayloadAction<{
     taskId: string;
     oldIndex: number;
     newIndex: number;
     priorityLetter: string;
   }>)
   - Reorder tasks in local state
   - Optimistic update

8. Write tests:

   src/components/tasks/__tests__/DraggableTaskList.test.tsx:
   - Test drag handle is visible
   - Test dragging item triggers onDragEnd
   - Test items reorder visually

   Note: DnD testing can be complex; focus on:
   - Unit testing reorder logic
   - Integration testing with mocked DnD events

Ensure: Basic drag and drop works within priority groups
```

---

### Step 3.6.2: Drag and Drop - Persist and Polish

**Context:** Persist drag and drop changes to Firestore and add visual polish.

**Testing Focus:** Reorder persists and visual feedback works.

```text
PROMPT 3.6.2 - Drag and Drop Persistence

Complete drag and drop implementation:

1. Create reorder thunk that persists changes:

   reorderTasksAsync = createAsyncThunk(
     'tasks/reorderAsync',
     async ({
       tasksToUpdate,
       priorityLetter
     }: {
       tasksToUpdate: { id: string; priorityNumber: number }[];
       priorityLetter: string;
     }) => {
       await tasksService.batchUpdatePriorityNumbers(tasksToUpdate);
       return { tasksToUpdate, priorityLetter };
     }
   )

2. Update onDragEnd handler:
   - Calculate new priority numbers for affected tasks
   - Dispatch optimistic local update
   - Dispatch async persist
   - Handle error (revert optimistic update)

3. Add visual feedback during drag:
   
   Update SortableTaskItem:
   - Apply scale transform when dragging
   - Show drop indicator line
   - Dim other items slightly
   - Add smooth transition

4. Create drag overlay for better UX:
   
   Use DragOverlay from @dnd-kit:
   - Show preview of dragged item
   - Style differently (shadow, slight rotation)
   - Follows cursor smoothly

5. Prevent cross-priority dragging:
   - In onDragEnd, verify source and destination have same priority
   - If different, cancel drop (no-op)
   - Show visual indicator that drop is not allowed

6. Add animation on reorder:
   - Use CSS transitions for smooth movement
   - Items slide into new positions

7. Write tests:

   src/features/tasks/__tests__/reorderPersist.test.ts:
   - Test reorderTasksAsync calls batch update
   - Test optimistic update applied immediately
   - Test error reverts optimistic update

   Visual tests (manual or snapshot):
   - Drag preview looks correct
   - Drop indicator visible
   - Smooth animations

Ensure: Drag, drop, and persist all work together
```

---

## PHASE 4: Date Navigation & Daily View

---

### Step 4.1.1: Date Navigation Component

**Context:** Create date navigation with previous/next and today button.

**Testing Focus:** Navigation changes selected date correctly.

```text
PROMPT 4.1.1 - Date Navigation Component

Create date navigation in src/components/common/DateNavigation.tsx:

1. Define DateNavigationProps:
   - selectedDate: string (ISO date string)
   - onDateChange: (date: string) => void

2. Create DateNavigation component:
   
   Display:
   - Left arrow button (previous day)
   - Current date formatted: "Saturday, January 24, 2026"
   - Right arrow button (next day)
   - "Today" button

   Implementation:
   - Use date-fns for date manipulation and formatting
   - Previous button: subtract 1 day
   - Next button: add 1 day
   - Today button: set to current date
   - Disable "Today" if already on today
   - Keyboard shortcuts (optional):
     - Left arrow: previous day
     - Right arrow: next day
     - T: today

3. Install date-fns:
   - npm install date-fns

4. Create date utilities in src/utils/dateUtils.ts:

   function formatDisplayDate(date: Date | string): string
   - Returns "Saturday, January 24, 2026"

   function addDays(date: Date | string, days: number): string
   - Returns ISO date string

   function isToday(date: Date | string): boolean
   
   function parseISODate(dateString: string): Date

   function toISODateString(date: Date): string
   - Returns "YYYY-MM-DD"

5. Connect to Redux:
   
   Create src/features/tasks/DateNavigationContainer.tsx:
   - Use useAppSelector to get selectedDate
   - Use useAppDispatch to dispatch setSelectedDate
   - Render DateNavigation with connected props

6. Write tests:

   src/components/common/__tests__/DateNavigation.test.tsx:
   - Test displays formatted date
   - Test previous button calls onDateChange with previous day
   - Test next button calls onDateChange with next day
   - Test today button calls onDateChange with today
   - Test today button disabled when on today

   src/utils/__tests__/dateUtils.test.ts:
   - Test formatDisplayDate formats correctly
   - Test addDays adds/subtracts days
   - Test isToday returns correct boolean
   - Test toISODateString formats correctly

Ensure: Date navigation works correctly
```

---

### Step 4.2.1: Daily View Layout

**Context:** Create the main daily view layout with header and content area.

**Testing Focus:** Layout renders correctly with all sections.

```text
PROMPT 4.2.1 - Daily View Layout

Create daily view layout in src/features/tasks/DailyView.tsx:

1. Create DailyView component:
   
   Layout structure:
   ┌─────────────────────────────────────────┐
   │  Header (App title, user menu)          │
   ├─────────────────────────────────────────┤
   │  Date Navigation                        │
   ├─────────────────────────────────────────┤
   │  Tab Bar (Tasks | Calendar | Notes)     │
   ├─────────────────────────────────────────┤
   │                                         │
   │  Tab Content Area                       │
   │                                         │
   ├─────────────────────────────────────────┤
   │  Footer Actions (Reorder All, etc.)    │
   └─────────────────────────────────────────┘

2. Create src/components/layout/Header.tsx:
   - App logo/title: "Neill Planner"
   - Hamburger menu button (for navigation)
   - User avatar/menu (dropdown with settings, logout)

3. Create src/components/layout/UserMenu.tsx:
   - Dropdown menu component
   - Shows user name/email
   - Settings link
   - Sign out button

4. Create main layout wrapper:
   
   src/components/layout/AppLayout.tsx:
   - Header at top
   - Main content area (children)
   - Optional sidebar for desktop
   - Responsive design

5. Update TasksPage to use DailyView:
   - Wrap content in AppLayout
   - Render DailyView inside

6. Add Tailwind responsive utilities:
   - Mobile-first design
   - Desktop shows more content side-by-side

7. Write tests:

   src/features/tasks/__tests__/DailyView.test.tsx:
   - Test renders header
   - Test renders date navigation
   - Test renders tab bar
   - Test renders content area

   src/components/layout/__tests__/Header.test.tsx:
   - Test renders app title
   - Test renders user menu
   - Test hamburger menu clickable

   src/components/layout/__tests__/AppLayout.test.tsx:
   - Test renders children
   - Test responsive layout

Ensure: Layout looks correct on mobile and desktop
```

---

### Step 4.3.1: Tab System

**Context:** Create tab navigation for Tasks, Calendar, and Notes views.

**Testing Focus:** Tabs switch content correctly.

```text
PROMPT 4.3.1 - Tab System

Create tab system in src/components/common/Tabs.tsx:

1. Define Tab types:
   
   interface Tab {
     id: string;
     label: string;
     icon?: ReactNode;
   }

   interface TabsProps {
     tabs: Tab[];
     activeTab: string;
     onTabChange: (tabId: string) => void;
   }

2. Create Tabs component:
   - Horizontal tab bar
   - Active tab highlighted
   - Click to switch tabs
   - Accessible (keyboard navigation, ARIA)

3. Create TabPanel component:
   
   interface TabPanelProps {
     id: string;
     activeTab: string;
     children: ReactNode;
   }
   
   - Only renders children when active
   - ARIA attributes for accessibility

4. Define daily view tabs constant:
   
   const DAILY_VIEW_TABS: Tab[] = [
     { id: 'tasks', label: 'Tasks', icon: <CheckIcon /> },
     { id: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
     { id: 'notes', label: 'Notes', icon: <NoteIcon /> },
   ];

5. Update DailyView to use tabs:
   - State for activeTab (default 'tasks')
   - Render Tabs component
   - Render TabPanel for each tab
   - Tasks tab: TaskListContainer
   - Calendar tab: placeholder "Calendar coming soon"
   - Notes tab: placeholder "Notes coming soon"

6. Create simple icon components or use a library:
   
   src/components/icons/index.tsx:
   - CheckIcon
   - CalendarIcon
   - NoteIcon
   - Use heroicons or simple SVGs

7. Write tests:

   src/components/common/__tests__/Tabs.test.tsx:
   - Test renders all tab labels
   - Test active tab has active styling
   - Test clicking tab calls onTabChange
   - Test keyboard navigation (arrow keys, Enter)
   - Test ARIA attributes

   src/components/common/__tests__/TabPanel.test.tsx:
   - Test renders children when active
   - Test doesn't render children when inactive

   Integration in DailyView:
   - Test switching tabs shows correct content

Ensure: Tab system is accessible and functional
```

---

## Continue with remaining phases...

Due to the extensive nature of this document, I'll continue with summarized prompts for the remaining phases. Each follows the same pattern of small, testable increments.

---

## PHASE 5: Categories & Colors

### Step 5.1.1: Category List Component
```text
PROMPT 5.1.1 - Category List Component

Create category management UI:

1. Create CategoryList component showing all user categories
2. Each item shows color swatch, name, edit/delete buttons
3. "Add Category" button at bottom
4. Connect to Redux, fetch categories on mount

Tests:
- Renders list of categories
- Shows correct colors
- Add button opens form
```

### Step 5.1.2: Category Form
```text
PROMPT 5.1.2 - Category Form

Create form for adding/editing categories:

1. Name input (required, max 50 chars)
2. Color picker (8 preset colors + custom)
3. Create/Update/Cancel buttons
4. Validation for unique names

Tests:
- Form validation works
- Color picker selects colors
- Submit creates/updates category
```

### Step 5.2.1: Color Picker Component
```text
PROMPT 5.2.1 - Color Picker Component

Create reusable color picker:

1. Grid of preset colors
2. Custom color input (hex)
3. Preview of selected color
4. Accessible (keyboard navigation)

Tests:
- Preset colors selectable
- Custom color input works
- Preview updates
```

### Step 5.3.1: Category Assignment in Task Form
```text
PROMPT 5.3.1 - Category Assignment

Update TaskForm to include category selection:

1. Dropdown of user's categories
2. Color preview next to selection
3. "Uncategorized" as default option
4. Update TaskItem to show category color

Tests:
- Dropdown shows categories
- Selection saves with task
- Color displays on task item
```

---

## PHASE 6: Recurring Tasks

### Step 6.1.1: Recurrence Pattern Form
```text
PROMPT 6.1.1 - Recurrence Pattern Form

Create recurrence pattern configuration:

1. RecurrenceForm component
2. Type selector (daily, weekly, monthly, yearly, custom)
3. Interval input ("Every X days/weeks/months")
4. Days of week checkboxes (for weekly)
5. End condition (never, date, occurrences)

Tests:
- All recurrence types configurable
- Validation for each type
- End condition options work
```

### Step 6.1.2: Integrate Recurrence with Task Form
```text
PROMPT 6.1.2 - Recurrence in Task Form

Add recurrence to task creation/editing:

1. "Repeat" toggle in TaskForm
2. When enabled, show RecurrenceForm
3. Save recurrence pattern with task
4. Show recurrence icon on recurring tasks

Tests:
- Toggle shows/hides form
- Pattern saved correctly
- Icon displayed
```

### Step 6.2.1: Instance Generation Logic
```text
PROMPT 6.2.1 - Recurring Instance Generation

Create logic to generate recurring instances:

1. generateRecurringInstances(task, startDate, endDate): Task[]
2. Handle daily, weekly, monthly, yearly patterns
3. Respect end conditions
4. Handle exceptions

Tests:
- Daily generates correct dates
- Weekly handles day selection
- Monthly handles edge cases (31st)
- End conditions respected
```

### Step 6.2.2: Display Recurring Instances
```text
PROMPT 6.2.2 - Display Recurring Instances

Show recurring task instances in daily view:

1. Fetch parent recurring tasks
2. Generate instances for visible date range
3. Display instances like regular tasks
4. Show (↻) indicator

Tests:
- Instances appear on correct dates
- Indicator visible
- Instance linked to parent
```

### Step 6.3.1: Edit This Instance vs All Future
```text
PROMPT 6.3.1 - Edit Recurring Options

Handle editing recurring tasks:

1. When editing recurring task, show dialog:
   "Edit this occurrence only" / "Edit all future occurrences"
2. "This only": create exception, store modification
3. "All future": update pattern, regenerate

Tests:
- Dialog appears for recurring
- This only creates exception
- All future updates pattern
```

### Step 6.3.2: Delete Recurring Options
```text
PROMPT 6.3.2 - Delete Recurring Options

Handle deleting recurring tasks:

1. Show dialog: "Delete this occurrence" / "Delete all future"
2. "This only": add to exceptions
3. "All future": set end date to today

Tests:
- Dialog appears
- This only adds exception
- All future ends series
```

---

## PHASE 7: Events & Calendar

### Step 7.1.1: Event Type Definitions and Service
```text
PROMPT 7.1.1 - Event Service Layer

Create event data layer:

1. Event service (CRUD operations)
2. Event Redux slice
3. Event async thunks
4. Firestore integration

Tests:
- Create event works
- Fetch events by date range
- Update and delete work
```

### Step 7.2.1: Event Form
```text
PROMPT 7.2.1 - Event Form

Create event creation/edit form:

1. Title, description
2. Start time, end time (with pickers)
3. Location
4. Category
5. Confidential toggle (with alternate title)
6. Recurrence (reuse RecurrenceForm)

Tests:
- All fields work
- Time validation (end > start)
- Confidential shows alternate title field
```

### Step 7.3.1: Calendar Time-Block View
```text
PROMPT 7.3.1 - Calendar Time-Block View

Create hourly calendar view:

1. Vertical time slots (24 hours or business hours)
2. Events rendered as blocks
3. Block height based on duration
4. Overlapping events side-by-side
5. Click empty slot to create event

Tests:
- Time slots render
- Events positioned correctly
- Overlap handled
- Click creates event
```

### Step 7.4.1: Week View
```text
PROMPT 7.4.1 - Week View

Create week view accessible from menu:

1. 7-day grid (Sun-Sat)
2. Events shown with times
3. Navigate between weeks
4. Click day to go to daily view

Tests:
- 7 days displayed
- Events on correct days
- Navigation works
```

### Step 7.4.2: Month View
```text
PROMPT 7.4.2 - Month View

Create month view accessible from menu:

1. Calendar grid
2. Events with day/time/name
3. Navigate between months
4. Click day for daily view

Tests:
- Calendar grid correct
- Events displayed
- Navigation works
```

---

## PHASE 8: Notes System

### Step 8.1.1: Note Service and Redux
```text
PROMPT 8.1.1 - Note Service Layer

Create note data layer:

1. Note service (CRUD)
2. Note Redux slice
3. Fetch notes by date

Tests:
- CRUD operations work
- Date filtering works
```

### Step 8.2.1: Notes Tab Implementation
```text
PROMPT 8.2.1 - Notes Tab

Implement notes in daily view:

1. List of notes for selected date
2. Click to edit
3. Add note button

Tests:
- Notes displayed for date
- Click opens editor
- Add creates new note
```

### Step 8.3.1: Rich Text Editor
```text
PROMPT 8.3.1 - Rich Text Editor

Add simple rich text editing:

1. Use TipTap or similar
2. Bold, italic, bullet lists
3. Keyboard shortcuts
4. Autosave

Tests:
- Formatting works
- Shortcuts work
- Content saves
```

### Step 8.4.1: Task/Event Linking
```text
PROMPT 8.4.1 - Note Linking

Link notes to tasks/events:

1. "Link to" button in note editor
2. Select tasks or events
3. Show link indicator
4. Click link to navigate

Tests:
- Link selection works
- Links saved
- Navigation works
```

---

## PHASE 9: Google Calendar Integration

### Step 9.1.1: Google OAuth Setup
```text
PROMPT 9.1.1 - Google Calendar OAuth

Set up Google Calendar API access:

1. Configure Google Cloud project
2. Add OAuth scopes for Calendar
3. Implement authorization flow
4. Store tokens securely

Tests:
- OAuth flow completes
- Tokens stored
- Refresh works
```

### Step 9.2.1: Sync Events to Google
```text
PROMPT 9.2.1 - Sync to Google Calendar

Push events to Google Calendar:

1. On event create, create in Google
2. On update, update in Google
3. On delete, delete in Google
4. Store Google event ID

Tests:
- Create syncs
- Update syncs
- Delete syncs
```

### Step 9.2.2: Sync Events from Google
```text
PROMPT 9.2.2 - Sync from Google Calendar

Pull events from Google Calendar:

1. Fetch Google events
2. Create/update local events
3. Handle conflicts
4. Background sync every 5 min

Tests:
- Import works
- Updates detected
- Conflicts handled
```

### Step 9.3.1: Confidential Events
```text
PROMPT 9.3.1 - Confidential Event Sync

Handle confidential events:

1. When syncing confidential event
2. Use alternateTitle for Google
3. Keep real title local only

Tests:
- Alternate title sent to Google
- Real title stays local
```

---

## PHASE 10: Reminders & Notifications

### Step 10.1.1: Reminder Data Model
```text
PROMPT 10.1.1 - Reminder Model

Add reminders to tasks/events:

1. Reminder interface (time, type)
2. Multiple reminders per item
3. Store with task/event

Tests:
- Reminders stored
- Multiple allowed
```

### Step 10.2.1: Push Notification Setup
```text
PROMPT 10.2.1 - Push Notifications

Set up Firebase Cloud Messaging:

1. Configure FCM
2. Request permission
3. Store device token
4. Cloud function for sending

Tests:
- Permission requested
- Token stored
- Notification received
```

### Step 10.3.1: Snooze Functionality
```text
PROMPT 10.3.1 - Snooze

Add snooze to notifications:

1. Snooze options (5, 15, 30, 60 min)
2. Reschedule reminder
3. In-app notification banner

Tests:
- Snooze options work
- Reminder rescheduled
```

---

## PHASE 11: Offline Support & Sync

### Step 11.1.1: IndexedDB Setup
```text
PROMPT 11.1.1 - IndexedDB Setup

Set up local storage:

1. Configure Dexie or idb
2. Create tables mirroring Firestore
3. Sync data to local on fetch

Tests:
- Data stored locally
- Queries work offline
```

### Step 11.2.1: Sync Queue
```text
PROMPT 11.2.1 - Sync Queue

Queue offline changes:

1. Intercept mutations when offline
2. Queue changes with timestamps
3. Replay on reconnect

Tests:
- Changes queued offline
- Replayed on connect
```

### Step 11.3.1: Conflict Resolution
```text
PROMPT 11.3.1 - Conflict Resolution

Handle sync conflicts:

1. Detect conflicts (timestamp comparison)
2. Show conflict UI
3. User chooses resolution

Tests:
- Conflicts detected
- UI shows options
- Resolution applied
```

---

## PHASE 12: Search, Filters & Polish

### Step 12.1.1: Unified Search
```text
PROMPT 12.1.1 - Unified Search

Implement search functionality:

1. Search bar in header
2. Search tasks, events, notes
3. Highlight matches
4. Show results grouped by type

Tests:
- Search returns results
- Partial matches work
- Results grouped
```

### Step 12.2.1: Filter System
```text
PROMPT 12.2.1 - Filters

Add filter controls:

1. Filter by status
2. Filter by category
3. Filter by priority
4. Filters combine

Tests:
- Each filter works
- Combinations work
- Reset clears filters
```

### Step 12.3.1: Settings Page
```text
PROMPT 12.3.1 - Settings

Create settings page:

1. Theme (light/dark/system)
2. Font size
3. Default priority
4. Timezone
5. Notification preferences

Tests:
- Settings save
- Theme applies
- Preferences respected
```

### Step 12.4.1: Final Integration Testing
```text
PROMPT 12.4.1 - Integration Testing

Comprehensive end-to-end tests:

1. Full user flow: login → create task → edit → complete
2. Recurring task lifecycle
3. Event creation and Google sync
4. Offline/online transition
5. Search and filter

Tests:
- E2E tests pass
- Performance acceptable
- No console errors
```

### Step 12.4.2: Deployment Setup
```text
PROMPT 12.4.2 - Deployment

Set up deployment pipeline:

1. Configure Vercel/Netlify/Firebase Hosting
2. Environment variables for production
3. CI/CD with GitHub Actions
4. Run tests before deploy

Tests:
- Build succeeds
- Deploy works
- Production app functional
```

---

## Summary

This blueprint provides **47 incremental prompts** across 12 phases, each designed to:

1. **Build on previous work** - No orphaned code
2. **Include tests** - TDD approach throughout
3. **Be right-sized** - Small enough to test safely, large enough to make progress
4. **Wire things together** - Each step integrates with existing code

### Recommended Order

1. Complete Phase 1 (Foundation) entirely first
2. Complete Phase 2 (Data Layer) before UI work
3. Phases 3-4 give you a working task manager
4. Phases 5-6 add power features
5. Phases 7-8 complete the daily planner
6. Phases 9-11 are advanced features
7. Phase 12 is polish and deployment

### Time Estimates

- **Phase 1**: 1-2 days
- **Phase 2**: 1-2 days
- **Phase 3**: 2-3 days
- **Phase 4**: 1 day
- **Phase 5**: 1 day
- **Phase 6**: 2 days
- **Phase 7**: 2-3 days
- **Phase 8**: 1-2 days
- **Phase 9**: 2-3 days
- **Phase 10**: 1-2 days
- **Phase 11**: 2-3 days
- **Phase 12**: 2-3 days

**Total: 18-27 days** for a solo developer working full-time

---

## Appendix: Using These Prompts

When using these prompts with a code-generation LLM:

1. **Provide context**: Share relevant existing code before each prompt
2. **Review output**: Always review generated code before committing
3. **Run tests**: Ensure all tests pass before moving on
4. **Iterate**: If output isn't right, refine the prompt
5. **Document**: Add comments explaining key decisions

Good luck building Neill Planner!
