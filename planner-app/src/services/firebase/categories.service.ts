/**
 * Categories Service
 *
 * Firestore service layer for Category CRUD operations.
 * Handles data conversion between app types and Firestore documents.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types';
import {
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
  validateUserId,
  validateCategoryId,
  sanitizeString,
  ValidationError,
} from '../../utils/validation';

/** Firestore collection name for categories */
const CATEGORIES_COLLECTION = 'categories';

/**
 * Convert a Category object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function categoryToFirestore(category: Partial<Category>): DocumentData {
  const data: DocumentData = { ...category };

  // Convert Date fields to Timestamps
  if (category.createdAt) {
    data.createdAt = Timestamp.fromDate(category.createdAt);
  }
  if (category.updatedAt) {
    data.updatedAt = Timestamp.fromDate(category.updatedAt);
  }

  return data;
}

/**
 * Convert a Firestore document to a Category object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToCategory(doc: QueryDocumentSnapshot<DocumentData>): Category {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    color: data.color,
    sortOrder: data.sortOrder ?? 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

/**
 * Create a new category in Firestore
 * @param input - Category creation input (without auto-generated fields)
 * @param userId - The ID of the user creating the category
 * @returns The created category with generated ID
 * @throws {ValidationError} If input validation fails
 */
export async function createCategory(input: CreateCategoryInput, userId: string): Promise<Category> {
  // Validate user ID
  validateUserId(userId);

  // Validate input
  validateCreateCategoryInput(input);

  const now = new Date();

  // Sanitize string inputs
  const sanitizedName = sanitizeString(input.name);

  const categoryData: Omit<Category, 'id'> = {
    userId,
    name: sanitizedName,
    color: input.color,
    sortOrder: input.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(
      collection(db, CATEGORIES_COLLECTION),
      categoryToFirestore(categoryData)
    );

    return {
      ...categoryData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating category:', error);
    throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single category by ID
 * @param categoryId - The ID of the category to retrieve
 * @param userId - The ID of the user requesting the category
 * @returns The category if found, null otherwise
 * @throws {ValidationError} If categoryId is invalid or user is unauthorized
 */
export async function getCategory(categoryId: string, userId: string): Promise<Category | null> {
  validateCategoryId(categoryId);
  validateUserId(userId);

  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const category = firestoreToCategory(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (category.userId !== userId) {
      throw new ValidationError('Unauthorized access to category', 'categoryId', 'UNAUTHORIZED');
    }

    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all categories for a user
 * @param userId - The user's ID
 * @returns Array of categories ordered by sortOrder
 * @throws {ValidationError} If userId is invalid
 */
export async function getCategories(userId: string): Promise<Category[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('userId', '==', userId),
      orderBy('sortOrder'),
      orderBy('name')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToCategory);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing category
 * @param input - Update input with category ID and fields to update
 * @param userId - The ID of the user updating the category
 * @returns The updated category
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateCategory(input: UpdateCategoryInput, userId: string): Promise<Category> {
  // Validate input
  validateUpdateCategoryInput(input);
  validateUserId(userId);

  const { id, name, ...updates } = input;

  try {
    // First, verify ownership
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Category not found', 'id', 'NOT_FOUND');
    }

    const existingCategory = firestoreToCategory(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingCategory.userId !== userId) {
      throw new ValidationError('Unauthorized access to category', 'id', 'UNAUTHORIZED');
    }

    // Sanitize name if provided
    const updateData = categoryToFirestore({
      ...updates,
      ...(name !== undefined && { name: sanitizeString(name) }),
      updatedAt: new Date(),
    });

    await updateDoc(docRef, updateData);

    // Return merged local object instead of re-fetching
    return {
      ...existingCategory,
      ...(name !== undefined && { name: sanitizeString(name) }),
      ...updates,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete a category from Firestore
 * @param categoryId - The ID of the category to delete
 * @param userId - The ID of the user deleting the category
 * @throws {ValidationError} If categoryId is invalid or user is unauthorized
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  validateCategoryId(categoryId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Category not found', 'categoryId', 'NOT_FOUND');
    }

    const category = firestoreToCategory(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (category.userId !== userId) {
      throw new ValidationError('Unauthorized access to category', 'categoryId', 'UNAUTHORIZED');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get category count for a user
 * @param userId - The user's ID
 * @returns The number of categories the user has
 * @throws {ValidationError} If userId is invalid
 */
export async function getCategoryCount(userId: string): Promise<number> {
  validateUserId(userId);

  try {
    const categories = await getCategories(userId);
    return categories.length;
  } catch (error) {
    console.error('Error getting category count:', error);
    throw new Error(`Failed to get category count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a category name already exists for a user
 * @param userId - The user's ID
 * @param name - The category name to check
 * @param excludeId - Optional category ID to exclude (for updates)
 * @returns true if the name exists, false otherwise
 * @throws {ValidationError} If inputs are invalid
 */
export async function categoryNameExists(
  userId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  validateUserId(userId);

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Category name is required', 'name', 'MISSING_NAME');
  }

  try {
    const categories = await getCategories(userId);
    return categories.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== excludeId
    );
  } catch (error) {
    console.error('Error checking category name exists:', error);
    throw new Error(`Failed to check category name: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch update category sort orders
 * @param updates - Array of { id, sortOrder } updates
 * @param userId - The user's ID for authorization
 * @throws {ValidationError} If userId is invalid or user is unauthorized
 */
export async function batchUpdateCategories(
  updates: Array<{ id: string; sortOrder: number }>,
  userId: string
): Promise<void> {
  validateUserId(userId);

  if (!updates || updates.length === 0) {
    return;
  }

  // Import writeBatch dynamically to use Firestore batch writes
  const { writeBatch } = await import('firebase/firestore');

  try {
    const batch = writeBatch(db);
    const now = new Date();

    for (const update of updates) {
      validateCategoryId(update.id);

      const docRef = doc(db, CATEGORIES_COLLECTION, update.id);

      // Note: We trust the caller has verified ownership since this is called
      // from a thunk that already validated the user owns these categories
      batch.update(docRef, {
        sortOrder: update.sortOrder,
        updatedAt: Timestamp.fromDate(now),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error batch updating categories:', error);
    throw new Error(`Failed to update category order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
