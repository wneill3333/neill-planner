# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This folder contains multiple independent projects:

- **AI-Neill/neill-planner/** - Main project: Franklin-Covey productivity app (React + TypeScript + Firebase)
- **solar-tracker/** - ESP32 solar tracking system (hardware project, design phase)
- **Productivity-App/** - PRD documentation only

## Neill Planner Commands

All commands run from `AI-Neill/neill-planner/`:

```bash
npm run dev          # Start development server (Vite)
npm run build        # TypeScript compile + Vite build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all src files
npm test             # Run Vitest in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with Vitest UI
npm run test:coverage # Run tests with coverage report
```

**Run a single test file:**
```bash
npm test -- src/components/tasks/__tests__/TaskItem.test.tsx
npm run test:run -- src/features/tasks/__tests__/taskSlice.test.ts
```

## Neill Planner Architecture

**Tech Stack:** React 19 + TypeScript + Redux Toolkit + Tailwind CSS + Firebase (Auth/Firestore) + Vitest

### State Management Pattern

- Redux store in `src/store/store.ts` with typed hooks (`useAppDispatch`, `useAppSelector`)
- Feature slices in `src/features/{feature}/` containing: slice, thunks, hooks, components
- Async operations use Redux Toolkit `createAsyncThunk`
- State is normalized: `tasks: Record<string, Task>` with `taskIdsByDate: Record<string, string[]>`

### Data Flow Pattern

1. **Components** dispatch thunks via `useAppDispatch`
2. **Thunks** (`taskThunks.ts`) call Firebase services and dispatch slice actions
3. **Services** (`services/firebase/*.service.ts`) handle Firestore operations with `userId` authorization
4. **Slices** update normalized state via reducers and extraReducers

### Container/Presentation Pattern

- **Container components** (e.g., `TaskListContainer.tsx`) connect to Redux, handle data fetching
- **Presentation components** (e.g., `TaskList.tsx`, `TaskItem.tsx`) receive props, render UI
- Callbacks flow: Container → List → PriorityGroup → Item

### Key Architectural Files

- `src/store/store.ts` - Redux store configuration with typed RootState/AppDispatch
- `src/features/tasks/taskSlice.ts` - Task state shape, reducers, selectors
- `src/features/tasks/taskThunks.ts` - Async operations (CRUD, batch updates)
- `src/services/firebase/tasks.service.ts` - Firestore operations with ownership verification
- `src/utils/taskUtils.ts` - Task grouping, sorting, priority formatting
- `src/utils/statusUtils.ts` - Status cycling, labels, colors

### Priority System

A-B-C-D priorities (A=Vital, B=Important, C=Optional, D=Delegate) with auto-numbering:
- **Input format**: Single text field where users type "A1", "B2", "C", etc.
  - Letter (A-D) required, auto-converts to uppercase
  - Number (1-99) optional - if omitted, auto-assigned by `getNextPriorityNumber()`
  - Validation in `TaskForm.tsx` via `parsePriority()` function
- `priorityUtils.ts` handles `getNextPriorityNumber()` and `reorderTasksInPriority()`
- Tasks are grouped by letter, sorted by number within groups

### Status Cycling

Status order: in_progress → complete → forward → delegate → delete → (loops)
- `StatusSymbol` component handles click-to-cycle and arrow key navigation
- `getNextStatus()` / `getPreviousStatus()` in statusUtils.ts

## Firebase Setup

Copy `.env.example` to `.env.local` and configure Firebase credentials. The app uses:
- Firebase Auth for authentication (Google sign-in)
- Firestore for data persistence
- Security rules in `firestore.rules` (ownership-based access)

All Firebase services require `userId` parameter for authorization checks.

## Development Workflow (Orchestrated Agent System)

For ALL development tasks, you act as the **Lead Engineer/Orchestrator**. You coordinate work by delegating to specialist agents using the **Task tool**.

### Available Specialist Agents

Use the Task tool with these exact `subagent_type` values:

| Agent | subagent_type | Use For |
|-------|---------------|---------|
| Frontend Engineer | `frontend-engineer` | React components, hooks, UI, state management, Tailwind CSS |
| Backend Engineer | `backend-engineer` | Firebase Functions, Firestore schemas, security rules, server logic |
| Test Engineer | `test-engineer` | Test validation, Jest/RTL tests, requirement verification |
| Code Reviewer | `code-reviewer` | Code quality review, optimization, architecture consistency |
| Archive Agent | `archive-agent` | Documentation updates, git commits, project_history.md |

### How to Delegate

```
Task tool:
  subagent_type: "frontend-engineer"
  description: "Brief 3-5 word summary"
  prompt: "Detailed instructions with file paths and requirements"
```

**Run multiple Task calls in parallel when subtasks are independent.**

### Mandatory Workflow for Implementation Tasks

**Step 1: Plan** (you do this)
- Read the task from todo.md
- Identify which agents are needed
- Break into subtasks

**Step 2: Implement** (delegate via Task tool)
- Use `subagent_type: "frontend-engineer"` for UI/React work
- Use `subagent_type: "backend-engineer"` for Firebase/server work
- Run in parallel when independent

**Step 3: Code Review** (MANDATORY - delegate via Task tool)
- Use `subagent_type: "code-reviewer"` after implementation
- Reviews for: optimization, refactoring, documentation, architecture
- Returns prioritized issues (Critical, High, Medium, Low)

**Step 4: Fix Issues** (delegate via Task tool if needed)
- If Critical/High issues found, delegate fixes to appropriate engineer
- Frontend issues → `frontend-engineer`
- Backend issues → `backend-engineer`

**Step 5: Test Validation** (MANDATORY - delegate via Task tool)
- Use `subagent_type: "test-engineer"` after fixes
- Validates all tests pass, coverage adequate, requirements met
- If failures: return to Step 4, then re-run Step 5

**Step 6: Archive** (MANDATORY - delegate via Task tool)
- Use `subagent_type: "archive-agent"` as final step
- Updates project_history.md, todo.md
- Commits and pushes to GitHub

### Completion Criteria

A task is ONLY complete when:
- [ ] Code implemented by appropriate engineer(s)
- [ ] Code Reviewer has reviewed (no Critical/High issues remain)
- [ ] Test Engineer validated all tests pass
- [ ] Archive Agent updated docs and pushed to GitHub

**NEVER skip Code Review, Test Validation, or Archive steps.**

## Project Documentation

- `AI-Neill/Blueprint.md` - Full implementation plan with 12 phases
- `AI-Neill/todo.md` - Current progress tracker with detailed task status
- `AI-Neill/project_history.md` - Session logs and decision history
- `AI-Neill/neill-planner/docs/Specification.md` - Detailed feature specifications
