# Neill Planner

A Franklin-Covey Productivity Application built with React, TypeScript, and Firebase.

## Overview

Neill Planner is a task management and daily planning application based on the Franklin-Covey methodology with an A-B-C-D priority system:

- **A** = Vital (must do today, serious consequences if not)
- **B** = Important (should do today, mild consequences if not)
- **C** = Optional (nice to do, no consequences if not)
- **D** = Delegate (can be assigned to others or deferred)

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Testing**: Vitest + React Testing Library

## Project Status

### Phase 1: Project Foundation & Core Infrastructure ✅ COMPLETE
- [x] 1.1.1: Project scaffolding with Vite + React + TypeScript
- [x] 1.1.2: ESLint and Prettier configuration
- [x] 1.2.1: Task type definitions
- [x] 1.2.2: Event, Category, Note, User type definitions
- [x] 1.3.1: Firebase configuration
- [x] 1.3.2: Firestore Task service layer
- [x] 1.4.1: Authentication Context and hooks
- [x] 1.4.2: Login Page component

### Phase 2: Data Layer & State Management 🚧 IN PROGRESS
- [x] 2.1.1: Redux Store setup with typed hooks
- [x] 2.2.1: Task Slice - Basic State (reducers, selectors)
- [ ] 2.2.2: Task Async Thunks
- [ ] 2.3.1: Category Slice
- [ ] 2.4: Firestore Integration

### Phase 3-12: Coming Soon
See [docs/Blueprint.md](docs/Blueprint.md) for the complete implementation plan.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AceDZN/neill-planner.git

# Install dependencies
cd neill-planner
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Lint code
npm run lint
```

## Test Coverage

Current test status: **325 tests passing**

| Category | Tests |
|----------|-------|
| Type Tests | 117 |
| Firebase Services | 12 |
| Auth Context | 15 |
| Common Components | 38 |
| Store & Hooks | 38 |
| Task Slice | 55 |
| Test Utilities | 29 |
| App Tests | 21 |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Button, Spinner, etc.
│   └── tasks/          # Task-specific components (coming)
├── features/           # Feature modules
│   ├── auth/           # Authentication (Context, LoginPage)
│   ├── tasks/          # Task state management
│   ├── events/         # Events (coming)
│   ├── notes/          # Notes (coming)
│   └── categories/     # Categories (coming)
├── hooks/              # Custom React hooks
├── services/           # External service integrations
│   └── firebase/       # Firebase config, services
├── store/              # Redux store configuration
├── test/               # Test utilities
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Contributing

This is a personal project, but suggestions are welcome via GitHub issues.

## License

Private - All rights reserved.
