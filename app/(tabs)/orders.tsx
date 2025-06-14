"use client"

import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import * as Animatable from "react-native-animatable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

interface OrderItem {
  id: string
  orderNumber: string
  from: {
    name: string
    address: string
    coordinates: { latitude: number; longitude: number }
  }
  to: {
    name: string
    address: string
    coordinates: { latitude: number; longitude: number }
  }
  status: "delivered" | "in_transit" | "cancelled" | "scheduled" | "pending"
  date: Date
  deliveryTime: string
  price: number
  distance: number
  deliveryType: "standard" | "express" | "premium"
  rider?: {
    name: string
    rating: number
    photo: string
  }
  rating?: number
  items?: string[]
  paymentMethod: "cash" | "card" | "mobile"
  promoApplied?: string
  trackingId?: string
}

interface FilterOption {
  id: string
  label: string
  value: string
  count: number
}

const MOCK_ORDERS: OrderItem[] = [
  {
    id: "1",
    orderNumber: "RUB-2024-001",
    from: {
      name: "Kwabena Hall",
      address: "Main Campus, Block A",
      coordinates: { latitude: 5.6504, longitude: -0.1962 },
    },
    to: {
      name: "Science Library",
      address: "Academic Area, Level 2",
      coordinates: { latitude: 5.6514, longitude: -0.1952 },
    },
    status: "delivered",
    date: new Date(2024, 11, 14, 14, 30),
    deliveryTime: "12 mins",
    price: 8.5,
    distance: 1.2,
    deliveryType: "express",
    rider: {
      name: "Kwame Asante",
      rating: 4.8,
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    rating: 5,
    items: ["Documents", "Books"],
    paymentMethod: "mobile",
    trackingId: "TRK001",
  },
  {
    id: "2",
    orderNumber: "RUB-2024-002",
    from: { name: "Student Center", address: "Central Campus", coordinates: { latitude: 5.6524, longitude: -0.1942 } },
    to: {
      name: "Engineering Block",
      address: "Technical Campus",
      coordinates: { latitude: 5.6534, longitude: -0.1932 },
    },
    status: "in_transit",
    date: new Date(2024, 11, 14, 16, 15),
    deliveryTime: "8 mins",
    price: 12.0,
    distance: 2.1,
    deliveryType: "premium",
    rider: {
      name: "Ama Osei",
      rating: 4.9,
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    items: ["Laptop", "Charger"],
    paymentMethod: "card",
    trackingId: "TRK002",
  },
  {
    id: "3",
    orderNumber: "RUB-2024-003",
    from: { name: "Cafeteria", address: "Student Life Center", coordinates: { latitude: 5.6564, longitude: -0.1902 } },
    to: {
      name: "Medical School",
      address: "Health Sciences Campus",
      coordinates: { latitude: 5.6544, longitude: -0.1922 },
    },
    status: "scheduled",
    date: new Date(2024, 11, 15, 9, 0),
    deliveryTime: "15 mins",
    price: 6.75,
    distance: 0.8,
    deliveryType: "standard",
    items: ["Food Package"],
    paymentMethod: "cash",
    promoApplied: "STUDENT20",
  },
  {
    id: "4",
    orderNumber: "RUB-2024-004",
    from: {
      name: "Business School",
      address: "Management Campus",
      coordinates: { latitude: 5.6554, longitude: -0.1912 },
    },
    to: { name: "Sports Complex", address: "Recreation Area", coordinates: { latitude: 5.6574, longitude: -0.1892 } },
    status: "cancelled",
    date: new Date(2024, 11, 13, 11, 45),
    deliveryTime: "10 mins",
    price: 5.25,
    distance: 1.5,
    deliveryType: "standard",
    items: ["Sports Equipment"],
    paymentMethod: "mobile",
  },
  {
    id: "5",
    orderNumber: "RUB-2024-005",
    from: { name: "Library", address: "Academic Complex", coordinates: { latitude: 5.6514, longitude: -0.1952 } },
    to: { name: "Dorm A", address: "Residential Area", coordinates: { latitude: 5.6504, longitude: -0.1962 } },
    status: "delivered",
    date: new Date(2024, 11, 12, 18, 20),
    deliveryTime: "18 mins",
    price: 7.8,
    distance: 1.8,
    deliveryType: "standard",
    rider: {
      name: "Kofi Mensah",
      rating: 4.7,
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    rating: 4,
    items: ["Research Papers", "USB Drive"],
    paymentMethod: "card",
  },
]

const FILTER_OPTIONS: FilterOption[] = [
  { id: "all", label: "All Orders", value: "all", count: 5 },
  { id: "delivered", label: "Delivered", value: "delivered", count: 2 },
  { id: "in_transit", label: "In Transit", value: "in_transit", count: 1 },
  { id: "scheduled", label: "Scheduled", value: "scheduled", count: 1 },
  { id: "cancelled", label: "Cancelled", value: "cancelled", count: 1 },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const [orders, setOrders] = useState<OrderItem[]>(MOCK_ORDERS)
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>(MOCK_ORDERS)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const searchInputRef = useRef<TextInput>(null)
  const filterAnimation = useRef(new Animated.Value(0)).current
  const headerAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    filterOrders()
  }, [selectedFilter, searchQuery, orders])

  useEffect(() => {
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const filterOrders = useCallback(() => {
    let filtered = orders

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((order) => order.status === selectedFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.from.name.toLowerCase().includes(query) ||
          order.to.name.toLowerCase().includes(query) ||
          order.rider?.name.toLowerCase().includes(query),
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime())

    setFilteredOrders(filtered)
  }, [orders, selectedFilter, searchQuery])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In real app, fetch fresh data here
    setRefreshing(false)
  }, [])

  const handleFilterPress = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedFilter(filterId)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    Animated.timing(filterAnimation, {
      toValue: showFilters ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const handleOrderPress = (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const handleTrackOrder = (order: OrderItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      "Track Order",
      `Tracking order ${order.orderNumber}\nStatus: ${order.status.replace("_", " ").toUpperCase()}`,
      [{ text: "OK" }],
    )
  }

  const handleReorder = (order: OrderItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert("Reorder", `Reorder delivery from ${order.from.name} to ${order.to.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reorder", onPress: () => console.log("Reordering...") },
    ])
  }

  const handleRateOrder = (order: OrderItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert("Rate Order", `Rate your delivery experience for order ${order.orderNumber}`, [{ text: "OK" }])
  }

  const handleGetHelp = (order: OrderItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert("Get Help", `Need help with order ${order.orderNumber}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Contact Support", onPress: () => console.log("Contacting support...") },
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#10B981"
      case "in_transit":
        return "#F59E0B"
      case "scheduled":
        return "#3B82F6"
      case "cancelled":
        return "#EF4444"
      case "pending":
        return "#6B7280"
      default:
        return "#6B7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return "checkmark-circle"
      case "in_transit":
        return "bicycle"
      case "scheduled":
        return "calendar"
      case "cancelled":
        return "close-circle"
      case "pending":
        return "time"
      default:
        return "help-circle"
    }
  }

  const getDeliveryTypeIcon = (type: string) => {
    switch (type) {
      case "standard":
        return "bicycle"
      case "express":
        return "car-sport"
      case "premium":
        return "airplane"
      default:
        return "bicycle"
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={14}
        color={index < rating ? "#FFA31A" : "#E5E7EB"}
      />
    ))
  }

  const renderOrderItem = ({ item, index }: { item: OrderItem; index: number }) => {
    const isExpanded = expandedOrder === item.id
    const statusColor = getStatusColor(item.status)

    return (
      <Animatable.View animation="fadeInUp" delay={index * 100} duration={600} style={styles.orderCard}>
        <TouchableOpacity onPress={() => handleOrderPress(item.id)} activeOpacity={0.7} style={styles.orderHeader}>
          {/* Order Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={getStatusIcon(item.status)} size={16} color="#FFFFFF" />
          </View>

          {/* Order Info */}
          <View style={styles.orderInfo}>
            <View style={styles.orderTitleRow}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.orderPrice}>₵{item.price.toFixed(2)}</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={styles.fromDot} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.from.name}
                </Text>
              </View>

              <View style={styles.routeLine} />

              <View style={styles.routePoint}>
                <View style={styles.toDot} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.to.name}
                </Text>
              </View>
            </View>

            <View style={styles.orderMeta}>
              <Text style={styles.orderDate}>
                {formatDate(item.date)} • {formatTime(item.date)}
              </Text>
              <View style={styles.deliveryTypeBadge}>
                <Ionicons name={getDeliveryTypeIcon(item.deliveryType)} size={12} color="#007BFF" />
                <Text style={styles.deliveryTypeText}>{item.deliveryType}</Text>
              </View>
            </View>
          </View>

          {/* Expand Icon */}
          <Animated.View
            style={[
              styles.expandIcon,
              {
                transform: [
                  {
                    rotate: isExpanded ? "180deg" : "0deg",
                  },
                ],
              },
            ]}
          >
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </Animated.View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <Animatable.View animation="fadeInDown" duration={300} style={styles.expandedContent}>
            {/* Rider Info */}
            {item.rider && (
              <View style={styles.riderSection}>
                <Text style={styles.sectionTitle}>Rider</Text>
                <View style={styles.riderInfo}>
                  <Image source={{ uri: item.rider.photo }} style={styles.riderPhoto} />
                  <View style={styles.riderDetails}>
                    <Text style={styles.riderName}>{item.rider.name}</Text>
                    <View style={styles.riderRating}>
                      {renderStars(Math.floor(item.rider.rating))}
                      <Text style={styles.ratingText}>{item.rider.rating}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Order Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{item.distance} km</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Time</Text>
                <Text style={styles.detailValue}>{item.deliveryTime}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>{item.paymentMethod}</Text>
              </View>
              {item.promoApplied && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Promo</Text>
                  <Text style={[styles.detailValue, styles.promoText]}>{item.promoApplied}</Text>
                </View>
              )}
              {item.items && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Items</Text>
                  <Text style={styles.detailValue}>{item.items.join(", ")}</Text>
                </View>
              )}
            </View>

            {/* Rating Section */}
            {item.rating && (
              <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>Your Rating</Text>
                <View style={styles.userRating}>
                  {renderStars(item.rating)}
                  <Text style={styles.ratingText}>{item.rating}/5</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {item.status === "in_transit" && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => handleTrackOrder(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Track Order</Text>
                </TouchableOpacity>
              )}

              {item.status === "delivered" && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => handleReorder(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={16} color="#007BFF" />
                    <Text style={styles.secondaryButtonText}>Reorder</Text>
                  </TouchableOpacity>

                  {!item.rating && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={() => handleRateOrder(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Rate</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleGetHelp(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle" size={16} color="#007BFF" />
                <Text style={styles.secondaryButtonText}>Help</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}
      </Animatable.View>
    )
  }

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? "Try adjusting your search" : "Your order history will appear here"}
      </Text>
    </Animatable.View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnimation,
            transform: [
              {
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSubtitle}>{filteredOrders.length} total orders</Text>
          </View>

          <TouchableOpacity style={styles.filterButton} onPress={toggleFilters} activeOpacity={0.7}>
            <Ionicons name="options" size={20} color="#007BFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search orders, locations, riders..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <Animated.View
          style={[
            styles.filterContainer,
            {
              opacity: filterAnimation,
              transform: [
                {
                  translateY: filterAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTER_OPTIONS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterPill, selectedFilter === item.id && styles.activeFilterPill]}
                onPress={() => handleFilterPress(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, selectedFilter === item.id && styles.activeFilterText]}>
                  {item.label}
                </Text>
                <View style={[styles.filterCount, selectedFilter === item.id && styles.activeFilterCount]}>
                  <Text style={[styles.filterCountText, selectedFilter === item.id && styles.activeFilterCountText]}>
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </Animated.View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#007BFF" colors={["#007BFF"]} />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFF",
  },

  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: "rgba(0, 123, 255, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
    color: "#1F2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  // Search Styles
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },

  // Filter Styles
  filterContainer: {
    marginTop: 8,
  },
  filterList: {
    paddingVertical: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeFilterPill: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  filterText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#6B7280",
    marginRight: 8,
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  filterCount: {
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  activeFilterCount: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterCountText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: "#6B7280",
  },
  activeFilterCountText: {
    color: "#FFFFFF",
  },

  // Orders List Styles
  ordersList: {
    padding: 20,
    paddingTop: 8,
  },
  separator: {
    height: 12,
  },

  // Order Card Styles
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "rgba(0, 123, 255, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  orderPrice: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#007BFF",
  },
  routeContainer: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  fromDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007BFF",
    marginRight: 12,
  },
  toDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFA31A",
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: "#E5E7EB",
    marginLeft: 3,
    marginRight: 12,
    marginBottom: 4,
  },
  locationText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  orderMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#9CA3AF",
  },
  deliveryTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deliveryTypeText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#007BFF",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  expandIcon: {
    marginLeft: 12,
  },

  // Expanded Content Styles
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    marginTop: 16,
  },

  // Rider Section
  riderSection: {
    marginTop: 0,
  },
  riderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4,
  },
  riderRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },

  // Details Section
  detailsSection: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#1F2937",
    textTransform: "capitalize",
  },
  promoText: {
    color: "#10B981",
  },

  // Rating Section
  ratingSection: {
    marginTop: 8,
  },
  userRating: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: "#007BFF",
  },
  secondaryButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  primaryButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 6,
  },
  secondaryButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#007BFF",
    marginLeft: 6,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },

  // Loading Overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(249, 251, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#007BFF",
    marginTop: 16,
  },
})
