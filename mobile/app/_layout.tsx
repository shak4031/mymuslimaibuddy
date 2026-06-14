import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';

// API base URL - will be configured via env or railway URL
export const API_BASE = 'https://mymuslimaibuddy-production.up.railway.app/api/v1';
export const getDeviceId = () => 'default-device'; // Will be replaced with secure device ID

export default function RootLayout() {
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