# Reminder Components

## Overview

This directory contains components for managing reminders on tasks and events in the Neill Planner app.

## Components

### ReminderForm

Form to add/edit reminders on tasks or events. Allows multiple reminders with different notification types and times.

**Props:**
- `reminders: CreateReminderInput[]` - Current reminders
- `onChange: (reminders: CreateReminderInput[]) => void` - Callback when reminders are updated
- `disabled?: boolean` - Whether form is disabled
- `testId?: string` - Test ID for testing

**Example Usage in TaskForm:**

```tsx
import { ReminderForm } from '../reminders/ReminderForm';
import type { CreateReminderInput } from '../../types/reminder.types';

// Add to FormData interface
interface FormData {
  // ... existing fields
  reminders: CreateReminderInput[];
}

// Initialize in state
const [formData, setFormData] = useState<FormData>(() => ({
  // ... existing fields
  reminders: task?.reminderIds?.map(id => ({
    // Convert reminderIds to CreateReminderInput
    // This requires fetching reminder data
  })) || [],
}));

// Add to form JSX (after Recurrence Section)
<div className="space-y-4">
  <Toggle
    label="Reminders"
    checked={formData.reminders.length > 0}
    onChange={(checked) => {
      if (!checked) {
        handleChange('reminders', []);
      }
    }}
    disabled={isSubmitting}
    testId="reminders-toggle"
  />

  {formData.reminders.length > 0 && (
    <ReminderForm
      reminders={formData.reminders}
      onChange={(reminders) => handleChange('reminders', reminders)}
      disabled={isSubmitting}
      testId="task-reminder-form"
    />
  )}
</div>
```

### ReminderList

Display list of reminders for a task or event. Shows type icon, time description, and delete button per reminder.

**Props:**
- `reminders: Reminder[]` - List of reminders to display
- `onDelete?: (reminderId: string) => void` - Callback when a reminder is deleted
- `readOnly?: boolean` - Whether the list is in read-only mode
- `testId?: string` - Test ID for testing

**Example Usage:**

```tsx
import { ReminderList } from '../reminders/ReminderList';

<ReminderList
  reminders={taskReminders}
  onDelete={(id) => deleteReminder(id)}
/>
```

## Integration Notes

### Task/Event Forms

1. Add `reminders` field to FormData
2. Add collapsible section with Toggle component
3. Include ReminderForm inside the collapsible section
4. Handle reminder creation/deletion in form submission

### Data Flow

1. **Create Mode**: User adds reminders via ReminderForm
2. **Edit Mode**: Load existing reminders from task/event reminderIds
3. **Submit**: Convert CreateReminderInput to Reminder entities and save

### State Management

Reminders should be managed in a separate Redux slice or via Firebase service:

- `createReminder(input: CreateReminderInput)` - Create new reminder
- `updateReminder(id: string, input: UpdateReminderInput)` - Update reminder
- `deleteReminder(id: string)` - Delete reminder
- `getRemindersForTask(taskId: string)` - Fetch task reminders
- `getRemindersForEvent(eventId: string)` - Fetch event reminders
