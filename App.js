import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from './lib/supabase';
import { ThemeProvider, useTheme } from './lib/theme';
import { registerForPushNotifications } from './lib/notifications';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import FlowerScreen from './screens/FlowerScreen';
import PartnerScreen from './screens/PartnerScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Kalp: 'heart',
  Partnerim: 'sparkles',
  Çiçek: 'flower',
  Ayarlar: 'settings',
};

function AppShell() {
  const { scheme, colors } = useTheme();
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      registerForPushNotifications();
    }
  }, [session]);

  if (checkingSession) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      text: colors.textPrimary,
      primary: colors.accent,
    },
  };

  if (!session) {
    return (
      <>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AuthScreen />
      </>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`}
              size={size}
              color={color}
            />
          ),
        })}
      >
        <Tab.Screen name="Kalp" component={HomeScreen} />
        <Tab.Screen name="Partnerim" component={PartnerScreen} />
        <Tab.Screen name="Çiçek" component={FlowerScreen} />
        <Tab.Screen name="Ayarlar" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
