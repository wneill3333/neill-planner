/**
 * Input Validation Utilities
 *
 * Provides validation functions for user input to prevent:
 * - SQL/NoSQL injection
 * - XSS attacks
 * - Data corruption
 * - Invalid data formats
 */

import type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  PriorityLetter,
  TaskStatus,
} from '../types';

// =============================================================================
// Error Classes
// =============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// String Validation
// =============================================================================

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, 'INVALID_TYPE');
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} character${minLength === 1 ? '' : 's'}`,
      fieldName,
      'TOO_SHORT'
    );
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${maxLength} characters`,
      fieldName,
      'TOO_LONG'
    );
  }
}

/**
 * Sanitize string input - remove potentially dangerous characters
 * Note: This is defense in depth. Firebase SDK and Firestore rules are the primary protection.
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  let sanitized = value.trim();

  // Remove null bytes (can cause issues in some systems)
  sanitized = sanitized.replace(/\0/g, '');

  // Detect dangerous content (reject rather than sanitize)
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,  // Event handlers: onclick, onerror, onload, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new ValidationError(
        'Input contains potentially dangerous content',
        'value',
        'DANGEROUS_CONTENT'
      );
    }
  }

  return sanitized;
}

/**
 * Validate that a string contains no script tags or dangerous HTML
 */
export function validateNoScriptContent(value: string, fieldName: string): void {
  const dangerous = /<script|javascript:|onerror=|onclick=/i;

  if (dangerous.test(value)) {
    throw new ValidationError(
      `${fieldName} contains potentially dangerous content`,
      fieldName,
      'DANGEROUS_CONTENT'
    );
  }
}

// =============================================================================
// Task Validation
// =============================================================================

/**
 * Validate priority letter
 */
export function validatePriorityLetter(letter: unknown): asserts letter is PriorityLetter {
  const validLetters: PriorityLetter[] = ['A', 'B', 'C', 'D'];

  if (typeof letter !== 'string' || !validLetters.includes(letter as PriorityLetter)) {
    throw new ValidationError(
      'Priority letter must be A, B, C, or D',
      'priority.letter',
      'INVALID_PRIORITY'
    );
  }
}

/**
 * Validate priority number
 */
export function validatePriorityNumber(num: unknown): asserts num is number {
  if (typeof num !== 'number' || !Number.isInteger(num) || num < 1) {
    throw new ValidationError(
      'Priority number must be a positive integer',
      'priority.number',
      'INVALID_PRIORITY'
    );
  }
}

/**
 * Validate task status
 */
export function validateTaskStatus(status: unknown): asserts status is TaskStatus {
  const validStatuses: TaskStatus[] = ['in_progress', 'forward', 'complete', 'delete', 'delegate'];

  if (typeof status !== 'string' || !validStatuses.includes(status as TaskStatus)) {
    throw new ValidationError(
      'Invalid task status',
      'status',
      'INVALID_STATUS'
    );
  }
}

/**
 * Validate task time format (HH:MM)
 */
export function validateTaskTime(time: string | null): void {
  if (time === null) {
    return;
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

  if (!timeRegex.test(time)) {
    throw new ValidationError(
      'Scheduled time must be in HH:MM format (24-hour)',
      'scheduledTime',
      'INVALID_TIME_FORMAT'
    );
  }
}

/**
 * Validate CreateTaskInput
 */
export function validateCreateTaskInput(input: CreateTaskInput): void {
  // Validate title
  const title = sanitizeString(input.title);
  validateStringLength(title, 'Title', 1, 500);
  validateNoScriptContent(title, 'Title');

  // Validate description if provided
  if (input.description !== undefined && input.description !== '') {
    const description = sanitizeString(input.description);
    validateStringLength(description, 'Description', 0, 5000);
    validateNoScriptContent(description, 'Description');
  }

  // Validate priority
  validatePriorityLetter(input.priority.letter);
  if (input.priority.number !== undefined) {
    validatePriorityNumber(input.priority.number);
  }

  // Validate status if provided
  if (input.status !== undefined) {
    validateTaskStatus(input.status);
  }

  // Validate scheduled time if provided
  if (input.scheduledTime !== undefined) {
    validateTaskTime(input.scheduledTime);
  }

  // Validate categoryId if provided
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID must be a non-empty string', 'categoryId', 'INVALID_CATEGORY_ID');
    }
  }
}

/**
 * Validate UpdateTaskInput
 */
export function validateUpdateTaskInput(input: UpdateTaskInput): void {
  // Validate ID
  if (!input.id || typeof input.id !== 'string' || input.id.trim().length === 0) {
    throw new ValidationError('Task ID is required', 'id', 'MISSING_ID');
  }

  // Validate title if provided
  if (input.title !== undefined) {
    const title = sanitizeString(input.title);
    validateStringLength(title, 'Title', 1, 500);
    validateNoScriptContent(title, 'Title');
  }

  // Validate description if provided
  if (input.description !== undefined && input.description !== '') {
    const description = sanitizeString(input.description);
    validateStringLength(description, 'Description', 0, 5000);
    validateNoScriptContent(description, 'Description');
  }

  // Validate priority if provided
  if (input.priority !== undefined) {
    if (input.priority.letter !== undefined) {
      validatePriorityLetter(input.priority.letter);
    }
    if (input.priority.number !== undefined) {
      validatePriorityNumber(input.priority.number);
    }
  }

  // Validate status if provided
  if (input.status !== undefined) {
    validateTaskStatus(input.status);
  }

  // Validate scheduled time if provided
  if (input.scheduledTime !== undefined) {
    validateTaskTime(input.scheduledTime);
  }

  // Validate categoryId if provided
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID must be a non-empty string', 'categoryId', 'INVALID_CATEGORY_ID');
    }
  }
}

// =============================================================================
// Category Validation
// =============================================================================

/**
 * Validate hex color code
 */
export function validateColorCode(color: string): void {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

  if (!hexColorRegex.test(color)) {
    throw new ValidationError(
      'Color must be a valid hex color code (e.g., #FF0000)',
      'color',
      'INVALID_COLOR'
    );
  }
}

/**
 * Validate CreateCategoryInput
 */
export function validateCreateCategoryInput(input: CreateCategoryInput): void {
  // Validate name
  const name = sanitizeString(input.name);
  validateStringLength(name, 'Name', 1, 50);
  validateNoScriptContent(name, 'Name');

  // Validate color
  validateColorCode(input.color);

  // Validate sortOrder if provided
  if (input.sortOrder !== undefined) {
    if (typeof input.sortOrder !== 'number' || !Number.isInteger(input.sortOrder)) {
      throw new ValidationError('Sort order must be an integer', 'sortOrder', 'INVALID_SORT_ORDER');
    }
  }
}

/**
 * Validate UpdateCategoryInput
 */
export function validateUpdateCategoryInput(input: UpdateCategoryInput): void {
  // Validate ID
  if (!input.id || typeof input.id !== 'string' || input.id.trim().length === 0) {
    throw new ValidationError('Category ID is required', 'id', 'MISSING_ID');
  }

  // Validate name if provided
  if (input.name !== undefined) {
    const name = sanitizeString(input.name);
    validateStringLength(name, 'Name', 1, 50);
    validateNoScriptContent(name, 'Name');
  }

  // Validate color if provided
  if (input.color !== undefined) {
    validateColorCode(input.color);
  }

  // Validate sortOrder if provided
  if (input.sortOrder !== undefined) {
    if (typeof input.sortOrder !== 'number' || !Number.isInteger(input.sortOrder)) {
      throw new ValidationError('Sort order must be an integer', 'sortOrder', 'INVALID_SORT_ORDER');
    }
  }
}

// =============================================================================
// ID Validation
// =============================================================================

/**
 * Validate task ID
 */
export function validateTaskId(taskId: string, fieldName: string = 'taskId'): void {
  if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_TASK_ID'
    );
  }
  if (taskId.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'TASK_ID_TOO_LONG');
  }
}

/**
 * Validate category ID
 */
export function validateCategoryId(categoryId: string, fieldName: string = 'categoryId'): void {
  if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_CATEGORY_ID'
    );
  }
  if (categoryId.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'CATEGORY_ID_TOO_LONG');
  }
}

/**
 * Validate user ID
 */
export function validateUserId(userId: string, fieldName: string = 'userId'): void {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'MISSING_USER_ID');
  }

  // Firebase UIDs are 28 characters
  if (userId.length > 128) {
    throw new ValidationError(`${fieldName} is invalid`, fieldName, 'INVALID_USER_ID');
  }
}

// =============================================================================
// Date Validation
// =============================================================================

/**
 * Validate that a value is a valid Date object
 */
export function validateDate(date: unknown, fieldName: string): asserts date is Date {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`, fieldName, 'INVALID_DATE');
  }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): void {
  validateDate(startDate, 'startDate');
  validateDate(endDate, 'endDate');

  if (startDate > endDate) {
    throw new ValidationError(
      'Start date must be before or equal to end date',
      'dateRange',
      'INVALID_DATE_RANGE'
    );
  }
}
