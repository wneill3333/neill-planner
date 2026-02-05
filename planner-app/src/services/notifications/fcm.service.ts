/**
 * Firebase Cloud Messaging (FCM) Service
 *
 * Handles push notification setup, device token management,
 * and foreground message handling for the Neill Planner app.
 */

import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from 'firebase/messaging';
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { app, db } from '../firebase/config';
import type { DeviceToken, NotificationPermissionStatus, ReminderNotification } from '../../types';

// =============================================================================
// Constants
// =============================================================================

/** Firestore collection name for device tokens */
const DEVICE_TOKENS_COLLECTION = 'deviceTokens';

/** Key for storing device ID in localStorage */
const DEVICE_ID_KEY = 'neill-planner-device-id';

// =============================================================================
// State
// =============================================================================

/** Cached messaging instance */
let messagingInstance: Messaging | null = null;

/** Current FCM token */
let currentToken: string | null = null;

/** Message callback handlers */
const messageCallbacks: Set<(payload: MessagePayload) => void> = new Set();

/** Unsubscribe function for the FCM onMessage listener */
let onMessageUnsubscribe: (() => void) | null = null;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique device ID for this browser instance
 * Persisted in localStorage to identify this device across sessions
 */
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Get the current platform (web, android, ios)
 */
function getPlatform(): 'web' | 'android' | 'ios' {
  // For now, we're running as a web app
  // This can be extended for React Native/Capacitor later
  return 'web';
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize Firebase Cloud Messaging
 *
 * Must be called before using any other FCM functions.
 * Returns null if push notifications are not supported.
 */
export function initializeFCM(): Messaging | null {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return null;
  }

  if (messagingInstance) {
    return messagingInstance;
  }

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('Failed to initialize FCM:', error);
    return null;
  }
}

// =============================================================================
// Permission Management
// =============================================================================

/**
 * Get the current notification permission status
 */
export function getPermissionStatus(): NotificationPermissionStatus {
  if (!isPushSupported()) {
    return 'unsupported';
  }

  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the user
 *
 * @returns The permission status after the request
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isPushSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// =============================================================================
// Token Management
// =============================================================================

/**
 * Get the FCM device token
 *
 * This token is required to send push notifications to this device.
 * The VAPID key should be configured in environment variables.
 *
 * @returns The FCM token or null if not available
 */
export async function getDeviceToken(): Promise<string | null> {
  const messaging = initializeFCM();

  if (!messaging) {
    console.warn('FCM not initialized - cannot get device token');
    return null;
  }

  const permission = getPermissionStatus();

  if (permission !== 'granted') {
    console.warn('Notification permission not granted - cannot get device token');
    return null;
  }

  try {
    // VAPID key should be set in environment variables
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error('VAPID key not configured - push notifications will not work');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });

    if (token) {
      currentToken = token;
      console.log('FCM token obtained successfully');
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Save the device token to Firestore
 *
 * Stores the token associated with the user for sending push notifications.
 *
 * @param userId - The user ID to associate the token with
 * @param token - The FCM token to save
 */
export async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  if (!userId || !token) {
    throw new Error('userId and token are required');
  }

  const deviceId = getOrCreateDeviceId();
  const platform = getPlatform();
  const now = new Date();

  const tokenData: DeviceToken = {
    token,
    userId,
    platform,
    deviceId,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };

  try {
    // Use deviceId as the document ID to ensure uniqueness per device
    const docRef = doc(db, DEVICE_TOKENS_COLLECTION, deviceId);
    await setDoc(docRef, {
      ...tokenData,
      createdAt: Timestamp.fromDate(tokenData.createdAt),
      updatedAt: Timestamp.fromDate(tokenData.updatedAt),
    });

    console.log('Device token saved to Firestore');
  } catch (error) {
    console.error('Error saving device token:', error);
    throw new Error(`Failed to save device token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove the device token from Firestore
 *
 * Called when the user logs out or disables notifications.
 */
export async function removeTokenFromFirestore(): Promise<void> {
  const deviceId = getOrCreateDeviceId();

  try {
    const docRef = doc(db, DEVICE_TOKENS_COLLECTION, deviceId);
    await deleteDoc(docRef);

    currentToken = null;
    console.log('Device token removed from Firestore');
  } catch (error) {
    console.error('Error removing device token:', error);
    throw new Error(`Failed to remove device token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all active device tokens for a user
 *
 * Used by cloud functions to send notifications to all user devices.
 *
 * @param userId - The user ID to get tokens for
 * @returns Array of active device tokens
 */
export async function getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    const q = query(
      collection(db, DEVICE_TOKENS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        token: data.token,
        userId: data.userId,
        platform: data.platform,
        deviceId: data.deviceId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: data.isActive,
      };
    });
  } catch (error) {
    console.error('Error getting user device tokens:', error);
    throw new Error(`Failed to get device tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the current cached token
 */
export function getCurrentToken(): string | null {
  return currentToken;
}

// =============================================================================
// Message Handling
// =============================================================================

/**
 * Register a callback for foreground messages
 *
 * When the app is in the foreground, FCM messages are not automatically
 * displayed. Use this to show in-app notifications instead.
 *
 * @param callback - Function to call when a message is received
 * @returns Unsubscribe function
 */
export function onMessageReceived(callback: (payload: MessagePayload) => void): () => void {
  const messaging = initializeFCM();

  if (!messaging) {
    console.warn('FCM not initialized - cannot register message callback');
    return () => {};
  }

  // Add to our callback set
  messageCallbacks.add(callback);

  // Set up the onMessage listener once when first callback is registered
  if (messageCallbacks.size === 1 && !onMessageUnsubscribe) {
    onMessageUnsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Call all registered callbacks
      messageCallbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    });
  }

  // Return unsubscribe function that cleans up properly
  return () => {
    messageCallbacks.delete(callback);
    // Clean up Firebase listener if no more callbacks
    if (messageCallbacks.size === 0 && onMessageUnsubscribe) {
      onMessageUnsubscribe();
      onMessageUnsubscribe = null;
    }
  };
}

/**
 * Parse a FCM message payload into a ReminderNotification
 */
export function parseMessageToNotification(payload: MessagePayload): ReminderNotification | null {
  const data = payload.data;

  if (!data) {
    return null;
  }

  try {
    return {
      reminderId: data.reminderId || '',
      title: payload.notification?.title || data.title || 'Reminder',
      body: payload.notification?.body || data.body || '',
      itemType: (data.itemType as 'task' | 'event') || 'task',
      itemId: data.itemId || '',
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : new Date(),
      triggeredAt: new Date(),
      canSnooze: data.canSnooze !== 'false',
      isDismissed: false,
      priority: (data.priority as 'high' | 'medium' | 'low') || 'medium',
    };
  } catch (error) {
    console.error('Error parsing message payload:', error);
    return null;
  }
}

// =============================================================================
// Full Registration Flow
// =============================================================================

/**
 * Complete FCM registration flow
 *
 * Requests permission, gets the device token, and saves it to Firestore.
 * This is the main function to call to set up push notifications.
 *
 * @param userId - The user ID to register notifications for
 * @returns Object with permission status and token (if successful)
 */
export async function registerForPushNotifications(
  userId: string
): Promise<{ permissionStatus: NotificationPermissionStatus; token: string | null }> {
  // Request permission
  const permissionStatus = await requestNotificationPermission();

  if (permissionStatus !== 'granted') {
    return { permissionStatus, token: null };
  }

  // Get device token
  const token = await getDeviceToken();

  if (!token) {
    return { permissionStatus, token: null };
  }

  // Save to Firestore
  await saveTokenToFirestore(userId, token);

  return { permissionStatus, token };
}

/**
 * Unregister from push notifications
 *
 * Removes the device token from Firestore. Called on logout.
 */
export async function unregisterFromPushNotifications(): Promise<void> {
  await removeTokenFromFirestore();
}
