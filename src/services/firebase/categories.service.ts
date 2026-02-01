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
 */
export async function createCategory(input: CreateCategoryInput, userId: string): Promise<Category> {
  const now = new Date();

  const categoryData: Omit<Category, 'id'> = {
    userId,
    name: input.name,
    color: input.color,
    sortOrder: input.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(
    collection(db, CATEGORIES_COLLECTION),
    categoryToFirestore(categoryData)
  );

  return {
    ...categoryData,
    id: docRef.id,
  };
}

/**
 * Get a single category by ID
 * @param categoryId - The ID of the category to retrieve
 * @returns The category if found, null otherwise
 */
export async function getCategory(categoryId: string): Promise<Category | null> {
  const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return firestoreToCategory(docSnap as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Get all categories for a user
 * @param userId - The user's ID
 * @returns Array of categories ordered by sortOrder
 */
export async function getCategories(userId: string): Promise<Category[]> {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    where('userId', '==', userId),
    orderBy('sortOrder'),
    orderBy('name')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(firestoreToCategory);
}

/**
 * Update an existing category
 * @param input - Update input with category ID and fields to update
 * @returns The updated category
 */
export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  const { id, ...updates } = input;
  const docRef = doc(db, CATEGORIES_COLLECTION, id);

  const updateData = categoryToFirestore({
    ...updates,
    updatedAt: new Date(),
  });

  await updateDoc(docRef, updateData);

  const updatedCategory = await getCategory(id);
  if (!updatedCategory) {
    throw new Error(`Category ${id} not found after update`);
  }

  return updatedCategory;
}

/**
 * Permanently delete a category from Firestore
 * @param categoryId - The ID of the category to delete
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
  await deleteDoc(docRef);
}

/**
 * Get category count for a user
 * @param userId - The user's ID
 * @returns The number of categories the user has
 */
export async function getCategoryCount(userId: string): Promise<number> {
  const categories = await getCategories(userId);
  return categories.length;
}

/**
 * Check if a category name already exists for a user
 * @param userId - The user's ID
 * @param name - The category name to check
 * @param excludeId - Optional category ID to exclude (for updates)
 * @returns true if the name exists, false otherwise
 */
export async function categoryNameExists(
  userId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  const categories = await getCategories(userId);
  return categories.some(
    (cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== excludeId
  );
}
