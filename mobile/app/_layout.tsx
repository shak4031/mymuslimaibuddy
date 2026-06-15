import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { requestPermissions, scheduleDailyInspiration, addNotificationResponseListener } from '../src/services/notifications';
import { router } from 'expo-router';

// API base URL - will be configured via env or railway URL
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://mymuslimaibuddy-production.up.railway.app/api/v1';
export const getDeviceId = () => 'default-device'; // Will be replaced with expo-device ID

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      // Request notification permissions
      const granted = await requestPermissions();
      if (granted) {
        // Schedule daily inspiration notification (9 AM)
        await scheduleDailyInspiration(9, 0);
        console.log('[Notifications] Daily inspiration scheduled');
      }

      // Handle notification taps — navigate to the right screen
      const subscription = addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen) {
          router.push(`/${data.screen}`);
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
      </Stack>
    </>
  );
}