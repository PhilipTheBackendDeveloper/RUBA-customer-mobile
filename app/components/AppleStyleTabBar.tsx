"use client"

import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import * as Haptics from "expo-haptics"
import type React from "react"
import { useRef, useState } from "react"
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { LongPressGestureHandler, PanGestureHandler, State, TapGestureHandler } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

interface Position {
  x: number
  y: number
}

const AppleStyleTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()

  // Refs for gesture handlers
  const longPressRef = useRef(null)
  const panRef = useRef(null)
  const tapRef = useRef(null)

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const dragModeOpacity = useRef(new Animated.Value(0)).current

  // State management
  const [isDragMode, setIsDragMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
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

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case "index":
        return "Home"
      case "orders":
        return "Orders"
      case "settings":
        return "Settings"
      default:
        return "Tab"
    }
  }

  // Handle long press to enter drag mode
  const onLongPressStateChange = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setIsDragMode(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // Visual feedback for drag mode
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.timing(dragModeOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  // Handle pan gesture (only active in drag mode)
  const onPanGestureEvent = Animated.event(
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

  const onPanStateChange = (event: any) => {
    const { state: gestureState, translationX: tx, translationY: ty } = event.nativeEvent

    if (gestureState === State.ACTIVE && isDragMode) {
      setIsDragging(true)
    }

    if (gestureState === State.END || gestureState === State.CANCELLED) {
      if (isDragMode && isDragging) {
        // Calculate final position
        const finalX = lastOffset.current.x + tx
        const finalY = lastOffset.current.y + ty

        // Define boundaries
        const tabBarWidth = width * 0.8
        const tabBarHeight = 80
        const minX = -(width - tabBarWidth) / 2
        const maxX = (width - tabBarWidth) / 2
        const minY = -(height - tabBarHeight - insets.bottom - 60)
        const maxY = 0

        // Clamp to boundaries
        let clampedX = Math.max(minX, Math.min(maxX, finalX))
        let clampedY = Math.max(minY, Math.min(maxY, finalY))

        // Smart snapping
        const snapThreshold = 40
        if (Math.abs(clampedX) < snapThreshold) clampedX = 0 // Center
        if (Math.abs(clampedY) < snapThreshold) clampedY = 0 // Bottom

        // Update position
        lastOffset.current = { x: clampedX, y: clampedY }

        // Animate to final position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: clampedX,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: clampedY,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }),
        ]).start()

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }

      // Exit drag mode
      setIsDragMode(false)
      setIsDragging(false)

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.timing(dragModeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  // Handle normal tab press
  const handleTabPress = (route: any, isFocused: boolean) => {
    if (isDragMode || isDragging) return

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
    <LongPressGestureHandler
      ref={longPressRef}
      onHandlerStateChange={onLongPressStateChange}
      minDurationMs={500}
      maxDist={10}
    >
      <Animated.View>
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}
          enabled={isDragMode}
          simultaneousHandlers={longPressRef}
        >
          <Animated.View
            style={[
              styles.container,
              {
                paddingBottom: insets.bottom,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          >
            {/* Drag Mode Overlay */}
            <Animated.View style={[styles.dragModeOverlay, { opacity: dragModeOpacity }]} pointerEvents="none">
              <View style={styles.dragModeIndicator}>
                <Ionicons name="move" size={16} color="#007BFF" />
                <Text style={styles.dragModeText}>Drag to move</Text>
              </View>
            </Animated.View>

            <View style={[styles.tabBar, isDragMode && styles.tabBarDragMode, isDragging && styles.tabBarDragging]}>
              {/* Drag Handle (visible in drag mode) */}
              <Animated.View style={[styles.dragHandle, { opacity: dragModeOpacity }]}>
                <View style={styles.dragHandleBar} />
              </Animated.View>

              {/* Tab Buttons */}
              <View style={styles.tabButtonsContainer}>
                {state.routes.map((route, index) => {
                  const { options } = descriptors[route.key]
                  const isFocused = state.index === index

                  return (
                    <TapGestureHandler
                      key={route.key}
                      ref={tapRef}
                      onHandlerStateChange={(event) => {
                        if (event.nativeEvent.state === State.END) {
                          handleTabPress(route, isFocused)
                        }
                      }}
                      enabled={!isDragMode && !isDragging}
                    >
                      <Animated.View style={styles.tabButton}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityState={isFocused ? { selected: true } : {}}
                          accessibilityLabel={options.tabBarAccessibilityLabel ?? getTabLabel(route.name)}
                          style={styles.tabTouchable}
                          activeOpacity={isDragMode ? 1 : 0.7}
                          disabled={isDragMode || isDragging}
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

                          {/* Tab Label */}
                          <Text style={[styles.tabLabel, isFocused ? styles.activeTabLabel : styles.inactiveTabLabel]}>
                            {getTabLabel(route.name)}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </TapGestureHandler>
                  )
                })}
              </View>
            </View>

            {/* Instruction Hint */}
            {!isDragMode && lastOffset.current.x === 0 && lastOffset.current.y === 0 && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>Hold to move</Text>
              </View>
            )}
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
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
    borderRadius: 28,
    width: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0, 123, 255, 0.08)",
  },
  tabBarDragMode: {
    borderColor: "rgba(0, 123, 255, 0.3)",
    shadowOpacity: 0.2,
  },
  tabBarDragging: {
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  dragHandle: {
    alignItems: "center",
    paddingVertical: 4,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#007BFF",
    borderRadius: 2,
  },
  tabButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
  tabTouchable: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 64,
    justifyContent: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: "#007BFF",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inactiveIconContainer: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Montserrat_500Medium",
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#007BFF",
    fontFamily: "Montserrat_700Bold",
  },
  inactiveTabLabel: {
    color: "#6B7280",
  },
  dragModeOverlay: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    zIndex: 1,
  },
  dragModeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.2)",
  },
  dragModeText: {
    fontSize: 12,
    color: "#007BFF",
    fontFamily: "Montserrat_500Medium",
    marginLeft: 6,
  },
  hintContainer: {
    position: "absolute",
    top: -32,
    alignSelf: "center",
  },
  hintText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Montserrat_400Regular",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
})

export default AppleStyleTabBar
