"use client"

import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import * as Haptics from "expo-haptics"
import type React from "react"
import { useRef, useState } from "react"
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native"
import { PanGestureHandler, State, TapGestureHandler } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

const AssistiveTouchTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current

  // State
  const [isDragging, setIsDragging] = useState(false)

  const getIconName = (routeName: string, isFocused: boolean): string => {
    switch (routeName) {
      case "index":
        return isFocused ? "home" : "home-outline"
      case "orders":
        return isFocused ? "receipt" : "receipt-outline"
      case "settings":
        return isFocused ? "settings" : "settings-outline"
      default:
        return "help-circle-outline"
    }
  }

  // Pan gesture handler
  const onGestureEvent = Animated.event([{ nativeEvent: { translationX: translateX, translationY: translateY } }], {
    useNativeDriver: true,
  })

  const onHandlerStateChange = (event: any) => {
    const { state: gestureState, translationX: tx, translationY: ty, absoluteX, absoluteY } = event.nativeEvent

    if (gestureState === State.BEGAN) {
      setIsDragging(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // Slight scale up when dragging starts
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start()
    }

    if (gestureState === State.END || gestureState === State.CANCELLED) {
      setIsDragging(false)

      // Get current position
      const currentX = (translateX as any)._value
      const currentY = (translateY as any)._value

      // Calculate boundaries
      const tabSize = 80
      const padding = 20
      const minX = -width / 2 + tabSize / 2 + padding
      const maxX = width / 2 - tabSize / 2 - padding
      const minY = -height / 2 + tabSize / 2 + insets.top + padding
      const maxY = height / 2 - tabSize / 2 - insets.bottom - padding

      // Snap to edges (AssistiveTouch behavior)
      let finalX = currentX
      let finalY = currentY

      // Snap to left or right edge
      if (Math.abs(currentX - minX) < Math.abs(currentX - maxX)) {
        finalX = minX // Snap to left
      } else {
        finalX = maxX // Snap to right
      }

      // Keep Y within bounds but don't force to edges
      finalY = Math.max(minY, Math.min(maxY, currentY))

      // Animate to final position
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: finalX,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: finalY,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
      ]).start()

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }

  // Handle tab press
  const handleTabPress = (route: any, isFocused: boolean) => {
    if (isDragging) return

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    })

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      minPointers={1}
      maxPointers={1}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.tabBar, isDragging && styles.tabBarDragging]}>
          {/* Current active tab in center */}
          <View style={styles.centerTab}>
            <View style={styles.activeIconContainer}>
              <Ionicons name={getIconName(state.routes[state.index].name, true) as any} size={24} color="#FFFFFF" />
            </View>
          </View>

          {/* Other tabs around the edge */}
          <View style={styles.edgeTabs}>
            {state.routes.map((route, index) => {
              if (index === state.index) return null // Skip active tab

              const isFocused = state.index === index
              const angle = index * 120 - 60 // Distribute around circle

              return (
                <TapGestureHandler
                  key={route.key}
                  onHandlerStateChange={(event) => {
                    if (event.nativeEvent.state === State.END && !isDragging) {
                      handleTabPress(route, isFocused)
                    }
                  }}
                >
                  <Animated.View
                    style={[
                      styles.edgeTab,
                      {
                        transform: [{ rotate: `${angle}deg` }, { translateY: -35 }, { rotate: `-${angle}deg` }],
                      },
                    ]}
                  >
                    <TouchableOpacity style={styles.edgeTabButton} activeOpacity={0.7} disabled={isDragging}>
                      <Ionicons name={getIconName(route.name, false) as any} size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </Animated.View>
                </TapGestureHandler>
              )
            })}
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  tabBar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  tabBarDragging: {
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  centerTab: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  edgeTabs: {
    position: "absolute",
    width: 80,
    height: 80,
  },
  edgeTab: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -15,
  },
  edgeTabButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
})

export default AssistiveTouchTabBar
