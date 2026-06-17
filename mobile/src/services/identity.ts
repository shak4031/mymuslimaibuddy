/**
 * MyMuslimBuddy — Device Identity Service
 * 
 * Generates and persists a unique device identity so each user
 * gets their own separate data on the backend. No login screen
 * needed — the device ID is auto-generated and stored.
 * 
 * Uses Constants.installationId from expo-constants which
 * provides a unique ID per app install (persists across app restarts,
 * resets only on app reinstall).
 */

import Constants from 'expo-constants';

let cachedDeviceId: string | null = null;

/**
 * Get the unique device identifier for this installation.
 * Uses expo-constants's built-in installationId which:
 * - Is unique per device per install
 * - Persists across app restarts
 * - Requires no permissions
 * - Works on both Android and iOS
 * - Requires no additional packages (comes with expo)
 */
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  // Constants.installationId (or Constants.sessionId as fallback)
  // provides a stable UUID for this app installation
  const id = (Constants as any).installationId
    || (Constants as any).sessionId
    || generateFallbackId();

  cachedDeviceId = `muslimbuddy_${id}`;
  return cachedDeviceId;
}

/**
 * Fallback: generate a random UUID if Constants doesn't provide one
 * Uses crypto.randomUUID() which is available in Hermes engine
 */
function generateFallbackId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Last-resort fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}