/**
 * Notifications Services Index
 *
 * Central export point for notification-related services.
 */

// FCM Service exports
export {
  initializeFCM,
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getDeviceToken,
  saveTokenToFirestore,
  removeTokenFromFirestore,
  getUserDeviceTokens,
  getCurrentToken,
  onMessageReceived,
  parseMessageToNotification,
  registerForPushNotifications,
  unregisterFromPushNotifications,
} from './fcm.service';
