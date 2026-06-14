import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          backgroundColor: '#F8F9FA',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#1B4332' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'Prayers',
          tabBarIcon: ({ color, size }) => <Ionicons name="moon" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'Quran',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="hadith"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => <Ionicons name="bulb" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="buddy"
        options={{
          title: 'Buddy',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}