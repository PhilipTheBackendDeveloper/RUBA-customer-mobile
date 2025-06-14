"use client"

import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import * as Haptics from "expo-haptics"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()

  const pan = useRef(new Animated.ValueXY()).current
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5
      },
      onPanResponderGrant: () => {
        setIsDragging(true)
        pan.extractOffset()
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1.05,
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
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false)
        const currentX = gestureState.dx + (pan.x as any)._offset || 0
        const currentY = gestureState.dy + (pan.y as any)._offset || 0

        const tabBarWidth = isMinimized ? 60 : width * 0.85
        const tabBarHeight = isMinimized ? 60 : 80
        const minX = -width / 2 + tabBarWidth / 2 + 20
        const maxX = width / 2 - tabBarWidth / 2 - 20
        const minY = -height / 2 + tabBarHeight / 2 + insets.top + 50
        const maxY = height / 2 - tabBarHeight / 2 - insets.bottom - 50

        let finalX = Math.max(minX, Math.min(maxX, currentX))
        let finalY = Math.max(minY, Math.min(maxY, currentY))

        const snapThreshold = 50
        if (Math.abs(finalX - minX) < snapThreshold) finalX = minX
        else if (Math.abs(finalX - maxX) < snapThreshold) finalX = maxX
        if (Math.abs(finalY - minY) < snapThreshold) finalY = minY
        else if (Math.abs(finalY - maxY) < snapThreshold) finalY = maxY

        const shouldMinimize =
          Math.abs(finalX - minX) < 10 || Math.abs(finalX - maxX) < 10 || Math.abs(finalY - minY) < 10

        if (shouldMinimize !== isMinimized) setIsMinimized(shouldMinimize)

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
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

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      },
    })
  ).current

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

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  useEffect(() => {
    if (isMinimized) {
      const timer = setTimeout(() => {
        setIsMinimized(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.index])

  const focusedRoute = state.routes[state.index]
  const isFocused = (routeName: string) => focusedRoute.name === routeName

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.tabBar,
          isMinimized ? styles.tabBarMinimized : styles.tabBarExpanded,
          isDragging && styles.tabBarDragging,
        ]}
      >
        {isMinimized ? (
          <TouchableOpacity style={styles.minimizedButton} onPress={toggleMinimize} activeOpacity={0.8}>
            <View style={styles.minimizedIconContainer}>
              <Ionicons name={getIconName(focusedRoute.name, true) as any} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.expandIndicator}>
              <Ionicons name="add" size={12} color="#007BFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.dragIndicator}>
              <View style={styles.dragHandle} />
            </View>
            <TouchableOpacity style={styles.minimizeButton} onPress={toggleMinimize} activeOpacity={0.7}>
              <Ionicons name="remove" size={16} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.tabButtonsContainer}>
              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key]
                const isTabFocused = state.index === index

                return (
                  <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={isTabFocused ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel ?? ""}
                    onPress={() => handleTabPress(route, isTabFocused)}
                    style={styles.tabButton}
                    activeOpacity={0.7}
                    disabled={isDragging}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        isTabFocused ? styles.activeIconContainer : styles.inactiveIconContainer,
                      ]}
                    >
                      <Ionicons
                        name={getIconName(route.name, isTabFocused) as any}
                        size={20}
                        color={isTabFocused ? "#FFFFFF" : "#6B7280"}
                      />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    zIndex: 1000,
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.1)",
  },
  tabBarExpanded: {
    width: width * 0.85,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tabBarMinimized: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tabBarDragging: {
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderColor: "rgba(0, 123, 255, 0.3)",
  },
  dragIndicator: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
  },
  dragHandle: {
    width: 30,
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
  minimizeButton: {
    position: "absolute",
    top: 8,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  tabButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconContainer: {
    backgroundColor: "#007BFF",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  inactiveIconContainer: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  minimizedButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  minimizedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
})

export default FloatingTabBar
