/**
 * Firebase Configuration
 *
 * This file initializes Firebase services for the Neill Planner application.
 * Environment variables are used to keep sensitive configuration out of source code.
 *
 * Setup:
 * 1. Copy .env.example to .env.local
 * 2. Fill in your Firebase project values
 * 3. Never commit .env.local to version control
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase configuration object
 * Values are read from environment variables for security
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase app (singleton pattern)
 * Prevents re-initialization if already initialized
 */
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Authentication instance
 */
const auth: Auth = getAuth(app);

/**
 * Firestore Database instance
 */
const db: Firestore = getFirestore(app);

export { app, auth, db, firebaseConfig };
