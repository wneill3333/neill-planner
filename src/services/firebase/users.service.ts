/**
 * Users Service
 *
 * Firestore service layer for User CRUD operations.
 * Handles user profile and settings management.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type { User, UserSettings, UpdateUserSettingsInput } from '../../types';
import { DEFAULT_USER_SETTINGS } from '../../types';

/** Firestore collection name for users */
const USERS_COLLECTION = 'users';

/** Firestore collection name for user settings */
const USER_SETTINGS_COLLECTION = 'userSettings';

/**
 * Firebase User type (simplified for our needs)
 */
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Convert a User object to Firestore document format
 */
function userToFirestore(user: Omit<User, 'id'>): DocumentData {
  return {
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    googleCalendarConnected: user.googleCalendarConnected,
    createdAt: Timestamp.fromDate(user.createdAt),
    lastLoginAt: Timestamp.fromDate(user.lastLoginAt),
  };
}

/**
 * Convert a Firestore document to a User object
 */
function firestoreToUser(id: string, data: DocumentData): User {
  return {
    id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    googleCalendarConnected: data.googleCalendarConnected ?? false,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    lastLoginAt: data.lastLoginAt?.toDate() ?? new Date(),
  };
}

/**
 * Convert UserSettings to Firestore document format
 */
function settingsToFirestore(settings: UserSettings): DocumentData {
  return {
    userId: settings.userId,
    theme: settings.theme,
    fontSize: settings.fontSize,
    defaultPriorityLetter: settings.defaultPriorityLetter,
    defaultReminderMinutes: settings.defaultReminderMinutes,
    timezone: settings.timezone,
    weekStartsOn: settings.weekStartsOn,
    notifications: settings.notifications,
    googleCalendarSyncEnabled: settings.googleCalendarSyncEnabled,
    platform: settings.platform,
  };
}

/**
 * Convert Firestore document to UserSettings
 */
function firestoreToSettings(data: DocumentData): UserSettings {
  return {
    userId: data.userId,
    theme: data.theme ?? DEFAULT_USER_SETTINGS.theme,
    fontSize: data.fontSize ?? DEFAULT_USER_SETTINGS.fontSize,
    defaultPriorityLetter: data.defaultPriorityLetter ?? DEFAULT_USER_SETTINGS.defaultPriorityLetter,
    defaultReminderMinutes: data.defaultReminderMinutes ?? DEFAULT_USER_SETTINGS.defaultReminderMinutes,
    timezone: data.timezone ?? DEFAULT_USER_SETTINGS.timezone,
    weekStartsOn: data.weekStartsOn ?? DEFAULT_USER_SETTINGS.weekStartsOn,
    notifications: data.notifications ?? DEFAULT_USER_SETTINGS.notifications,
    googleCalendarSyncEnabled: data.googleCalendarSyncEnabled ?? DEFAULT_USER_SETTINGS.googleCalendarSyncEnabled,
    platform: data.platform ?? DEFAULT_USER_SETTINGS.platform,
  };
}

/**
 * Get a user by ID
 * @param userId - The user's ID (Firebase Auth UID)
 * @returns The user if found, null otherwise
 */
export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return firestoreToUser(docSnap.id, docSnap.data());
}

/**
 * Create a new user from Firebase Auth user
 * @param firebaseUser - The Firebase Auth user object
 * @returns The created user
 */
export async function createUser(firebaseUser: FirebaseUser): Promise<User> {
  const now = new Date();

  const userData: Omit<User, 'id'> = {
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'User',
    role: 'standard', // Default role for new users
    googleCalendarConnected: false,
    createdAt: now,
    lastLoginAt: now,
  };

  const docRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  await setDoc(docRef, userToFirestore(userData));

  // Also create default settings
  await createDefaultSettings(firebaseUser.uid);

  return {
    id: firebaseUser.uid,
    ...userData,
  };
}

/**
 * Create default settings for a new user
 * @param userId - The user's ID
 */
async function createDefaultSettings(userId: string): Promise<void> {
  const settings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    userId,
  };

  const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  await setDoc(docRef, settingsToFirestore(settings));
}

/**
 * Update the user's last login timestamp
 * @param userId - The user's ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(docRef, {
    lastLoginAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * Get user settings
 * @param userId - The user's ID
 * @returns The user settings if found, null otherwise
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return firestoreToSettings(docSnap.data());
}

/**
 * Update user settings
 * @param userId - The user's ID
 * @param updates - Partial settings to update
 * @returns The updated settings
 */
export async function updateUserSettings(
  userId: string,
  updates: UpdateUserSettingsInput
): Promise<UserSettings> {
  const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);

  // Build update object, handling nested notifications
  const updateData: DocumentData = { ...updates };
  if (updates.notifications) {
    // Merge with existing notifications rather than replace
    const existing = await getUserSettings(userId);
    updateData.notifications = {
      ...(existing?.notifications ?? DEFAULT_USER_SETTINGS.notifications),
      ...updates.notifications,
    };
  }

  await updateDoc(docRef, updateData);

  const updatedSettings = await getUserSettings(userId);
  if (!updatedSettings) {
    throw new Error(`Settings for user ${userId} not found after update`);
  }

  return updatedSettings;
}

/**
 * Get or create a user (used during authentication)
 * @param firebaseUser - The Firebase Auth user
 * @returns The existing or newly created user
 */
export async function getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
  const existingUser = await getUser(firebaseUser.uid);

  if (existingUser) {
    // Update last login
    await updateLastLogin(firebaseUser.uid);
    return {
      ...existingUser,
      lastLoginAt: new Date(),
    };
  }

  // Create new user
  return createUser(firebaseUser);
}
