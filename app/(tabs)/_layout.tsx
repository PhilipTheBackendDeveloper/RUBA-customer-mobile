"use client"

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat"
import { Tabs } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import CustomTabBar from "../components/CustomTabBar"

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync()

export default function AppLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  })

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarAccessibilityLabel: "Home",
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            tabBarAccessibilityLabel: "Orders",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarAccessibilityLabel: "Settings",
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  )
}
