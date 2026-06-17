import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  requestPermissions,
  registerNotificationCategories,
  addNotificationResponseListener,
  handleNotificationResponse,
  scheduleEveningReflection,
} from '../src/services/notifications';
import { api } from '../src/services/api';
import { router } from 'expo-router';

// API base URL - will be configured via env or railway URL
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://mymuslimaibuddy-production.up.railway.app/api/v1';
export const getDeviceId = () => 'default-device'; // Will be replaced with expo-device ID

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      // Register device on the backend (so prayer APIs don't fail with "User not found")
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await api.registerDevice(getDeviceId(), tz);
        console.log('[Layout] Device registered');
      } catch (e) {
        console.log('[Layout] Device registration failed (will retry on API call)');
      }

      // Request notification permissions
      const granted = await requestPermissions();
      if (granted) {
        // Register action buttons (Mark Prayed, Snooze, Talk, etc.)
        await registerNotificationCategories();

        // Schedule evening reflection
        await scheduleEveningReflection(getDeviceId(), 0);
        console.log('[Layout-v2] Notification categories registered');
      }

      // Handle notification taps and action buttons
      const subscription = addNotificationResponseListener(async (response) => {
        const screen = await handleNotificationResponse(response);
        if (screen) {
          router.push(screen);
        }
      });

      return () => subscription.remove();
    }

    init();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1B4332' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="growth"
          options={{
            title: 'My Growth',
            headerStyle: { backgroundColor: '#1B4332' },
          }}
        />
      </Stack>
    </>
  );
}