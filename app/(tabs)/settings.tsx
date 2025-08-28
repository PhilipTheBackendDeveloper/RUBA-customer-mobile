"use client"

import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import * as Animatable from "react-native-animatable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

interface SettingItem {
  id: string
  title: string
  subtitle?: string
  icon: string
  type: "navigation" | "toggle" | "action"
  value?: boolean
  onPress?: () => void
  onToggle?: (value: boolean) => void
  badge?: string
  color?: string
  destructive?: boolean
}

interface SettingSection {
  id: string
  title: string
  items: SettingItem[]
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState({
    name: "Sara Johnson",
    email: "sara.johnson@university.edu",
    phone: "+233 24 123 4567",
    studentId: "UG/2021/CS/001",
    verified: true,
    memberSince: "September 2023",
  })

  // Settings state
  const [notifications, setNotifications] = useState(true)
  const [locationServices, setLocationServices] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Modal states
  const [editProfileVisible, setEditProfileVisible] = useState(false)
  const [paymentMethodsVisible, setPaymentMethodsVisible] = useState(false)
  const [addressesVisible, setAddressesVisible] = useState(false)
  const [promotionsVisible, setPromotionsVisible] = useState(false)
  const [helpVisible, setHelpVisible] = useState(false)
  const [aboutVisible, setAboutVisible] = useState(false)

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  })

  const headerAnimation = useRef(new Animated.Value(0)).current
  const profileAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animate header and profile on mount
    Animated.stagger(200, [
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(profileAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
    })
    setEditProfileVisible(true)
  }

  const handleSaveProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setUser({
      ...user,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    })
    setEditProfileVisible(false)
  }

  const handlePaymentMethods = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setPaymentMethodsVisible(true)
  }

  const handleAddresses = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setAddressesVisible(true)
  }

  const handlePromotion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setPromotionsVisible(true)
  }

  const handleReferFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert(
      "Refer Friends",
      "Share your referral code: SARA2024\n\nBoth you and your friend will get ₵5 credit when they complete their first order!",
      [
        { text: "Copy Code", onPress: () => console.log("Code copied") },
        { text: "Share", onPress: () => console.log("Share referral") },
        { text: "Close", style: "cancel" },
      ],
    )
  }

  const handleSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setHelpVisible(true)
  }

  const handlePrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert(
      "Privacy Policy",
      "We take your privacy seriously. Your personal information is encrypted and never shared with third parties without your consent.\n\nWould you like to view the full privacy policy?",
      [
        { text: "View Full Policy", onPress: () => console.log("Open privacy policy") },
        { text: "Close", style: "cancel" },
      ],
    )
  }

  const handleTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert(
      "Terms of Service",
      "By using Ruba, you agree to our terms and conditions. These terms govern your use of our delivery services.\n\nWould you like to view the full terms?",
      [
        { text: "View Full Terms", onPress: () => console.log("Open terms") },
        { text: "Close", style: "cancel" },
      ],
    )
  }

  const handleAbout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setAboutVisible(true)
  }

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert("Sign Out", "Are you sure you want to sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          // Here you would implement actual logout logic
          console.log("User logged out")
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.\n\nTo proceed, please contact our support team.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          style: "destructive",
          onPress: () => setHelpVisible(true),
        },
      ],
    )
  }

  const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
    return (value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setter(value)

      // Here you would implement actual functionality
      if (setter === setNotifications) {
        console.log("Notifications:", value ? "enabled" : "disabled")
      } else if (setter === setLocationServices) {
        console.log("Location services:", value ? "enabled" : "disabled")
      } else if (setter === setDarkMode) {
        console.log("Dark mode:", value ? "enabled" : "disabled")
        // Here you would implement theme switching
      }
    }
  }

  const settingSections: SettingSection[] = [
    {
      id: "account",
      title: "Account",
      items: [
        {
          id: "edit_profile",
          title: "Edit Profile",
          subtitle: "Update your personal information",
          icon: "person-outline",
          type: "navigation",
          onPress: handleEditProfile,
        },
        {
          id: "payment_methods",
          title: "Payment Methods",
          subtitle: "Manage cards and mobile money",
          icon: "card-outline",
          type: "navigation",
          onPress: handlePaymentMethods,
          badge: "2",
        },
        {
          id: "addresses",
          title: "Saved Addresses",
          subtitle: "Home, work, and favorite locations",
          icon: "location-outline",
          type: "navigation",
          onPress: handleAddresses,
          badge: "3",
        },
      ],
    },
    {
      id: "preferences",
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Push Notifications",
          subtitle: "Order updates and promotions",
          icon: "notifications-outline",
          type: "toggle",
          value: notifications,
          onToggle: handleToggle(setNotifications, notifications),
        },
        {
          id: "location",
          title: "Location Services",
          subtitle: "For accurate pickup and delivery",
          icon: "location-outline",
          type: "toggle",
          value: locationServices,
          onToggle: handleToggle(setLocationServices, locationServices),
        },
        {
          id: "dark_mode",
          title: "Dark Mode",
          subtitle: "Easier on the eyes",
          icon: "moon-outline",
          type: "toggle",
          value: darkMode,
          onToggle: handleToggle(setDarkMode, darkMode),
        },
      ],
    },
    {
      id: "rewards",
      title: "Rewards & Promotions",
      items: [
        {
          id: "promotions",
          title: "Active Promotions",
          subtitle: "View current offers",
          icon: "gift-outline",
          type: "navigation",
          onPress: handlePromotion,
          badge: "2",
          color: "#10B981",
        },
        {
          id: "refer_friends",
          title: "Refer Friends",
          subtitle: "Earn ₵5 for each referral",
          icon: "people-outline",
          type: "navigation",
          onPress: handleReferFriends,
          color: "#F59E0B",
        },
      ],
    },
    {
      id: "support",
      title: "Support",
      items: [
        {
          id: "help_support",
          title: "Help & Support",
          subtitle: "FAQs and contact support",
          icon: "help-circle-outline",
          type: "navigation",
          onPress: handleSupport,
        },
        {
          id: "privacy",
          title: "Privacy Policy",
          subtitle: "How we protect your data",
          icon: "shield-outline",
          type: "navigation",
          onPress: handlePrivacy,
        },
        {
          id: "terms",
          title: "Terms of Service",
          subtitle: "Our terms and conditions",
          icon: "document-text-outline",
          type: "navigation",
          onPress: handleTerms,
        },
        {
          id: "about",
          title: "About Ruba",
          subtitle: "Version 2.1.0",
          icon: "information-circle-outline",
          type: "navigation",
          onPress: handleAbout,
        },
      ],
    },
    {
      id: "account_actions",
      title: "Account Actions",
      items: [
        {
          id: "logout",
          title: "Sign Out",
          subtitle: "Sign out of your account",
          icon: "log-out-outline",
          type: "action",
          onPress: handleLogout,
          color: "#F59E0B",
        },
        {
          id: "delete_account",
          title: "Delete Account",
          subtitle: "Permanently delete your account",
          icon: "trash-outline",
          type: "action",
          onPress: handleDeleteAccount,
          destructive: true,
          color: "#EF4444",
        },
      ],
    },
  ]

  const renderSettingItem = (item: SettingItem, index: number) => {
    const iconColor = item.destructive ? "#EF4444" : item.color || "#6B7280"
    const titleColor = item.destructive ? "#EF4444" : "#1F2937"

    return (
      <Animatable.View key={item.id} animation="fadeInUp" delay={index * 50} duration={400}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={item.onPress}
          activeOpacity={0.7}
          disabled={item.type === "toggle"}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
              <Ionicons name={item.icon as any} size={20} color={iconColor} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: titleColor }]}>{item.title}</Text>
              {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
            </View>
          </View>

          <View style={styles.settingRight}>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}

            {item.type === "toggle" && (
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: "#E5E7EB", true: "#007BFF40" }}
                thumbColor={item.value ? "#007BFF" : "#FFFFFF"}
                ios_backgroundColor="#E5E7EB"
              />
            )}

            {item.type === "navigation" && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
          </View>
        </TouchableOpacity>
      </Animatable.View>
    )
  }

  const renderSection = (section: SettingSection, sectionIndex: number) => (
    <Animatable.View
      key={section.id}
      animation="fadeInUp"
      delay={sectionIndex * 100}
      duration={500}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>{section.items.map((item, index) => renderSettingItem(item, index))}</View>
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
        <Text style={styles.headerTitle}>Settings</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: profileAnimation,
              transform: [
                {
                  translateY: profileAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={styles.profileCard} onPress={handleEditProfile} activeOpacity={0.8}>
            <View style={styles.profileImageContainer}>
              <Image source={require("../../assets/images/profile.jpeg")} style={styles.profileImage} />
              {user.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileName}>{user.name}</Text>
                <View style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color="#007BFF" />
                </View>
              </View>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <Text style={styles.profilePhone}>{user.phone}</Text>
              <View style={styles.profileMeta}>
                <Text style={styles.studentId}>ID: {user.studentId}</Text>
                <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Settings Sections */}
        {settingSections.map((section, index) => renderSection(section, index))}

        {/* App Version */}
        <View style={styles.appVersion}>
          <Text style={styles.versionText}>Ruba for Students</Text>
          <Text style={styles.versionNumber}>Version 2.1.0 (Build 2024.12.14)</Text>
          <Text style={styles.copyright}>© 2024 Ruba Technologies Ltd.</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student ID</Text>
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={user.studentId}
                editable={false}
                placeholder="Student ID cannot be changed"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.formNote}>Contact support to update your Student ID</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal visible={paymentMethodsVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPaymentMethodsVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <TouchableOpacity style={styles.modalAddButton}>
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.paymentMethod}>
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={24} color="#007BFF" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Visa •••• 4532</Text>
                <Text style={styles.paymentSubtitle}>Expires 12/26</Text>
              </View>
              <TouchableOpacity style={styles.paymentAction}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethod}>
              <View style={styles.paymentIcon}>
                <Ionicons name="phone-portrait" size={24} color="#10B981" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>MTN Mobile Money</Text>
                <Text style={styles.paymentSubtitle}>+233 24 ••• 4567</Text>
              </View>
              <TouchableOpacity style={styles.paymentAction}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addPaymentButton}>
              <Ionicons name="add-circle-outline" size={24} color="#007BFF" />
              <Text style={styles.addPaymentText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Addresses Modal */}
      <Modal visible={addressesVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddressesVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Saved Addresses</Text>
            <TouchableOpacity style={styles.modalAddButton}>
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <Ionicons name="home" size={20} color="#007BFF" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>Home</Text>
                <Text style={styles.addressSubtitle}>Kwabena Hall, Room 204</Text>
              </View>
              <TouchableOpacity style={styles.addressAction}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <Ionicons name="school" size={20} color="#10B981" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>Library</Text>
                <Text style={styles.addressSubtitle}>Science Library, Level 2</Text>
              </View>
              <TouchableOpacity style={styles.addressAction}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <Ionicons name="cafe" size={20} color="#F59E0B" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>Cafeteria</Text>
                <Text style={styles.addressSubtitle}>Student Life Center</Text>
              </View>
              <TouchableOpacity style={styles.addressAction}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addAddressButton}>
              <Ionicons name="add-circle-outline" size={24} color="#007BFF" />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Promotions Modal */}
      <Modal visible={promotionsVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPromotionsVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Active Promotions</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <Text style={styles.promoTitle}>Student Discount</Text>
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>20% OFF</Text>
                </View>
              </View>
              <Text style={styles.promoDescription}>Get 20% off your next 3 orders with code STUDENT20</Text>
              <Text style={styles.promoExpiry}>Expires: Dec 31, 2024</Text>
            </View>

            <View style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <Text style={styles.promoTitle}>Free Delivery</Text>
                <View style={[styles.promoBadge, { backgroundColor: "#10B981" }]}>
                  <Text style={styles.promoBadgeText}>FREE</Text>
                </View>
              </View>
              <Text style={styles.promoDescription}>Free delivery on orders above ₵15 with code FREEDEL</Text>
              <Text style={styles.promoExpiry}>Expires: Dec 25, 2024</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={helpVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setHelpVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Help & Support</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="chatbubble-outline" size={24} color="#007BFF" />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>Live Chat</Text>
                <Text style={styles.helpSubtitle}>Chat with our support team</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="call-outline" size={24} color="#10B981" />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>Call Support</Text>
                <Text style={styles.helpSubtitle}>+233 30 123 4567</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="mail-outline" size={24} color="#F59E0B" />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>Email Support</Text>
                <Text style={styles.helpSubtitle}>support@ruba.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
              <View style={styles.helpInfo}>
                <Text style={styles.helpTitle}>FAQ</Text>
                <Text style={styles.helpSubtitle}>Frequently asked questions</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAboutVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>About Ruba</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.aboutSection}>
              <View style={styles.aboutLogo}>
                <Text style={styles.aboutLogoText}>R</Text>
              </View>
              <Text style={styles.aboutTitle}>Ruba</Text>
              <Text style={styles.aboutVersion}>Version 2.1.0</Text>
              <Text style={styles.aboutDescription}>
                Your trusted campus delivery companion. Fast, reliable, and affordable delivery services designed
                specifically for university students.
              </Text>
            </View>

            <View style={styles.aboutInfo}>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Build</Text>
                <Text style={styles.aboutValue}>2024.12.14</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Developer</Text>
                <Text style={styles.aboutValue}>Ruba Technologies Ltd.</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Support</Text>
                <Text style={styles.aboutValue}>support@ruba.com</Text>
              </View>
            </View>

            <Text style={styles.aboutCopyright}>© 2024 Ruba Technologies Ltd. All rights reserved.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
    color: "#1F2937",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Profile Section Styles
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "rgba(0, 123, 255, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileImageContainer: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#E5E7EB",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  profileName: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    color: "#1F2937",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileEmail: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  profilePhone: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  profileMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentId: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#007BFF",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberSince: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Section Styles
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#374151",
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "rgba(0, 123, 255, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Setting Item Styles
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 12,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  // App Version
  appVersion: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#374151",
    marginBottom: 4,
  },
  versionNumber: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  copyright: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FBFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#6B7280",
  },
  modalTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
    color: "#1F2937",
  },
  modalSaveButton: {
    paddingVertical: 8,
  },
  modalSaveText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#007BFF",
  },
  modalAddButton: {
    paddingVertical: 8,
  },
  modalAddText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#007BFF",
  },
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Form Styles
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#1F2937",
  },
  disabledInput: {
    backgroundColor: "#F9FAFB",
    color: "#9CA3AF",
  },
  formNote: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  // Payment Methods
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "rgba(0, 123, 255, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  paymentAction: {
    padding: 8,
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  addPaymentText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#007BFF",
    marginLeft: 8,
  },

  // Addresses
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "rgba(0, 123, 255, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 2,
  },
  addressSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  addressAction: {
    padding: 8,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  addAddressText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#007BFF",
    marginLeft: 8,
  },

  // Promotions
  promoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "rgba(0, 123, 255, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  promoTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#1F2937",
  },
  promoBadge: {
    backgroundColor: "#007BFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promoBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  promoDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  promoExpiry: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Help & Support
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: "rgba(0, 123, 255, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpInfo: {
    flex: 1,
    marginLeft: 16,
  },
  helpTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 2,
  },
  helpSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
  },

  // About
  aboutSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  aboutLogoText: {
    fontFamily: "Poppins-Bold",
    fontSize: 32,
    color: "#FFFFFF",
  },
  aboutTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    color: "#1F2937",
    marginBottom: 4,
  },
  aboutVersion: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  aboutDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  aboutInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "rgba(0, 123, 255, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  aboutLabel: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#6B7280",
  },
  aboutValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#1F2937",
  },
  aboutCopyright: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
})
