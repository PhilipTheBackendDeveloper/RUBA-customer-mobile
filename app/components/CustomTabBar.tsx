"use client"

import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import * as Haptics from "expo-haptics"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()

  const pan = useRef(new Animated.ValueXY()).current
  const opacity = useRef(new Animated.Value(1)).current
  const scale = useRef(new Animated.Value(1)).current

  const [isDragging, setIsDragging] = useState(false)
  const [lastInteraction, setLastInteraction] = useState(Date.now())
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })

  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getIconName = (routeName: string, isFocused: boolean): string => {
    switch (routeName) {
      case "index":
        return isFocused ? "home" : "home-outline"
      case "orders":
        return isFocused ? "cart" : "cart-outline"
      case "settings":
        return isFocused ? "settings" : "settings-outline"
      default:
        return "help-circle-outline"
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10
      },
      onPanResponderGrant: () => {
        setIsDragging(true)
        setLastInteraction(Date.now())
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

        pan.setOffset({
          x: currentPosition.x,
          y: currentPosition.y,
        })
        pan.setValue({ x: 0, y: 0 })

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false, // 👈 fixed
          }),
          Animated.spring(scale, {
            toValue: 1.05,
            useNativeDriver: false, // 👈 fixed
            tension: 300,
            friction: 20,
          }),
        ]).start()

        if (fadeTimer.current) {
          clearTimeout(fadeTimer.current)
          fadeTimer.current = null
        }
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false, // Required
      }),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false)
        setLastInteraction(Date.now())

        const finalX = currentPosition.x + gestureState.dx
        const finalY = currentPosition.y + gestureState.dy

        const tabBarWidth = width * 0.85
        const minX = -width / 2 + tabBarWidth / 2 + 20
        const maxX = width / 2 - tabBarWidth / 2 - 20
        const minY = -200
        const maxY = 0

        let clampedX = Math.max(minX, Math.min(maxX, finalX))
        let clampedY = Math.max(minY, Math.min(maxY, finalY))

        if (Math.abs(clampedX) < 30) clampedX = 0
        if (Math.abs(clampedY) < 30) clampedY = 0

        setCurrentPosition({ x: clampedX, y: clampedY })
        pan.flattenOffset()

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: clampedX, y: clampedY },
            useNativeDriver: false, // Required
            tension: 100,
            friction: 8,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false, // 👈 fixed
            tension: 300,
            friction: 20,
          }),
        ]).start()

        startAutoFade()
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      },
    }),
  ).current

  const startAutoFade = () => {
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current)
    }

    fadeTimer.current = setTimeout(() => {
      if (!isDragging && Date.now() - lastInteraction > 3000) {
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: false, // 👈 fixed
        }).start()
      }
    }, 3000)
  }

  const handleTabPress = (route: any, isFocused: boolean) => {
    setLastInteraction(Date.now())

    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, // 👈 fixed
    }).start()

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    })

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    startAutoFade()
  }

  useEffect(() => {
    startAutoFade()
    return () => {
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current)
        fadeTimer.current = null
      }
    }
  }, [])

  useEffect(() => {
    setLastInteraction(Date.now())
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, // 👈 fixed
    }).start()
    startAutoFade()
  }, [state.index])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.tabBar, isDragging && styles.tabBarDragging]}>
        {isDragging && (
          <View style={styles.dragIndicator}>
            <View style={styles.dragHandle} />
          </View>
        )}

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
              >
                <View
                  style={[styles.iconContainer, isFocused ? styles.activeIconContainer : styles.inactiveIconContainer]}
                >
                  <Ionicons
                    name={getIconName(route.name, isFocused) as any}
                    size={24}
                    color={isFocused ? "#FFFFFF" : "#000000"}
                  />
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {!isDragging && currentPosition.x === 0 && currentPosition.y === 0 && (
        <View style={styles.hintContainer}>
          <View style={styles.hint}>
            <Ionicons name="move" size={12} color="#9CA3AF" />
          </View>
        </View>
      )}
    </Animated.View>
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
    borderRadius: 30,
    width: width * 0.85,
    minHeight: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabBarDragging: {
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.2)",
  },
  dragIndicator: {
    marginBottom: 4,
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
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    backgroundColor: "#F3F6FA",
  },
  hintContainer: {
    position: "absolute",
    top: -8,
    right: 8,
  },
  hint: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
})

export default CustomTabBar
