# Phase 10: Reminders & Notifications - Visual Guide

## Component Previews

### 1. ReminderForm Component

**Location in UI:** Collapsible section in TaskForm/EventForm

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Reminders                                      0 reminders│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Add New Reminder                                        │
│                                                          │
│ ┌────────────────────┐  ┌────────────────────┐         │
│ │ Type               │  │ Time                │         │
│ │ ┌────────────────┐ │  │ ┌────────────────┐ │         │
│ │ │ In-App Banner  ▼│ │  │ │ 15 minutes...  ▼│ │         │
│ │ └────────────────┘ │  │ └────────────────┘ │         │
│ └────────────────────┘  └────────────────────┘         │
│                                                          │
│ [ + Add Reminder ]                                      │
└─────────────────────────────────────────────────────────┘
```

**After Adding Reminders:**
```
┌─────────────────────────────────────────────────────────┐
│ Reminders                                    2 reminders│
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐  │
│ │ 💬  In-App Banner                              ✕  │  │
│ │     15 minutes before                             │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 🔔  Push Notification                          ✕  │  │
│ │     1 hour before                                 │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ ─────────────────────────────────────────────────       │
│ Add New Reminder                                        │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Icon badges: 🔔 (push), 📧 (email), 💬 (in-app)
- Gray background cards for each reminder
- Remove button (✕) on hover
- Type and time dropdowns for new reminder
- Add button with plus icon

---

### 2. ReminderList Component

**Location in UI:** Task/Event detail view (read-only display)

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────┐ │
│ │  ●    In-App Banner                           🗑️   │ │
│ │       15 minutes before                             │ │
│ │       ● Triggered                                   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │  ●    Push Notification                       🗑️   │ │
│ │       1 hour before                                 │ │
│ │       ⏰ Snoozed                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │  ●    Email                                   🗑️   │ │
│ │       1 day before                                  │ │
│ │       ✓ Dismissed                                   │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                   No reminders set                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Circular icon badges in gray background
- Status indicators with color coding
- Delete button (trash icon) on right
- White cards with gray border
- Hover effects

---

### 3. NotificationPermissionBanner Component

**Location in UI:** Top of app (fixed position)

**Visual Layout:**
```
╔═══════════════════════════════════════════════════════════╗
║  🔔  Enable notifications to get reminders            ✕   ║
║      Stay on top of your tasks and events with            ║
║      timely notifications                                 ║
║                                                           ║
║      [ Enable Notifications ]                             ║
╚═══════════════════════════════════════════════════════════╝
```

**Gradient Background:** Amber (from-amber-50 to-amber-100)

**Features:**
- Bell icon in amber color
- Bold heading and subtext
- Primary button (amber background)
- Dismiss button (✕) on right
- Border bottom in amber
- Full-width, centered content
- Stores dismissed state in localStorage

---

### 4. NotificationBanner Component

**Location in UI:** Top of screen (slides down)

**High Priority (Red):**
```
╔═══════════════════════════════════════════════════════════╗
║  🔔  Team Meeting                                     ✕   ║
║      Meeting starts in 15 minutes                         ║
║      2:30 PM                                              ║
║                                                           ║
║  ┌──────────────┐  [ Snooze ]      Auto-dismiss in 8s   ║
║  │ 15 minutes ▼ │                                        ║
║  └──────────────┘                                        ║
╚═══════════════════════════════════════════════════════════╝
```

**Medium Priority (Amber):**
```
╔═══════════════════════════════════════════════════════════╗
║  🔔  Complete Report                                  ✕   ║
║      Due in 30 minutes                                    ║
║      3:00 PM                                              ║
║                                                           ║
║  ┌──────────────┐  [ Snooze ]      Auto-dismiss in 10s  ║
║  │ 15 minutes ▼ │                                        ║
║  └──────────────┘                                        ║
╚═══════════════════════════════════════════════════════════╝
```

**Animation:**
- Slides down from top with smooth animation
- Auto-dismiss countdown in bottom right
- Dismiss button fades notification out

**Features:**
- Priority-based color coding (red/amber/blue)
- Bell icon
- Title, body, and time
- Snooze dropdown (5, 15, 30, 60 minutes)
- Snooze button with clock icon
- Dismiss button (✕) top right
- Shadow and rounded corners
- Fixed positioning at top

---

### 5. NotificationContainer Component

**Location in UI:** Top of screen (manages multiple notifications)

**Multiple Notifications Stacked:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔔 Team Meeting [HIGH]                              ✕  ┃
┃    ...                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ 🔔 Complete Report [MEDIUM]                       ✕ ┃
  ┃    ...                                                ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃ 🔔 Review Docs [LOW]                            ✕ ┃
    ┃    ...                                              ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    ┌─────────────────────────────────────────────────────┐
    │         +2 more notifications                       │
    └─────────────────────────────────────────────────────┘
```

**Features:**
- Stacks notifications with 4px offset
- Sorts by priority (high → medium → low)
- Limits visible notifications (default: 3)
- Shows count of hidden notifications
- Z-index layering for depth
- Pointer-events-none on container (auto on children)

---

## Integration Examples

### TaskForm Integration

**Before Integration:**
```
┌───────────────────────────────────────┐
│ Title: ___________________________    │
│ Description: ____________________     │
│ Priority: [B1]                        │
│ Category: [Work ▼]                    │
│ Scheduled Date: [2026-02-03]          │
│                                       │
│ ○ Repeat                              │
│                                       │
│ [ Cancel ]  [ Create Task ]           │
└───────────────────────────────────────┘
```

**After Integration:**
```
┌───────────────────────────────────────┐
│ Title: ___________________________    │
│ Description: ____________________     │
│ Priority: [B1]                        │
│ Category: [Work ▼]                    │
│ Scheduled Date: [2026-02-03]          │
│                                       │
│ ○ Repeat                              │
│                                       │
│ ○ Set Reminders                    ← NEW
│                                       │
│ [ Cancel ]  [ Create Task ]           │
└───────────────────────────────────────┘
```

**With Reminders Enabled:**
```
┌───────────────────────────────────────┐
│ ...                                   │
│                                       │
│ ● Set Reminders                       │
│ ┌─────────────────────────────────┐  │
│ │ Reminders          0 reminders  │  │
│ │ ────────────────────────────────│  │
│ │ Add New Reminder                │  │
│ │ Type: [In-App ▼] Time: [15m ▼] │  │
│ │ [ + Add Reminder ]              │  │
│ └─────────────────────────────────┘  │
│                                       │
│ [ Cancel ]  [ Create Task ]           │
└───────────────────────────────────────┘
```

---

## Color Palette

### Reminder Components
- **Background**: Gray-50 (#F9FAFB)
- **Border**: Gray-200 (#E5E7EB)
- **Text**: Gray-900 (#111827)
- **Icon Container**: Gray-100 (#F3F4F6)
- **Hover**: Gray-300 (#D1D5DB)
- **Delete Hover**: Red-50 background, Red-600 text

### Notification Permission Banner
- **Background**: Gradient from Amber-50 to Amber-100
- **Border**: Amber-200
- **Text**: Gray-900
- **Icon**: Amber-600
- **Button**: Amber-500 (primary)

### Notification Banner (Priority-based)
- **High Priority**: Red-50 background, Red-200 border
- **Medium Priority**: Amber-50 background, Amber-200 border
- **Low Priority**: Blue-50 background, Blue-200 border
- **Icon**: Amber-600 (bell)
- **Text**: Gray-900

---

## Accessibility Features

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order is logical
- Enter/Space to activate buttons
- Escape to close notifications (future enhancement)

### Screen Readers
- ARIA labels on all interactive elements
- ARIA roles (alert, button, switch)
- ARIA-live regions for notifications
- Descriptive alt text for icons

### Visual Indicators
- Color contrast meets WCAG AA standards
- Focus rings on all interactive elements
- Icon + text for all states (not color alone)
- Clear visual hierarchy

---

## Responsive Design

### Mobile (< 640px)
- Form fields stack vertically
- Buttons are full-width
- Notifications use full screen width
- Reduced padding and font sizes

### Tablet (640px - 1024px)
- Form fields in 2-column grid
- Buttons inline (not full-width)
- Notifications centered with max-width

### Desktop (> 1024px)
- Form fields in 2-column grid
- Inline buttons with auto-width
- Notifications max-width: 7xl (80rem)
- Optimal spacing and typography

---

## Animation Details

### NotificationBanner Slide-Down
```css
transform: translateY(-100%) → translateY(0)
duration: 300ms
easing: ease-out
```

### Notification Stacking Offset
```css
transform: translateY(4px * index)
z-index: 50 - index
```

### Auto-Dismiss Countdown
- Updates every 1 second
- Visual countdown in bottom right
- Smooth fade-out on dismiss

---

## Testing Scenarios

### ReminderForm
1. ✅ Add reminder with type and time
2. ✅ Remove reminder
3. ✅ Multiple reminders (different types)
4. ✅ Form disabled state
5. ✅ Empty state (no reminders)

### NotificationPermissionBanner
1. ✅ Show when permission is 'default'
2. ✅ Enable button requests permission
3. ✅ Dismiss button hides banner
4. ✅ Dismissed state persists (localStorage)
5. ✅ Loading state during permission request

### NotificationBanner
1. ✅ Display notification with all fields
2. ✅ Snooze dropdown and button
3. ✅ Dismiss button
4. ✅ Auto-dismiss countdown
5. ✅ Priority color coding

### NotificationContainer
1. ✅ Display multiple notifications
2. ✅ Sort by priority
3. ✅ Limit visible notifications
4. ✅ Show hidden count
5. ✅ Empty state (no notifications)
