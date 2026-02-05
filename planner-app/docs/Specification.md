# Neill Planner — Developer Specification

**Version:** 2.1
**Date:** February 3, 2026  
**Author:** Bill Neill  
**Status:** Ready for Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [System Architecture](#3-system-architecture)
4. [Data Models & Database Schema](#4-data-models--database-schema)
5. [Core Features Specification](#5-core-features-specification)
6. [User Interface Requirements](#6-user-interface-requirements)
7. [API Specifications](#7-api-specifications)
8. [Authentication & Security](#8-authentication--security)
9. [Sync & Offline Support](#9-sync--offline-support)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Testing Plan](#11-testing-plan)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

Neill Planner is a digital productivity application based on the Franklin-Covey methodology. It helps users prioritize and manage daily tasks using the A-B-C-D priority system with recurring tasks. The application supports desktop (Windows/macOS) and Android platforms with near real-time cloud sync, offline support, and personal reminders.

### Primary Users
- Private multi-user support (user and spouse)
- Role-based permissions (Admin, Standard)

### Core Goals
- Task prioritization using A-B-C-D system
- Category-based organization with color coding
- Recurring task/event handling
- Notes linking to tasks/events
- Calendar scheduling with Google Calendar sync
- Cloud sync across devices
- Secure multi-device access

---

## 2. Product Overview

### 2.1 Platforms

| Platform | Technology | Notes |
|----------|------------|-------|
| Desktop (Windows/macOS) | Electron or PWA | Full feature parity |
| Android | React Native or PWA | Full feature parity |
| Backend | Firebase | Authentication, Firestore, Cloud Functions |

### 2.2 Sync Architecture
- **Near real-time sync**: Changes propagate within seconds when online
- **Offline support**: Full CRUD functionality offline
- **Conflict resolution**: User-prompted resolution for conflicts

### 2.3 Franklin-Covey Methodology Implementation
- **A Tasks**: Must do today — serious consequences if not completed
- **B Tasks**: Should do today — mild consequences if not completed
- **C Tasks**: Nice to do today — no consequences if not completed
- **D Tasks**: Delegate or defer

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Desktop App    │   Android App   │      Web Interface          │
│  (Electron)     │ (React Native)  │        (React)              │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                      │
         └─────────────────┼──────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Services                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Authentication │    Firestore    │     Cloud Functions         │
│  (Google Sign)  │   (Database)    │   (Business Logic)          │
├─────────────────┼─────────────────┼─────────────────────────────┤
│  Cloud Storage  │  Cloud Messaging│     Google Calendar         │
│   (Backups)     │    (Push)       │        API                  │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18+ | UI components |
| State Management | Redux Toolkit | Client-side state |
| Styling | Tailwind CSS | Responsive design |
| Backend | Firebase | BaaS |
| Database | Firestore | NoSQL real-time database |
| Authentication | Firebase Auth + Google | User management |
| Push Notifications | Firebase Cloud Messaging | Reminders |
| Calendar Sync | Google Calendar API | Two-way sync |
| Offline Storage | IndexedDB | Local persistence |

### 3.3 Directory Structure

```
neill-planner/
├── src/
│   ├── components/
│   │   ├── tasks/
│   │   ├── events/
│   │   ├── notes/
│   │   ├── categories/
│   │   └── common/
│   ├── services/
│   │   ├── firebase/
│   │   ├── sync/
│   │   ├── calendar/
│   │   └── notifications/
│   ├── store/
│   │   ├── slices/
│   │   └── middleware/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── functions/         # Firebase Cloud Functions
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

---

## 4. Data Models & Database Schema

### 4.1 Firestore Collections Structure

```
users/
  {userId}/
    profile: { ... }
    settings: { ... }
    
tasks/
  {taskId}: { ... }
  
events/
  {eventId}: { ... }
  
categories/
  {categoryId}: { ... }
  
notes/
  {noteId}: { ... }
  
goals/
  {goalId}: { ... }
  
deletedItems/
  {itemId}: { ... }  // 30-day recycle bin
```

### 4.2 Task Schema

```typescript
interface Task {
  id: string;                          // Auto-generated UUID
  userId: string;                      // Owner reference
  title: string;                       // Required, max 500 chars
  description: string;                 // Optional, max 5000 chars
  categoryId: string | null;           // Reference to category
  priority: {
    letter: 'A' | 'B' | 'C' | 'D';     // Required
    number: number;                    // Auto-assigned, editable
  };
  status: 'in_progress' | 'forward' | 'complete' | 'delete' | 'delegate';
  symbols: {
    in_progress: '●';
    forward: '➜';
    complete: '✔';
    delete: '✘';
    delegate: '◯';
  };
  scheduledDate: Timestamp | null;     // Date task is scheduled for (defaults to selected date when creating)
  recurrence: RecurrencePattern | null;
  linkedNoteIds: string[];             // Array of note references
  linkedEventId: string | null;        // Optional event link
  isRecurringInstance: boolean;        // True if generated from pattern
  recurringParentId: string | null;    // Reference to parent task
  instanceDate: Timestamp | null;      // Date this instance represents
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;         // Soft delete
}
```

### 4.3 Event Schema

```typescript
interface Event {
  id: string;
  userId: string;
  title: string;                       // Required
  description: string;
  categoryId: string | null;
  startTime: Timestamp;                // Required
  endTime: Timestamp;                  // Required
  location: string;
  isConfidential: boolean;             // Default: false
  alternateTitle: string | null;       // For Google Calendar when confidential
  recurrence: RecurrencePattern | null;
  linkedNoteIds: string[];
  linkedTaskIds: string[];
  googleCalendarId: string | null;     // Google Calendar event ID
  isRecurringInstance: boolean;
  recurringParentId: string | null;
  instanceDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

### 4.4 Recurrence Pattern Schema

```typescript
interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;                    // Every X days/weeks/months/years
  daysOfWeek: number[];               // For weekly: 0=Sun, 1=Mon, etc.
  dayOfMonth: number | null;          // For monthly
  monthOfYear: number | null;         // For yearly
  endCondition: {
    type: 'never' | 'date' | 'occurrences';
    endDate: Timestamp | null;
    maxOccurrences: number | null;
  };
  exceptions: Timestamp[];            // Dates to skip
  modifications: {                    // Instance-specific changes
    [instanceDate: string]: Partial<Task | Event>;
  };
}
```

### 4.5 Category Schema

```typescript
interface Category {
  id: string;
  userId: string;
  name: string;                        // Required, max 50 chars
  color: string;                       // Hex color code
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Predefined color palette
const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];
```

### 4.6 Note Schema

```typescript
interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;                     // Rich text (HTML or Markdown)
  date: Timestamp;                     // Date-specific
  categoryId: string | null;
  linkedTaskIds: string[];
  linkedEventIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

### 4.7 Long-Term Goal Schema

```typescript
interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  categoryId: string | null;
  targetDate: Timestamp | null;
  linkedNoteIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.8 User & Settings Schema

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'standard';
  googleCalendarConnected: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  defaultPriorityLetter: 'A' | 'B' | 'C' | 'D';
  defaultReminderMinutes: number;
  timezone: string;                    // IANA timezone string
  weekStartsOn: 0 | 1;                // 0=Sunday, 1=Monday
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  googleCalendarSyncEnabled: boolean;
  platform: 'desktop' | 'android' | 'web';
}
```

### 4.9 Firestore Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "scheduledDate", "order": "ASCENDING" },
        { "fieldPath": "priority.letter", "order": "ASCENDING" },
        { "fieldPath": "priority.number", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 5. Core Features Specification

### 5.1 Task Management

#### 5.1.1 Priority System
- Tasks are ordered: A1, A2, A3... B1, B2... C1, C2... D1, D2...
- Priority letter is user-selectable (A, B, C, D)
- Priority number auto-assigned but manually editable
- **Global Reorder Button**: Renumbers all tasks sequentially within each priority

#### 5.1.2 Task Status Symbols
| Symbol | Status | Description |
|--------|--------|-------------|
| ● | In Progress | Default for new tasks |
| ➜ | Forward | Move to another day |
| ✔ | Complete | Task finished |
| ✘ | Delete | Marked for removal |
| ◯ | Delegate | Assigned to someone else |

- Status changed via dropdown in list view only
- No automatic behaviors triggered by status change

#### 5.1.3 Drag-and-Drop Rules
- Drag within same priority level only (A tasks among A tasks)
- Cannot change priority via drag
- Show drop preview during drag
- Smooth slide animation on reorder
- Drag handles visible at all times

#### 5.1.4 Task Duplication
- Opens immediately in edit mode
- Copies: title, category, priority letter, recurrence pattern
- Does NOT copy: linked notes, priority number
- Visual duplicate icon shown

#### 5.1.5 Task Deletion
- Confirmation prompt required
- Moves to Recycle Bin (30-day retention)
- Individual restore available
- Permanent deletion option in Recycle Bin

### 5.2 Recurring Tasks/Events

#### 5.2.1 Recurrence Types
| Type | Options |
|------|---------|
| Daily | Every X days |
| Weekly | Every X weeks, specific days (M-Su) |
| Monthly | Every X months, specific day of month |
| Yearly | Every X years, specific date |
| Custom | Combination of above |

#### 5.2.2 End Conditions
- Never (infinite)
- End after specific date
- End after X occurrences

#### 5.2.3 Editing Recurring Items
When editing a recurring task/event, user is prompted:
- **"Edit this instance only"**: Changes apply only to selected occurrence
- **"Edit all future instances"**: Changes apply from this date forward

#### 5.2.4 Deleting Recurring Items
When deleting, user is prompted:
- **"Delete this instance"**: Removes only selected occurrence
- **"Delete all future instances"**: Removes from this date forward

#### 5.2.5 Completion Behavior
- Completing a recurring task/event marks ONLY that instance complete
- Checkmark shown in both list and calendar views
- Future instances remain unaffected

#### 5.2.6 Visual Indicators
- Recurrence icon (↻) visible on recurring items
- Tooltip shows recurrence details on hover

### 5.3 Events & Calendar

#### 5.3.1 Event Properties
- Time-blocked with start/end times
- Overlapping events allowed
- Category color displayed
- Location field (optional)

#### 5.3.2 Confidential Events
- Checkbox to mark confidential
- Alternate title for Google Calendar sync
- Real title hidden from other calendar viewers
- Cannot duplicate or copy confidential events
- Confidential icon (🔒) displayed

#### 5.3.3 Google Calendar Sync
- Two-way synchronization
- Sync occurs on:
  - App launch
  - Event create/edit/delete
  - Manual refresh
  - Every 5 minutes (background)
- Confidential events show alternate title in Google Calendar
- Sync status indicator in UI

### 5.4 Categories

#### 5.4.1 Category Management
- User-defined categories (add/edit/delete)
- Default: "Uncategorized"
- Single category per task/event
- 8 primary colors + custom color picker

#### 5.4.2 Category Color Application
Category color applies to:
- Priority label background (e.g., "A1" badge with colored background)
- Text color automatically adjusts for contrast on colored backgrounds
- Linked notes

#### 5.4.2.1 Task Item Display Layout
Task items display in this order:
1. **Status Symbol** - Clickable (●, ✔, ➜, ✘, ◯)
2. **Priority Label** - Badge with category color background (e.g., "A1")
3. **Task Title** - Main task text

#### 5.4.3 Category Deletion
When a category is deleted:
- All associated tasks/events set to "Uncategorized"
- Confirmation prompt required

### 5.5 Notes

#### 5.5.1 Note Features
- Rich text formatting (bold, italic, bullets, lists)
- Keyboard shortcuts for formatting
- Date-specific to Daily View
- Autosave enabled

#### 5.5.2 Note Linking
- Can link to multiple tasks/events
- Links visible on hover (tooltip)
- Linked notes icon displayed
- Link updates dynamically with task/event changes

#### 5.5.3 Note Search
- Searchable by title, description, category
- Partial matches
- Case-insensitive

### 5.6 Reminders & Notifications

#### 5.6.1 Reminder Properties
- Personal to creator only
- Multiple reminders per task/event allowed
- Time-based triggers
- Respect user's local timezone

#### 5.6.2 Snooze Options
- 5 minutes
- 15 minutes
- 30 minutes
- 1 hour

#### 5.6.3 Notification Methods
| Method | Description |
|--------|-------------|
| Push | System push notifications |
| In-App Banner | Banner at top of app |
| System Tray | Tray notification (desktop) |

#### 5.6.4 Multi-Device Behavior
- Dismissing on one device does NOT dismiss on others
- Multiple simultaneous reminders grouped

#### 5.6.5 Recurring Reminders
- Reminders trigger for each occurrence
- Based on instance date/time

### 5.7 Search & Filters

#### 5.7.1 Unified Search
- Single search bar across all views
- Searches: tasks, events, notes
- Partial match support
- Case-insensitive
- Highlights matched text in results

#### 5.7.2 Search Results
- Grouped by type (Tasks, Events, Notes)
- Sortable by:
  - Priority
  - Date
  - Category

#### 5.7.3 Filters
- Single-select (filters override each other)
- Can combine: status + category + priority
- Persist across tabs within session
- Reset on app refresh

---

## 6. User Interface Requirements

### 6.1 Design Principles
- Colorful, cheerful aesthetic
- High readability (especially for older users)
- Adjustable font sizes
- Consistent visual language

### 6.2 Daily View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ☰  Neill Planner                    [Search] [👤] [⚙️]    │
├─────────────────────────────────────────────────────────────┤
│  ◀  Saturday, January 24, 2026  ▶           [Today]        │
├──────────────────────────────────────┬──────────────────────┤
│           TABS                       │                      │
│  [Tasks] [Calendar] [Notes]          │                      │
├──────────────────────────────────────┤     TIME BLOCK       │
│                                      │      CALENDAR        │
│  TASK LIST                           │                      │
│  ────────────────────                │   ┌────────────────┐ │
│  A Priority                          │   │ 8:00 AM        │ │
│  ┌──────────────────────────┐        │   │                │ │
│  │ ● A1 Complete report     │        │   │ 9:00 AM        │ │
│  │    [Work] ↻              │        │   │ ▓▓▓ Meeting    │ │
│  └──────────────────────────┘        │   │ 10:00 AM       │ │
│  ┌──────────────────────────┐        │   │                │ │
│  │ ● A2 Call client         │        │   └────────────────┘ │
│  └──────────────────────────┘        │                      │
│                                      │                      │
│  B Priority                          │                      │
│  ┌──────────────────────────┐        │                      │
│  │ ● B1 Review docs         │        │                      │
│  └──────────────────────────┘        │                      │
│                                      │                      │
│  [+ Add Task]                        │                      │
├──────────────────────────────────────┴──────────────────────┤
│  [Reorder All]                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Hamburger Menu Items
- Week View
- Month View
- Goals
- Categories (manage)
- Settings
- Recycle Bin
- Help
- Logout

### 6.4 Week View
- Traditional 7-day grid (Sunday-Saturday)
- Shows event times on grid
- Navigate between weeks (◀ ▶)
- Current week shown by default
- Tap day to navigate to Daily View

### 6.5 Month View
- Traditional calendar grid
- Events shown with day, time, name
- Navigate between months (◀ ▶)
- Current month shown by default
- Tap day to navigate to Daily View

### 6.6 Detail Screens

#### Task/Event Detail Screen Sections
1. **General Info**: Title, description, category
2. **Scheduling**: Date, time
3. **Recurrence**: Pattern settings
4. **Notes**: Linked notes
5. **Reminders**: Reminder settings

- Collapsible sections
- Required fields highlighted
- Save/Cancel buttons

### 6.7 Visual Cues & Icons
| Element | Icon/Indicator |
|---------|----------------|
| Recurring | ↻ |
| Confidential | 🔒 |
| Duplicate | ⧉ |
| Linked Notes | 📎 |
| Category Color | Left border or background |
| Drag Handle | ⋮⋮ |

### 6.8 Animations
- Smooth slide animation on drag-and-drop reorder
- Fade transitions between views
- Subtle bounce on task completion

---

## 7. API Specifications

### 7.1 Firebase Cloud Functions

#### 7.1.1 Task Functions

```typescript
// Create Task
exports.createTask = functions.https.onCall(async (data, context) => {
  // Validate auth
  // Validate data
  // Auto-assign priority number
  // Create task document
  // Return task ID
});

// Update Task
exports.updateTask = functions.https.onCall(async (data, context) => {
  // Validate auth & ownership
  // Handle recurring instance edit
  // Update document
  // Sync to Google Calendar if linked
});

// Delete Task
exports.deleteTask = functions.https.onCall(async (data, context) => {
  // Validate auth & ownership
  // Move to deletedItems collection
  // Set deletedAt timestamp
});

// Reorder Tasks
exports.reorderTasks = functions.https.onCall(async (data, context) => {
  // Get all user tasks for date
  // Renumber within each priority
  // Batch update
});
```

#### 7.1.2 Google Calendar Sync Functions

```typescript
// Sync Event to Google Calendar
exports.syncToGoogleCalendar = functions.https.onCall(async (data, context) => {
  // Get user's Google credentials
  // Create/update Google Calendar event
  // Handle confidential title
  // Store Google Calendar event ID
});

// Import from Google Calendar
exports.importFromGoogleCalendar = functions.https.onCall(async (data, context) => {
  // Fetch Google Calendar events
  // Create Neill Planner events
  // Handle conflicts
});
```

#### 7.1.3 Scheduled Functions

```typescript
// Clean up old deleted items (runs daily)
exports.cleanupDeletedItems = functions.pubsub
  .schedule('0 2 * * *')
  .onRun(async (context) => {
    // Find items older than 30 days in deletedItems
    // Permanently delete
  });

// Send reminder notifications
exports.sendReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    // Query upcoming reminders
    // Send push notifications
  });
```

### 7.2 REST API Endpoints (Alternative)

If not using Firebase callable functions:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks?date={date} | Get tasks for date |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Delete task |
| POST | /api/tasks/reorder | Reorder all tasks |
| GET | /api/events?start={date}&end={date} | Get events |
| POST | /api/events | Create event |
| PUT | /api/events/{id} | Update event |
| DELETE | /api/events/{id} | Delete event |
| GET | /api/notes?date={date} | Get notes for date |
| POST | /api/sync/google-calendar | Trigger Google Calendar sync |

---

## 8. Authentication & Security

### 8.1 Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │────▶│ Google OAuth │────▶│   Firebase   │
│   Login      │     │              │     │    Auth      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Firestore  │
                                          │   (User Doc) │
                                          └──────────────┘
```

### 8.2 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Tasks
    match /tasks/{taskId} {
      allow read, write: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isOwner(request.resource.data.userId);
    }
    
    // Events
    match /events/{eventId} {
      allow read, write: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isOwner(request.resource.data.userId);
    }
    
    // Notes
    match /notes/{noteId} {
      allow read, write: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isOwner(request.resource.data.userId);
    }
    
    // Categories
    match /categories/{categoryId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
    }
    
    // User settings
    match /users/{userId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }
  }
}
```

### 8.3 Data Encryption
- **At rest**: Firestore encrypts all data at rest by default
- **In transit**: All communication over HTTPS/TLS 1.3
- **Sensitive fields**: Additional encryption for any PII

### 8.4 Role-Based Access

| Role | Permissions |
|------|-------------|
| Admin | Full access to all users' data, can delete users |
| Standard | Access only to own data |

### 8.5 Password Recovery
- Handled entirely by Google OAuth
- No custom password recovery needed

---

## 9. Sync & Offline Support

### 9.1 Offline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Device                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │    Redux Store  │◄──▶│    IndexedDB    │                │
│  │   (In-Memory)   │    │  (Persistent)   │                │
│  └────────┬────────┘    └─────────────────┘                │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │            Sync Manager                  │               │
│  │  - Queue offline changes                 │               │
│  │  - Track sync status                     │               │
│  │  - Handle conflicts                      │               │
│  └─────────────────────────────────────────┘               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ (When Online)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Firebase                               │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Sync Queue Schema

```typescript
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: 'tasks' | 'events' | 'notes' | 'categories';
  documentId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}
```

### 9.3 Conflict Resolution

When a conflict is detected:

1. **Show conflict dialog to user**
2. **Options**:
   - Keep local version
   - Keep server version
   - Merge (if possible)
3. **Log conflict for debugging**

```typescript
interface ConflictResolution {
  localVersion: any;
  serverVersion: any;
  userChoice: 'local' | 'server' | 'merge';
  mergedVersion?: any;
  timestamp: number;
}
```

### 9.4 Sync Status Indicators

| Status | Icon | Description |
|--------|------|-------------|
| Synced | ✓ (green) | All changes synced |
| Syncing | ↻ (blue) | Sync in progress |
| Pending | ● (yellow) | Changes queued |
| Offline | ○ (gray) | No connection |
| Error | ⚠ (red) | Sync failed |

---

## 10. Error Handling Strategy

### 10.1 Error Categories

| Category | Handling | User Message |
|----------|----------|--------------|
| Network | Retry with backoff | "Connection lost. Working offline." |
| Auth | Redirect to login | "Session expired. Please log in." |
| Validation | Show field errors | Specific field error message |
| Server | Log & show generic | "Something went wrong. Please try again." |
| Quota | Banner notification | "Service temporarily unavailable." |

### 10.2 Specific Edge Cases

| Scenario | Handling |
|----------|----------|
| Recurring task with end date in past | Disallowed - show validation error |
| Device clock significantly wrong | Warn user, disable appointment creation |
| Firebase quota exceeded | Show banner in app |
| Google Calendar API unavailable | Bypass, queue sync for later |
| No internet on first launch | Cannot authenticate - show message |

### 10.3 Error Logging

```typescript
interface ErrorLog {
  timestamp: number;
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  userId: string | null;
  deviceInfo: {
    platform: string;
    version: string;
    networkStatus: string;
  };
  context: {
    action: string;
    data: any;
  };
}
```

### 10.4 Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,  // 1 second
  maxDelay: 30000,     // 30 seconds
  backoffMultiplier: 2,
};

async function retryWithBackoff(fn, config = retryConfig) {
  let retries = 0;
  let delay = config.initialDelay;
  
  while (retries < config.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= config.maxRetries) throw error;
      await sleep(Math.min(delay, config.maxDelay));
      delay *= config.backoffMultiplier;
    }
  }
}
```

---

## 11. Testing Plan

### 11.1 Testing Priorities

| Priority | Area | Coverage Target |
|----------|------|-----------------|
| 1 (Critical) | Task CRUD operations | 95% |
| 1 (Critical) | Google Calendar sync | 90% |
| 2 (High) | Recurring tasks/events | 90% |
| 2 (High) | Offline/sync functionality | 85% |
| 3 (Medium) | UI components | 80% |
| 3 (Medium) | Search & filters | 80% |
| 4 (Low) | Settings & preferences | 70% |

### 11.2 Unit Tests

```typescript
// Example: Task priority assignment
describe('TaskService', () => {
  describe('assignPriorityNumber', () => {
    it('should assign next number for priority letter', async () => {
      // Setup: Existing tasks A1, A2
      // Action: Create new A task
      // Assert: Gets A3
    });
    
    it('should start at 1 for empty priority', async () => {
      // Setup: No A tasks exist
      // Action: Create A task
      // Assert: Gets A1
    });
    
    it('should fill gaps after deletion', async () => {
      // Setup: Tasks A1, A3 (A2 deleted)
      // Action: Reorder
      // Assert: A1, A2
    });
  });
});
```

### 11.3 Integration Tests

```typescript
// Example: Google Calendar sync
describe('GoogleCalendarSync', () => {
  it('should create event in Google Calendar', async () => {
    // Create Neill event
    // Trigger sync
    // Verify Google Calendar API called
    // Verify event ID stored
  });
  
  it('should handle confidential events', async () => {
    // Create confidential event
    // Trigger sync
    // Verify alternate title sent to Google
  });
  
  it('should handle sync conflicts', async () => {
    // Create event in both systems
    // Trigger sync
    // Verify conflict resolution prompted
  });
});
```

### 11.4 End-to-End Tests

```typescript
// Example: Complete task workflow
describe('Task Workflow E2E', () => {
  it('should complete full task lifecycle', async () => {
    // Login
    // Create task with priority A
    // Edit task description
    // Mark as complete
    // Verify checkmark appears
    // Delete task
    // Verify in recycle bin
    // Restore task
    // Verify restored
  });
  
  it('should handle recurring task editing', async () => {
    // Create recurring daily task
    // Edit single instance
    // Verify only instance changed
    // Edit all future instances
    // Verify future instances changed
  });
});
```

### 11.5 Performance Tests

| Test | Target | Threshold |
|------|--------|-----------|
| Initial load | < 2s | 3s |
| Task list render (100 tasks) | < 100ms | 200ms |
| Search response | < 200ms | 500ms |
| Sync operation | < 5s | 10s |
| Offline to online transition | < 3s | 5s |

### 11.6 Test Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Local testing | Mock data |
| Staging | Pre-release testing | Copy of production |
| Production | Live users | Real data |

---

## 12. Deployment & Infrastructure

### 12.1 Firebase Project Setup

```bash
# Initialize Firebase
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators

# Deploy
firebase deploy
```

### 12.2 Environment Configuration

```javascript
// .env.development
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
REACT_APP_GOOGLE_CLIENT_ID=xxx

// .env.production
REACT_APP_FIREBASE_API_KEY=yyy
// ... production values
```

### 12.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: neill-planner
```

### 12.4 Monitoring & Analytics

- **Firebase Analytics**: User engagement, feature usage
- **Firebase Crashlytics**: Error tracking
- **Firebase Performance**: Load times, network latency
- **Custom Logging**: Business metrics

### 12.5 Backup Strategy

- **Automatic**: Firebase Firestore automatic daily backups
- **Manual Export**: User can export to CSV/JSON
- **Google Drive Sync**: Backup files to user's Google Drive

---

## 13. Appendices

### Appendix A: Franklin-Covey Methodology Reference

The Franklin-Covey system prioritizes tasks based on urgency and importance:

| Priority | Description | Criteria |
|----------|-------------|----------|
| A | Vital | Must be done today; serious consequences if not |
| B | Important | Should be done today; mild consequences if not |
| C | Optional | Nice to do; no consequences if not completed |
| D | Delegate | Can be assigned to others or deferred |

### Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + N | New task |
| Ctrl/Cmd + E | New event |
| Ctrl/Cmd + K | Search |
| Ctrl/Cmd + , | Settings |
| ← → | Navigate days |
| Ctrl/Cmd + T | Go to today |
| Esc | Close modal |

### Appendix C: Import/Export Formats

#### CSV Task Format
```csv
title,description,priority_letter,priority_number,status,category,scheduled_date,recurrence_type
"Complete report","Finish quarterly report","A",1,"in_progress","Work","2026-01-24","none"
```

#### JSON Export Format
```json
{
  "version": "2.0",
  "exportDate": "2026-01-24T12:00:00Z",
  "tasks": [...],
  "events": [...],
  "notes": [...],
  "categories": [...]
}
```

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| Instance | A single occurrence of a recurring task/event |
| Sync Queue | Local storage of changes waiting to sync |
| Soft Delete | Marking as deleted without permanent removal |
| Time Block | A scheduled period of time for an event |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Bill Neill | Initial specification |
| 2.0 | 2026-01-24 | Bill Neill | Complete developer-ready spec with database schema |
| 2.1 | 2026-02-03 | Bill Neill | Removed scheduledTime field; scheduledDate now defaults to selected date; clarified task item display layout (Status → Priority → Title); category color applied to priority label background |

---

**Contact:** williamjneill@gmail.com  
**Repository:** github.com/wneill3333  
**License:** Personal use