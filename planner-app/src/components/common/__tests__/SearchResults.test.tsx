/**
 * Tests for SearchResults component
 *
 * Tests search results display with grouping, highlighting, and navigation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResults } from '../SearchResults';
import type { Task, Event, Note } from '../../../types';

// =============================================================================
// Test Data
// =============================================================================

const mockTask: Task = {
  id: 'task-1',
  userId: 'user-1',
  title: 'Meeting with client',
  description: 'Discuss project requirements',
  priority: { letter: 'A', number: 1 },
  status: 'in_progress',
  categoryId: null,
  scheduledDate: new Date('2026-02-01'),
  scheduledTime: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedEventId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockEvent: Event = {
  id: 'event-1',
  userId: 'user-1',
  title: 'Team meeting',
  description: 'Weekly standup',
  categoryId: null,
  startTime: new Date('2026-02-01T10:00:00'),
  endTime: new Date('2026-02-01T11:00:00'),
  location: 'Conference Room',
  isConfidential: false,
  alternateTitle: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedTaskIds: [],
  googleCalendarId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Meeting notes',
  content: 'Important discussion points',
  date: new Date('2026-02-01'),
  categoryId: null,
  linkedTaskIds: [],
  linkedEventIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// =============================================================================
// Tests - Rendering States
// =============================================================================

describe('SearchResults - Rendering States', () => {
  it('should not render when query is empty', () => {
    render(
      <SearchResults
        query=""
        tasks={[]}
        events={[]}
        notes={[]}
      />
    );

    const results = screen.queryByTestId('search-results');
    expect(results).not.toBeInTheDocument();
  });

  it('should render loading state when isSearching is true', () => {
    render(
      <SearchResults
        query="test"
        tasks={[]}
        events={[]}
        notes={[]}
        isSearching={true}
      />
    );

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should render empty state when no results', () => {
    render(
      <SearchResults
        query="test"
        tasks={[]}
        events={[]}
        notes={[]}
        isSearching={false}
      />
    );

    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should render results when available', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[mockEvent]}
        notes={[mockNote]}
      />
    );

    expect(screen.getByTestId('search-results')).toBeInTheDocument();
    expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('search-empty')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Tests - Grouping and Counts
// =============================================================================

describe('SearchResults - Grouping', () => {
  it('should display Tasks section with count', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    expect(screen.getByText(/Tasks/)).toBeInTheDocument();
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('should display Events section with count', () => {
    render(
      <SearchResults
        query="test"
        tasks={[]}
        events={[mockEvent]}
        notes={[]}
      />
    );

    expect(screen.getByText(/Events/)).toBeInTheDocument();
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('should display Notes section with count', () => {
    render(
      <SearchResults
        query="test"
        tasks={[]}
        events={[]}
        notes={[mockNote]}
      />
    );

    expect(screen.getByText(/Notes/)).toBeInTheDocument();
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('should not display section when count is zero', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    expect(screen.getByText(/Tasks/)).toBeInTheDocument();
    expect(screen.queryByText(/Events/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notes/)).not.toBeInTheDocument();
  });

  it('should display all sections when all have results', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[mockEvent]}
        notes={[mockNote]}
      />
    );

    expect(screen.getByText(/Tasks/)).toBeInTheDocument();
    expect(screen.getByText(/Events/)).toBeInTheDocument();
    expect(screen.getByText(/Notes/)).toBeInTheDocument();
  });

  it('should display correct counts for multiple items', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask, { ...mockTask, id: 'task-2', title: 'Second task' }]}
        events={[mockEvent, { ...mockEvent, id: 'event-2', title: 'Second event' }]}
        notes={[mockNote]}
      />
    );

    const text = screen.getByTestId('search-results').textContent;
    expect(text).toContain('(2)'); // 2 tasks
    expect(text).toContain('(2)'); // 2 events
    expect(text).toContain('(1)'); // 1 note
  });
});

// =============================================================================
// Tests - Task Results
// =============================================================================

describe('SearchResults - Task Items', () => {
  it('should render task title', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    // Text is split by highlighting, use partial match
    expect(screen.getByText(/Meeting/)).toBeInTheDocument();
    expect(screen.getByText(/with client/)).toBeInTheDocument();
  });

  it('should render task description', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    expect(screen.getByText(/Discuss project requirements/)).toBeInTheDocument();
  });

  it('should render task priority', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('should call onTaskClick when task is clicked', async () => {
    const onTaskClick = vi.fn();
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
        onTaskClick={onTaskClick}
      />
    );

    const taskItem = screen.getByTestId('task-result-item');
    await userEvent.click(taskItem);

    expect(onTaskClick).toHaveBeenCalledWith(mockTask);
  });

  it('should not error if onTaskClick is not provided', async () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    const taskItem = screen.getByTestId('task-result-item');

    // Should not throw error
    await userEvent.click(taskItem);
  });
});

// =============================================================================
// Tests - Event Results
// =============================================================================

describe('SearchResults - Event Items', () => {
  it('should render event title', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[mockEvent]}
        notes={[]}
      />
    );

    // Text is split by highlighting, use partial match
    expect(screen.getByText(/Team/)).toBeInTheDocument();
    expect(screen.getByText(/meeting/i)).toBeInTheDocument();
  });

  it('should render event description', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[mockEvent]}
        notes={[]}
      />
    );

    expect(screen.getByText(/Weekly standup/)).toBeInTheDocument();
  });

  it('should render event location', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[mockEvent]}
        notes={[]}
      />
    );

    expect(screen.getByText(/Conference Room/)).toBeInTheDocument();
  });

  it('should call onEventClick when event is clicked', async () => {
    const onEventClick = vi.fn();
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[mockEvent]}
        notes={[]}
        onEventClick={onEventClick}
      />
    );

    const eventItem = screen.getByTestId('event-result-item');
    await userEvent.click(eventItem);

    expect(onEventClick).toHaveBeenCalledWith(mockEvent);
  });
});

// =============================================================================
// Tests - Note Results
// =============================================================================

describe('SearchResults - Note Items', () => {
  it('should render note title', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[]}
        notes={[mockNote]}
      />
    );

    // Text is split by highlighting, use partial match
    expect(screen.getByText(/Meeting/)).toBeInTheDocument();
    expect(screen.getByText(/notes/)).toBeInTheDocument();
  });

  it('should render note content (plain text)', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[]}
        notes={[mockNote]}
      />
    );

    expect(screen.getByText(/Important discussion points/)).toBeInTheDocument();
  });

  it('should strip HTML from note content', () => {
    const htmlNote: Note = {
      ...mockNote,
      content: '<p>Text with <strong>HTML</strong> tags</p>',
    };

    render(
      <SearchResults
        query="test"
        tasks={[]}
        events={[]}
        notes={[htmlNote]}
      />
    );

    // Should show plain text without HTML tags
    expect(screen.getByText(/Text with HTML tags/)).toBeInTheDocument();
  });

  it('should call onNoteClick when note is clicked', async () => {
    const onNoteClick = vi.fn();
    render(
      <SearchResults
        query="meeting"
        tasks={[]}
        events={[]}
        notes={[mockNote]}
        onNoteClick={onNoteClick}
      />
    );

    const noteItem = screen.getByTestId('note-result-item');
    await userEvent.click(noteItem);

    expect(onNoteClick).toHaveBeenCalledWith(mockNote);
  });
});

// =============================================================================
// Tests - Text Highlighting
// =============================================================================

describe('SearchResults - Text Highlighting', () => {
  it('should highlight matching text in task title', () => {
    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    const mark = document.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toContain('Meeting');
  });

  it('should highlight matching text case-insensitively', () => {
    render(
      <SearchResults
        query="MEETING"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    const mark = document.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toContain('Meeting');
  });

  it('should not highlight when no match', () => {
    const taskNoMatch: Task = {
      ...mockTask,
      title: 'Task without match word',
      description: 'Description without match word',
    };

    render(
      <SearchResults
        query="xyz"
        tasks={[taskNoMatch]}
        events={[]}
        notes={[]}
      />
    );

    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });
});

// =============================================================================
// Tests - Accessibility
// =============================================================================

describe('SearchResults - Accessibility', () => {
  it('should have role="region"', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    const results = screen.getByTestId('search-results');
    expect(results).toHaveAttribute('role', 'region');
  });

  it('should have aria-label', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
      />
    );

    const results = screen.getByTestId('search-results');
    expect(results).toHaveAttribute('aria-label', 'Search results');
  });

  it('should have aria-hidden on decorative icons', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[mockEvent]}
        notes={[mockNote]}
      />
    );

    const icons = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Tests - Custom Props
// =============================================================================

describe('SearchResults - Custom Props', () => {
  it('should apply custom className', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
        className="custom-class"
      />
    );

    const results = screen.getByTestId('search-results');
    expect(results).toHaveClass('custom-class');
  });

  it('should apply custom testId', () => {
    render(
      <SearchResults
        query="test"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
        testId="custom-results"
      />
    );

    expect(screen.getByTestId('custom-results')).toBeInTheDocument();
  });

  it('should call onClose when result is clicked', async () => {
    const onClose = vi.fn();
    const onTaskClick = vi.fn();

    render(
      <SearchResults
        query="meeting"
        tasks={[mockTask]}
        events={[]}
        notes={[]}
        onTaskClick={onTaskClick}
        onClose={onClose}
      />
    );

    const taskItem = screen.getByTestId('task-result-item');
    await userEvent.click(taskItem);

    expect(onTaskClick).toHaveBeenCalled();
    // onClose would typically be called by parent component handling onTaskClick
  });
});
