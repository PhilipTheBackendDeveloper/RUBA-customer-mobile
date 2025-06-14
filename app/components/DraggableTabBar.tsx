"use client"

import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import * as Haptics from "expo-haptics"
import type React from "react"
import { useRef, useState } from "react"
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native"
import { PanGestureHandler, State } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

interface Position {
  x: number
  y: number
}

const DraggableTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()

  // Animation values for position
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  // Track current position
  const [currentPosition, setCurrentPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Gesture state
  const lastOffset = useRef<Position>({ x: 0, y: 0 })

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

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true },
  )

  const onHandlerStateChange = (event: any) => {
    const { state: gestureState, translationX: tx, translationY: ty } = event.nativeEvent

    if (gestureState === State.BEGAN) {
      setIsDragging(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // Scale up and reduce opacity when dragging starts
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }

    if (gestureState === State.END || gestureState === State.CANCELLED) {
      setIsDragging(false)

      // Calculate final position
      const finalX = lastOffset.current.x + tx
      const finalY = lastOffset.current.y + ty

      // Define boundaries
      const tabBarWidth = width * 0.85
      const tabBarHeight = 70
      const minX = -(width - tabBarWidth) / 2
      const maxX = (width - tabBarWidth) / 2
      const minY = -(height - tabBarHeight - insets.bottom - 40) // 40 for some padding from top
      const maxY = 0 // Current bottom position

      // Clamp to boundaries
      const clampedX = Math.max(minX, Math.min(maxX, finalX))
      const clampedY = Math.max(minY, Math.min(maxY, finalY))

      // Snap to edges for better UX
      let snappedX = clampedX
      let snappedY = clampedY

      // Snap to left/right edges if close
      if (Math.abs(clampedX - minX) < 30) {
        snappedX = minX
      } else if (Math.abs(clampedX - maxX) < 30) {
        snappedX = maxX
      } else if (Math.abs(clampedX) < 30) {
        snappedX = 0 // Snap to center
      }

      // Snap to bottom if close
      if (Math.abs(clampedY) < 50) {
        snappedY = 0
      }

      // Update stored position
      lastOffset.current = { x: snappedX, y: snappedY }
      setCurrentPosition({ x: snappedX, y: snappedY })

      // Animate to final position
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: snappedX,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: snappedY,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      // Haptic feedback for snap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }

  const handleTabPress = (route: any, isFocused: boolean) => {
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
            paddingBottom: insets.bottom,
            transform: [{ translateX }, { translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <View style={[styles.tabBar, isDragging && styles.tabBarDragging]}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator}>
            <View style={styles.dragHandle} />
          </View>

          {/* Tab buttons */}
          <View style={styles.tabButtonsContainer}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key]
              const isFocused = state.index === index

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? ""}
                  onPress={() => handleTabPress(route, isFocused)}
                  style={styles.tabButton}
                  activeOpacity={0.7}
                  disabled={isDragging}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isFocused ? styles.activeIconContainer : styles.inactiveIconContainer,
                    ]}
                  >
                    <Ionicons
                      name={getIconName(route.name, isFocused) as any}
                      size={22}
                      color={isFocused ? "#FFFFFF" : "#6B7280"}
                    />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Position indicator */}
          {isDragging && (
            <View style={styles.positionIndicator}>
              <Ionicons name="move" size={16} color="#007BFF" />
            </View>
          )}
        </View>

        {/* Floating action hint */}
        {!isDragging && currentPosition.x === 0 && currentPosition.y === 0 && (
          <Animated.View style={styles.hintContainer}>
            <View style={styles.hint}>
              <Ionicons name="hand-left" size={12} color="#6B7280" />
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </PanGestureHandler>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    width: width * 0.85,
    minHeight: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.1)",
  },
  tabBarDragging: {
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderColor: "rgba(0, 123, 255, 0.3)",
  },
  dragIndicator: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    zIndex: 1,
  },
  dragHandle: {
    width: 30,
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
  tabButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconContainer: {
    backgroundColor: "#007BFF",
    shadowColor: "#007BFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  inactiveIconContainer: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  positionIndicator: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hintContainer: {
    position: "absolute",
    top: -8,
    right: 8,
  },
  hint: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
})

export default DraggableTabBar
