/**
 * Allowed Users Service
 *
 * Manages the email whitelist for access control.
 * Collection: allowedUsers/{email} (email as doc ID for O(1) lookup)
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type { AllowedUser, AddAllowedUserInput, UserRole } from '../../types';
import { INITIAL_ADMIN_EMAIL } from '../../types';

/** Firestore collection name */
const ALLOWED_USERS_COLLECTION = 'allowedUsers';

// =============================================================================
// Converters
// =============================================================================

function firestoreToAllowedUser(data: DocumentData): AllowedUser {
  return {
    email: data.email,
    role: data.role,
    displayName: data.displayName ?? undefined,
    addedBy: data.addedBy,
    addedAt: data.addedAt?.toDate() ?? new Date(),
    lastLoginAt: data.lastLoginAt?.toDate() ?? null,
  };
}

function allowedUserToFirestore(user: AllowedUser): DocumentData {
  return {
    email: user.email,
    role: user.role,
    ...(user.displayName && { displayName: user.displayName }),
    addedBy: user.addedBy,
    addedAt: Timestamp.fromDate(user.addedAt),
    lastLoginAt: user.lastLoginAt ? Timestamp.fromDate(user.lastLoginAt) : null,
  };
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Check if an email is in the whitelist
 * @returns The AllowedUser entry if found, null otherwise
 */
export async function checkEmailAllowed(email: string): Promise<AllowedUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return firestoreToAllowedUser(docSnap.data());
  } catch (error) {
    console.error('Error checking email allowlist:', error);
    throw new Error(`Failed to check email allowlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all allowed users (for admin panel)
 */
export async function getAllAllowedUsers(): Promise<AllowedUser[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ALLOWED_USERS_COLLECTION));
    return querySnapshot.docs.map((doc) => firestoreToAllowedUser(doc.data()));
  } catch (error) {
    console.error('Error fetching allowed users:', error);
    throw new Error(`Failed to fetch allowed users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add a new email to the whitelist
 */
export async function addAllowedUser(
  input: AddAllowedUserInput,
  addedByUserId: string
): Promise<AllowedUser> {
  const normalizedEmail = input.email.toLowerCase().trim();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('A valid email address is required');
  }

  try {
    // Check if already exists
    const existing = await checkEmailAllowed(normalizedEmail);
    if (existing) {
      throw new Error(`${normalizedEmail} is already in the allowed users list`);
    }

    const allowedUser: AllowedUser = {
      email: normalizedEmail,
      role: input.role,
      displayName: input.displayName,
      addedBy: addedByUserId,
      addedAt: new Date(),
      lastLoginAt: null,
    };

    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);
    await setDoc(docRef, allowedUserToFirestore(allowedUser));

    return allowedUser;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already in the allowed')) {
      throw error;
    }
    console.error('Error adding allowed user:', error);
    throw new Error(`Failed to add allowed user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove an email from the whitelist
 */
export async function removeAllowedUser(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing allowed user:', error);
    throw new Error(`Failed to remove allowed user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update a user's role in the whitelist
 */
export async function updateAllowedUserRole(
  email: string,
  newRole: UserRole
): Promise<AllowedUser> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`${normalizedEmail} not found in allowed users`);
    }

    const existing = firestoreToAllowedUser(docSnap.data());
    const updated: AllowedUser = { ...existing, role: newRole };

    await setDoc(docRef, allowedUserToFirestore(updated));

    return updated;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    console.error('Error updating allowed user role:', error);
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Seed the initial admin user (idempotent)
 * Creates the initial admin entry if it doesn't exist.
 */
export async function seedInitialAdmin(): Promise<void> {
  try {
    const existing = await checkEmailAllowed(INITIAL_ADMIN_EMAIL);
    if (existing) {
      return; // Already seeded
    }

    const adminEntry: AllowedUser = {
      email: INITIAL_ADMIN_EMAIL.toLowerCase(),
      role: 'admin',
      displayName: 'William Neill',
      addedBy: 'system',
      addedAt: new Date(),
      lastLoginAt: null,
    };

    const docRef = doc(db, ALLOWED_USERS_COLLECTION, INITIAL_ADMIN_EMAIL.toLowerCase());
    await setDoc(docRef, allowedUserToFirestore(adminEntry));
  } catch (error) {
    // Non-fatal — log and continue
    console.error('Error seeding initial admin:', error);
  }
}

/**
 * Update last login timestamp for an allowed user
 */
export async function updateAllowedUserLastLogin(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const docRef = doc(db, ALLOWED_USERS_COLLECTION, normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return; // Silently skip if not found
    }

    const existing = firestoreToAllowedUser(docSnap.data());
    const updated: AllowedUser = { ...existing, lastLoginAt: new Date() };

    await setDoc(docRef, allowedUserToFirestore(updated));
  } catch (error) {
    // Non-fatal — log and continue
    console.error('Error updating last login:', error);
  }
}
