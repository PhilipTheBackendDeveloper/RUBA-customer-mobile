import { Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = ''; // You need to replace this with your actual API key

interface OrderItem {
  id: string;
  from: string;
  to: string;
  date: string;
  status: 'Delivered' | 'In Transit' | 'Failed';
  fromIcon: 'location' | 'home' | 'fitness';
  toIcon: 'location' | 'home' | 'book';
}

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

interface DeliveryOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  multiplier: number;
  eta: string;
}

interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  formatted_address: string;
}

// Campus locations for suggestions
const CAMPUS_LOCATIONS = [
  { name: 'Kwabena Hall', address: 'Main Campus, Block A', latitude: 5.6504, longitude: -0.1962 },
  { name: 'Science Library', address: 'Academic Area, Level 2', latitude: 5.6514, longitude: -0.1952 },
  { name: 'Student Center', address: 'Central Campus', latitude: 5.6524, longitude: -0.1942 },
  { name: 'Engineering Block', address: 'Technical Campus', latitude: 5.6534, longitude: -0.1932 },
  { name: 'Medical School', address: 'Health Sciences Campus', latitude: 5.6544, longitude: -0.1922 },
  { name: 'Business School', address: 'Management Campus', latitude: 5.6554, longitude: -0.1912 },
  { name: 'Cafeteria', address: 'Student Life Center', latitude: 5.6564, longitude: -0.1902 },
  { name: 'Sports Complex', address: 'Recreation Area', latitude: 5.6574, longitude: -0.1892 },
];

// Delivery options
const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    icon: 'bicycle',
    description: 'Regular campus delivery',
    multiplier: 1.0,
    eta: '15-20 min'
  },
  {
    id: 'express',
    name: 'Express',
    icon: 'motorcycle',
    description: 'Priority delivery',
    multiplier: 1.5,
    eta: '10-15 min'
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: 'car',
    description: 'VIP delivery experience',
    multiplier: 2.0,
    eta: '5-10 min'
  }
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const priceSheetAnim = useRef(new Animated.Value(height)).current;
  const scheduleSheetAnim = useRef(new Animated.Value(height)).current;

  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: '1',
      from: 'Dorm A',
      to: 'Library',
      date: 'May 26, 12:45pm',
      status: 'Delivered',
      fromIcon: 'home',
      toIcon: 'book',
    },
    {
      id: '2',
      from: 'Science Hall',
      to: 'Dorm B',
      date: 'May 25, 4:10pm',
      status: 'In Transit',
      fromIcon: 'location',
      toIcon: 'home',
    },
    {
      id: '3',
      from: 'Gym',
      to: 'Dorm C',
      date: 'May 24, 10:30am',
      status: 'Failed',
      fromIcon: 'fitness',
      toIcon: 'home',
    },
  ]);

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'pickup' | 'dropoff'>('pickup');
  const [searchQuery, setSearchQuery] = useState('');
  const [googlePredictions, setGooglePredictions] = useState<GooglePlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 5.6504,
    longitude: -0.1962,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  // New state variables for scheduling and pricing
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption>(DELIVERY_OPTIONS[0]);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [packageSize, setPackageSize] = useState(1); // 1-3 scale
  const [packageWeight, setPackageWeight] = useState(1); // 1-5 kg
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Google Places API integration
  const searchGooglePlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setGooglePredictions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:gh&types=establishment|geocode`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setGooglePredictions(data.predictions || []);
      } else {
        console.warn('Google Places API error:', data.status);
        setGooglePredictions([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setGooglePredictions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getPlaceDetails = async (placeId: string): Promise<LocationData | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=name,formatted_address,geometry`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const place: GooglePlaceDetails = data.result;
        return {
          name: place.name || 'Selected Location',
          address: place.formatted_address || 'Address not available',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          placeId: placeId,
        };
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
    return null;
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchGooglePlaces(searchQuery);
      } else {
        setGooglePredictions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchGooglePlaces]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Calculate distance and price when both locations are set
    if (currentLocation && dropoffLocation) {
      calculateDistanceAndPrice();
    }
  }, [currentLocation, dropoffLocation, selectedDeliveryOption, packageSize, packageWeight]);

  const calculateDistanceAndPrice = async () => {
    if (!currentLocation || !dropoffLocation) return;
    
    setIsCalculating(true);
    
    try {
      // Use Google Distance Matrix API for more accurate distance calculation
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentLocation.latitude},${currentLocation.longitude}&destinations=${dropoffLocation.latitude},${dropoffLocation.longitude}&key=${GOOGLE_MAPS_API_KEY}&units=metric`
      );
      
      const data = await response.json();
      
      let calculatedDistance = 0;
      let calculatedDuration = 0;
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        calculatedDistance = element.distance.value / 1000; // Convert to km
        calculatedDuration = element.duration.value / 60; // Convert to minutes
      } else {
        // Fallback to Haversine formula
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(dropoffLocation.latitude - currentLocation.latitude);
        const dLon = deg2rad(dropoffLocation.longitude - currentLocation.longitude);
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(currentLocation.latitude)) * Math.cos(deg2rad(dropoffLocation.latitude)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        calculatedDistance = R * c; // Distance in km
      }
      
      // Generate route coordinates for the polyline using Google Directions API
      try {
        const directionsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${dropoffLocation.latitude},${dropoffLocation.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        const directionsData = await directionsResponse.json();
        
        if (directionsData.status === 'OK' && directionsData.routes[0]) {
          const route = directionsData.routes[0];
          const points = decodePolyline(route.overview_polyline.points);
          setRouteCoordinates(points);
        } else {
          // Fallback to simple line
          generateSimpleRoute();
        }
      } catch (error) {
        console.error('Error getting directions:', error);
        generateSimpleRoute();
      }
      
      // Calculate price: base rate + distance + delivery option + package factors
      const basePrice = 2; // Base price in cedis
      const distancePrice = calculatedDistance * 1.5; // 1.5 cedis per km
      const optionMultiplier = selectedDeliveryOption.multiplier;
      const sizeMultiplier = 1 + (packageSize - 1) * 0.1; // 1.0, 1.1, or 1.2
      const weightMultiplier = 1 + (packageWeight - 1) * 0.05; // 1.0 to 1.2
      
      const calculatedPrice = (basePrice + distancePrice) * optionMultiplier * sizeMultiplier * weightMultiplier;
      
      // Round to 2 decimal places
      const roundedDistance = Math.round(calculatedDistance * 10) / 10;
      const roundedPrice = Math.round(calculatedPrice * 100) / 100;
      
      setDistance(roundedDistance);
      setPrice(roundedPrice);
      
      // Show price sheet after calculation
      if (!showPriceSheet && !showScheduleSheet) {
        setTimeout(() => {
          showPriceDetails();
        }, 500);
      }
      
      // Fit map to show both markers
      fitMapToMarkers();
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      // Fallback calculation
      generateSimpleRoute();
      const fallbackDistance = 2; // Default 2km
      const fallbackPrice = 5; // Default 5 cedis
      setDistance(fallbackDistance);
      setPrice(fallbackPrice);
    } finally {
      setIsCalculating(false);
    }
  };

  const generateSimpleRoute = () => {
    if (!currentLocation || !dropoffLocation) return;
    
    const numPoints = 20;
    const newRouteCoordinates = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      const lat = currentLocation.latitude + fraction * (dropoffLocation.latitude - currentLocation.latitude);
      const lng = currentLocation.longitude + fraction * (dropoffLocation.longitude - currentLocation.longitude);
      
      // Add some randomness to make it look like a real route
      const jitter = 0.0005 * Math.sin(i * Math.PI);
      
      newRouteCoordinates.push({
        latitude: lat + jitter,
        longitude: lng + jitter
      });
    }
    
    setRouteCoordinates(newRouteCoordinates);
  };

  // Decode Google polyline
  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  const fitMapToMarkers = () => {
    if (!mapRef.current || !currentLocation || !dropoffLocation) return;
    
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude }
        ],
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        }
      );
    }, 1000);
  };

  const showPriceDetails = () => {
    setShowPriceSheet(true);
    Animated.spring(priceSheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8
    }).start();
  };

  const hidePriceDetails = () => {
    Animated.timing(priceSheetAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setShowPriceSheet(false);
    });
  };

  const showScheduleOptions = () => {
    hidePriceDetails();
    setTimeout(() => {
      setShowScheduleSheet(true);
      Animated.spring(scheduleSheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8
      }).start();
    }, 300);
  };

  const hideScheduleOptions = () => {
    Animated.timing(scheduleSheetAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setShowScheduleSheet(false);
      setTimeout(() => {
        showPriceDetails();
      }, 100);
    });
  };

  const handleScheduleConfirm = () => {
    setIsScheduled(true);
    hideScheduleOptions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setScheduledDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduledDate(newDate);
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use automatic pickup location detection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Get address from coordinates using Google Geocoding API
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results[0]) {
          const result = data.results[0];
          const locationName = result.address_components[0]?.long_name || 'Current Location';
          
          setCurrentLocation({
            name: locationName,
            address: result.formatted_address || 'Your current location',
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } else {
          // Fallback to expo location
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const locationName = address.name || 'Current Location';
            const locationAddress = [
              address.street,
              address.district,
              address.city,
              address.region,
            ].filter(Boolean).join(', ');

            setCurrentLocation({
              name: locationName,
              address: locationAddress || 'Your current location',
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        }

        // Update map region
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Set location without detailed address
        setCurrentLocation({
          name: 'Current Location',
          address: 'Your current location',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again or select manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLocationPress = (type: 'pickup' | 'dropoff') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalType(type);
    setLocationModalVisible(true);
    setSearchQuery('');
    setGooglePredictions([]);
  };

  const handleSelectLocation = async (location: LocationData | GooglePlacePrediction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let selectedLocation: LocationData;
    
    if ('place_id' in location) {
      // It's a Google prediction, get details
      const details = await getPlaceDetails(location.place_id);
      if (!details) {
        Alert.alert('Error', 'Unable to get location details. Please try again.');
        return;
      }
      selectedLocation = details;
    } else {
      // It's already a LocationData object
      selectedLocation = location;
    }
    
    if (modalType === 'pickup') {
      setCurrentLocation(selectedLocation);
    } else {
      setDropoffLocation(selectedLocation);
    }
    
    // Update map region
    setMapRegion({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Animate map to new location
    mapRef.current?.animateToRegion({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
    
    setLocationModalVisible(false);
    
    // Ensure scrolling works after modal closes
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 500);
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    // Only allow map selection for dropoff
    if (modalType === 'dropoff') {
      try {
        // Get address from coordinates using Google Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        const data = await response.json();
        
        let locationName = 'Selected Location';
        let locationAddress = 'Selected location';
        
        if (data.status === 'OK' && data.results[0]) {
          const result = data.results[0];
          locationName = result.address_components[0]?.long_name || 'Selected Location';
          locationAddress = result.formatted_address || 'Selected location';
        }

        const newLocation: LocationData = {
          name: locationName,
          address: locationAddress,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
        
        handleSelectLocation(newLocation);
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        // Fallback without detailed address
        const newLocation: LocationData = {
          name: 'Selected Location',
          address: 'Selected location',
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
        
        handleSelectLocation(newLocation);
      }
    }
  };

  const handleNotification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Notifications', 'You have no new notifications');
  };

  const handleOrderDetails = (order: OrderItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Order Details', `From: ${order.from}\nTo: ${order.to}\nDate: ${order.date}\nStatus: ${order.status}`);
  };

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('All Orders', 'Navigating to all orders...');
  };

  const handleServicePress = (service: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(service, `Learn more about our ${service.toLowerCase()} service`);
  };

  const handleSelectDeliveryOption = (option: DeliveryOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDeliveryOption(option);
  };

  const handleApplyPromo = () => {
    const code = promoCode.toLowerCase().trim();
    if (code === 'ruba10') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPromoDiscount(price * 0.1);
      Alert.alert('Promo Applied!', 'RUBA10 promo code applied successfully! 10% discount.');
    } else if (code === 'newuser') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPromoDiscount(price * 0.15);
      Alert.alert('Promo Applied!', 'NEWUSER promo code applied successfully! 15% discount.');
    } else if (code === 'student') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPromoDiscount(price * 0.2);
      Alert.alert('Promo Applied!', 'STUDENT promo code applied successfully! 20% discount.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPromoDiscount(0);
      Alert.alert('Invalid Promo', 'The promo code you entered is invalid or expired.');
    }
  };

  const handleConfirmDelivery = () => {
    if (!currentLocation || !dropoffLocation) {
      Alert.alert('Missing Information', 'Please select both pickup and drop-off locations.');
      return;
    }

    setIsConfirming(true);
    
    // Simulate processing
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const finalPrice = (price - promoDiscount).toFixed(2);
      
      if (isScheduled) {
        Alert.alert(
          'Delivery Scheduled! 🎉',
          `Your delivery has been scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\n\nTotal: ₵${finalPrice}\nPayment: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                hidePriceDetails();
                resetDeliveryForm();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Delivery Confirmed! 🚀',
          `Your delivery request has been confirmed. A rider will be assigned shortly.\n\nTotal: ₵${finalPrice}\nPayment: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}\nETA: ${selectedDeliveryOption.eta}`,
          [
            { 
              text: 'Track Order', 
              onPress: () => {
                hidePriceDetails();
                resetDeliveryForm();
                // Here you would navigate to tracking screen
              }
            }
          ]
        );
      }
      
      setIsConfirming(false);
    }, 2000);
  };

  const resetDeliveryForm = () => {
    setDropoffLocation(null);
    setIsScheduled(false);
    setScheduledDate(new Date());
    setPackageSize(1);
    setPackageWeight(1);
    setNote('');
    setPromoCode('');
    setPromoDiscount(0);
    setSelectedDeliveryOption(DELIVERY_OPTIONS[0]);
    setRouteCoordinates([]);
    setDistance(0);
    setPrice(0);
    
    // Ensure scrolling works after reset
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return '#10B981';
      case 'In Transit':
        return '#F59E0B';
      case 'Failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusTextColor = (status: string) => {
    return '#FFFFFF';
  };

  const getIconForLocation = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return 'home';
      case 'book':
        return 'library';
      case 'location':
        return 'location';
      case 'fitness':
        return 'fitness';
      default:
        return 'location';
    }
  };

  const formatScheduleDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = 
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear();
      
    const isTomorrow = 
      scheduledDate.getDate() === tomorrow.getDate() &&
      scheduledDate.getMonth() === tomorrow.getMonth() &&
      scheduledDate.getFullYear() === tomorrow.getFullYear();
    
    let dateStr = '';
    if (isToday) {
      dateStr = 'Today';
    } else if (isTomorrow) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = scheduledDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    
    const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${dateStr} at ${timeStr}`;
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading Ruba...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        ref={scrollViewRef}
        style={[styles.scrollContainer, { opacity: (showPriceSheet || showScheduleSheet) ? 0.3 : 1 }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!showPriceSheet && !showScheduleSheet}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Profile and Greeting */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/images/profile.jpeg')} 
              style={styles.profileImage}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hey Sara</Text>
              <Text style={styles.subGreeting}>Ready to send something?</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotification}>
            <Ionicons name="notifications-outline" size={18} color="#000000" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Location Selection */}
        <View style={styles.locationSection}>
          {/* Pickup Location */}
          <TouchableOpacity 
            style={styles.locationInput} 
            onPress={() => handleLocationPress('pickup')}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <Ionicons name="locate-outline" size={15} color="#007BFF" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              {isLoadingLocation ? (
                <View style={styles.loadingLocationContainer}>
                  <ActivityIndicator size="small" color="#007BFF" />
                  <Text style={styles.loadingLocationText}>Getting your location...</Text>
                </View>
              ) : currentLocation ? (
                <Text style={styles.locationValue} numberOfLines={1}>
                  {currentLocation.name}
                </Text>
              ) : (
                <Text style={styles.locationPlaceholder}>Tap to select pickup location</Text>
              )}
            </View>
            <View style={[styles.locationBadge, { backgroundColor: '#E6F0FF' }]}>
              <Ionicons name="locate" size={12} color="#007BFF" />
            </View>
          </TouchableOpacity>

          {/* Dropoff Location */}
          <TouchableOpacity 
            style={styles.locationInput} 
            onPress={() => handleLocationPress('dropoff')}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <Ionicons name="location-outline" size={15} color="#FFA31A" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Drop-off Location</Text>
              {dropoffLocation ? (
                <Text style={styles.locationValue} numberOfLines={1}>
                  {dropoffLocation.name}
                </Text>
              ) : (
                <Text style={styles.locationPlaceholder}>Where to?</Text>
              )}
            </View>
            <View style={[styles.locationBadge, { backgroundColor: '#FFF5E6' }]}>
              <Ionicons name="search" size={12} color="#FFA31A" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <TouchableOpacity 
          style={styles.heroBanner}
          onPress={() => handleServicePress('Safe Delivery')}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/images/safe-delivery.jpg')} 
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>SAFE{'\n'}DELIVERY{'\n'}EVERYWHERE</Text>
          </View>
        </TouchableOpacity>

        {/* Goodies Section */}
        <View style={styles.goodiesSection}>
          <Text style={styles.goodiesTitle}>Goodies In Ruba</Text>
          
          <View style={styles.goodiesGrid}>
            {/* Fast Delivery Card */}
            <TouchableOpacity 
              style={styles.fastDeliveryCard}
              onPress={() => handleServicePress('Fast Delivery')}
              activeOpacity={0.9}
            >
              <Image 
                source={require('../../assets/images/fast-delivery.jpg')} 
                style={styles.fastDeliveryImage}
              />
              <View style={styles.serviceOverlay}>
                <Text style={styles.fastDeliveryText}>FAST DELIVERY</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rightColumn}>
              {/* Made Easy Card */}
              <TouchableOpacity 
                style={styles.madeEasyCard}
                onPress={() => handleServicePress('Made Easy')}
                activeOpacity={0.9}
              >
                <Image 
                  source={require('../../assets/images/made-easy-2.png')} 
                  style={styles.smallCardImage}
                />
                <View style={[styles.serviceOverlay, styles.lightOverlay]}>
                  <Text style={styles.madeEasyText}>RUBA MADE IT{'\n'}SO EASY</Text>
                </View>
              </TouchableOpacity>

              {/* Friendly Rider Card */}
              <TouchableOpacity 
                style={styles.friendlyRiderCard}
                onPress={() => handleServicePress('Friendly Rider')}
                activeOpacity={0.9}
              >
                <Image 
                  source={require('../../assets/images/friendly-rider.jpg')} 
                  style={styles.smallCardImage}
                />
                <View style={styles.serviceOverlay}>
                  <Text style={styles.friendlyRiderText}>YOUR FRIENDLY{'\n'}CAMPUS RIDER</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="time-outline" size={16} color="#4D4D4D" />
              <Text style={styles.sectionTitle}>Recent Orders</Text>
            </View>
            <TouchableOpacity onPress={handleSeeAll}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Order Items */}
          {orders.map((order) => (
            <TouchableOpacity 
              key={order.id}
              style={styles.orderItem}
              onPress={() => handleOrderDetails(order)}
              activeOpacity={0.7}
            >
              <View style={styles.orderContent}>
                <View style={styles.orderRoute}>
                  <View style={styles.locationWithIcon}>
                    <Ionicons 
                      name={getIconForLocation(order.fromIcon)} 
                      size={12} 
                      color="#FFA31A" 
                      style={styles.orderLocationIcon}
                    />
                    <Text style={styles.orderLocationText}>{order.from}</Text>
                  </View>
                  <Text style={styles.orderArrow}>→</Text>
                  <View style={styles.locationWithIcon}>
                    <Ionicons 
                      name={getIconForLocation(order.toIcon)} 
                      size={12} 
                      color="#007BFF" 
                      style={styles.orderLocationIcon}
                    />
                    <Text style={styles.orderLocationText}>{order.to}</Text>
                  </View>
                </View>
                
                <View style={styles.orderDetails}>
                  <Text style={styles.orderDate}>{order.date}</Text>
                  <View 
                    style={[
                      styles.orderStatus, 
                      { backgroundColor: getStatusColor(order.status) }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.orderStatusText, 
                        { color: getStatusTextColor(order.status) }
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={11} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLocationModalVisible(false)}
        statusBarTranslucent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => setLocationModalVisible(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalType === 'pickup' ? 'Select Pickup Location' : 'Select Drop-off Location'}
            </Text>
          </View>

          {/* Map View */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              region={mapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
              loadingEnabled={true}
              loadingIndicatorColor="#007BFF"
              loadingBackgroundColor="#FFFFFF"
            >
              {modalType === 'pickup' && currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title={currentLocation.name}
                  description={currentLocation.address}
                >
                  <View style={styles.customMarkerPickup}>
                    <Ionicons name="locate" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              )}
              {modalType === 'dropoff' && dropoffLocation && (
                <Marker
                  coordinate={{
                    latitude: dropoffLocation.latitude,
                    longitude: dropoffLocation.longitude,
                  }}
                  title={dropoffLocation.name}
                  description={dropoffLocation.address}
                >
                  <View style={styles.customMarkerDropoff}>
                    <Ionicons name="location" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              )}
            </MapView>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={modalType === 'pickup' ? "Search for pickup location" : "Where to?"}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={modalType === 'dropoff'}
                  returnKeyType="search"
                />
                {(searchQuery.length > 0 || isSearching) && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setSearchQuery('');
                      setGooglePredictions([]);
                    }}
                  >
                    {isSearching ? (
                      <ActivityIndicator size="small" color="#6B7280" />
                    ) : (
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Current Location Button (for pickup only) */}
            {modalType === 'pickup' && (
              <TouchableOpacity 
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="#007BFF" />
                ) : (
                  <Ionicons name="locate" size={24} color="#007BFF" />
                )}
              </TouchableOpacity>
            )}

            {/* Location Suggestions */}
            {(searchQuery.length > 0 || googlePredictions.length > 0) && (
              <View style={styles.suggestionsContainer}>
                <ScrollView 
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Campus locations first */}
                  {searchQuery.length > 0 && CAMPUS_LOCATIONS
                    .filter(location =>
                      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      location.address.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((location, index) => (
                      <TouchableOpacity
                        key={`campus-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectLocation(location)}
                      >
                        <View style={styles.suggestionIconContainer}>
                          <Ionicons 
                            name="school" 
                            size={20} 
                            color={modalType === 'pickup' ? "#007BFF" : "#FFA31A"} 
                          />
                        </View>
                        <View style={styles.suggestionTextContainer}>
                          <Text style={styles.suggestionTitle}>{location.name}</Text>
                          <Text style={styles.suggestionAddress}>{location.address}</Text>
                        </View>
                        <View style={styles.campusTag}>
                          <Text style={styles.campusTagText}>Campus</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  }
                  
                  {/* Google Places predictions */}
                  {googlePredictions.map((prediction, index) => (
                    <TouchableOpacity
                      key={`google-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectLocation(prediction)}
                    >
                      <View style={styles.suggestionIconContainer}>
                        <Ionicons 
                          name="location" 
                          size={20} 
                          color={modalType === 'pickup' ? "#007BFF" : "#FFA31A"} 
                        />
                      </View>
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionTitle}>
                          {prediction.structured_formatting.main_text}
                        </Text>
                        <Text style={styles.suggestionAddress}>
                          {prediction.structured_formatting.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {searchQuery.length > 2 && googlePredictions.length === 0 && !isSearching && (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="search" size={24} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>No locations found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Bottom Sheet with Location Info */}
            {modalType === 'pickup' && currentLocation && !searchQuery.length && (
              <View style={styles.locationInfoSheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.locationInfoTitle}>{currentLocation.name}</Text>
                <Text style={styles.locationInfoAddress}>{currentLocation.address}</Text>
                <TouchableOpacity 
                  style={styles.confirmLocationButton}
                  onPress={() => {
                    setLocationModalVisible(false);
                  }}
                >
                  <Text style={styles.confirmLocationText}>Confirm Pickup Location</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Map Pin for Drop-off */}
            {modalType === 'dropoff' && !searchQuery.length && (
              <View style={styles.mapPinContainer}>
                <View style={styles.mapPin}>
                  <Ionicons name="location" size={40} color="#FFA31A" />
                </View>
                <View style={styles.mapPinShadow} />
                <Text style={styles.mapPinText}>Tap on the map to set your drop-off point</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Price Details Sheet */}
      {showPriceSheet && (
        <Animated.View 
          style={[
            styles.priceSheetContainer,
            {
              transform: [{ translateY: priceSheetAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.blurOverlay} 
            activeOpacity={1}
            onPress={hidePriceDetails}
          />
          
          <View style={styles.priceSheet}>
            <View style={styles.sheetHandle} />
            
            {/* Map Preview */}
            <View style={styles.mapPreviewContainer}>
              <MapView
                style={styles.mapPreview}
                provider={PROVIDER_GOOGLE}
                region={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                loadingEnabled={true}
              >
                {currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title={currentLocation.name}
                  >
                    <View style={styles.customMarkerPickup}>
                      <Ionicons name="locate" size={16} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}
                {dropoffLocation && (
                  <Marker
                    coordinate={{
                      latitude: dropoffLocation.latitude,
                      longitude: dropoffLocation.longitude,
                    }}
                    title={dropoffLocation.name}
                  >
                    <View style={styles.customMarkerDropoff}>
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeWidth={3}
                    strokeColor="#007BFF"
                    lineDashPattern={[1, 2]}
                  />
                )}
              </MapView>
              
              {/* Route Info */}
              <View style={styles.routeInfoContainer}>
                <View style={styles.routeInfo}>
                  <View style={styles.routeDistance}>
                    <Ionicons name="map-outline" size={16} color="#6B7280" />
                    <Text style={styles.routeDistanceText}>{distance} km</Text>
                  </View>
                  <View style={styles.routeTime}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.routeTimeText}>{selectedDeliveryOption.eta}</Text>
                  </View>
                </View>
              </View>
              
              {isCalculating && (
                <View style={styles.calculatingOverlay}>
                  <ActivityIndicator size="small" color="#007BFF" />
                  <Text style={styles.calculatingText}>Calculating...</Text>
                </View>
              )}
            </View>
            
            {/* Scheduled Time Banner (if scheduled) */}
            {isScheduled && (
              <Animatable.View 
                animation="fadeIn" 
                duration={500} 
                style={styles.scheduledBanner}
              >
                <Ionicons name="calendar" size={18} color="#007BFF" />
                <Text style={styles.scheduledText}>Scheduled for {formatScheduleDate()}</Text>
                <TouchableOpacity onPress={showScheduleOptions}>
                  <Text style={styles.changeScheduleText}>Change</Text>
                </TouchableOpacity>
              </Animatable.View>
            )}
            
            <ScrollView 
              style={styles.priceSheetScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Delivery Options */}
              <Text style={styles.sectionLabel}>Delivery Options</Text>
              <View style={styles.deliveryOptionsContainer}>
                {DELIVERY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.deliveryOption,
                      selectedDeliveryOption.id === option.id && styles.selectedDeliveryOption
                    ]}
                    onPress={() => handleSelectDeliveryOption(option)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.deliveryOptionIcon,
                      selectedDeliveryOption.id === option.id && styles.selectedDeliveryOptionIcon
                    ]}>
                      <FontAwesome5 name={option.icon} size={16} color={selectedDeliveryOption.id === option.id ? "#FFFFFF" : "#1F2937"} />
                    </View>
                    <View style={styles.deliveryOptionInfo}>
                      <Text style={styles.deliveryOptionName}>{option.name}</Text>
                      <Text style={styles.deliveryOptionDescription}>{option.description}</Text>
                    </View>
                    <Text style={styles.deliveryOptionEta}>{option.eta}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Package Details */}
              <Text style={styles.sectionLabel}>Package Details</Text>
              <View style={styles.packageDetailsContainer}>
                <View style={styles.packageSizeContainer}>
                  <Text style={styles.packageDetailLabel}>Size</Text>
                  <View style={styles.packageSizeOptions}>
                    {[1, 2, 3].map((size) => (
                      <TouchableOpacity
                        key={`size-${size}`}
                        style={[
                          styles.packageSizeOption,
                          packageSize === size && styles.selectedPackageOption
                        ]}
                        onPress={() => setPackageSize(size)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.packageSizeText,
                          packageSize === size && styles.selectedPackageOptionText
                        ]}>
                          {size === 1 ? 'S' : size === 2 ? 'M' : 'L'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.packageWeightContainer}>
                  <Text style={styles.packageDetailLabel}>Weight: {packageWeight} kg</Text>
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={5}
                      step={1}
                      value={packageWeight}
                      onValueChange={setPackageWeight}
                      minimumTrackTintColor="#007BFF"
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor="#007BFF"
                    />
                    <View style={styles.sliderLabels}>
                      {[1, 2, 3, 4, 5].map((weight) => (
                        <Text 
                          key={`weight-${weight}`}
                          style={[
                            styles.sliderLabel,
                            packageWeight === weight && styles.activeSliderLabel
                          ]}
                        >
                          {weight}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Additional Note */}
              <Text style={styles.sectionLabel}>Additional Note</Text>
              <View style={styles.noteContainer}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add note for rider (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  value={note}
                  onChangeText={setNote}
                  maxLength={200}
                />
              </View>
              
              {/* Payment Method */}
              <Text style={styles.sectionLabel}>Payment Method</Text>
              <View style={styles.paymentMethodsContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    paymentMethod === 'cash' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="cash-outline" 
                    size={20} 
                    color={paymentMethod === 'cash' ? "#007BFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'cash' && styles.selectedPaymentMethodText
                  ]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    paymentMethod === 'card' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('card')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={paymentMethod === 'card' ? "#007BFF" : "#6B7280"}
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'card' && styles.selectedPaymentMethodText
                  ]}>
                    Card
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    paymentMethod === 'mobile' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('mobile')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="phone-portrait-outline" 
                    size={20} 
                    color={paymentMethod === 'mobile' ? "#007BFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'mobile' && styles.selectedPaymentMethodText
                  ]}>
                    Mobile Money
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Promo Code */}
              <Text style={styles.sectionLabel}>Promo Code</Text>
              <View style={styles.promoContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter promo code"
                  placeholderTextColor="#9CA3AF"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                  maxLength={20}
                />
                <TouchableOpacity 
                  style={[
                    styles.promoButton,
                    !promoCode.trim() && styles.disabledPromoButton
                  ]}
                  onPress={handleApplyPromo}
                  disabled={!promoCode.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promoButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
              
              {/* Price Breakdown */}
              <View style={styles.priceBreakdownContainer}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Fee</Text>
                  <Text style={styles.priceValue}>₵2.00</Text>
                </View>
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Distance ({distance} km)</Text>
                  <Text style={styles.priceValue}>₵{(distance * 1.5).toFixed(2)}</Text>
                </View>
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{selectedDeliveryOption.name} Service</Text>
                  <Text style={styles.priceValue}>
                    {selectedDeliveryOption.multiplier > 1 ? `+${((selectedDeliveryOption.multiplier - 1) * 100).toFixed(0)}%` : 'Included'}
                  </Text>
                </View>
                
                {promoDiscount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Promo Discount</Text>
                    <Text style={styles.discountValue}>-₵{promoDiscount.toFixed(2)}</Text>
                  </View>
                )}
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₵{(price - promoDiscount).toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {!isScheduled && (
                <TouchableOpacity 
                  style={styles.scheduleButton}
                  onPress={showScheduleOptions}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color="#007BFF" />
                  <Text style={styles.scheduleButtonText}>Schedule for Later</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
                onPress={handleConfirmDelivery}
                disabled={isConfirming}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isConfirming ? ['#9CA3AF', '#6B7280'] : ['#007BFF', '#0056B3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  {isConfirming ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.confirmButtonText}>
                        {isScheduled ? 'Schedule Delivery' : 'Confirm Delivery'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
      
      {/* Schedule Sheet */}
      {showScheduleSheet && (
        <Animated.View 
          style={[
            styles.scheduleSheetContainer,
            {
              transform: [{ translateY: scheduleSheetAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.blurOverlay} 
            activeOpacity={1}
            onPress={hideScheduleOptions}
          />
          
          <View style={styles.scheduleSheet}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.scheduleSheetHeader}>
              <TouchableOpacity 
                style={styles.scheduleBackButton}
                onPress={hideScheduleOptions}
              >
                <Ionicons name="arrow-back" size={24} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.scheduleSheetTitle}>Schedule Delivery</Text>
            </View>
            
            <ScrollView 
              style={styles.scheduleSheetScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.scheduleDescription}>
                Choose when you&apos;d like your package to be picked up
              </Text>
              
              {/* Date Selection */}
              <Text style={styles.scheduleSectionLabel}>Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.datePickerText}>
                  {scheduledDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {/* Time Selection */}
              <Text style={styles.scheduleSectionLabel}>Time</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.timePickerText}>
                  {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {/* Quick Time Options */}
              <Text style={styles.scheduleSectionLabel}>Quick Options</Text>
              <View style={styles.quickTimeOptions}>
                {[
                  { label: 'In 1 hour', value: new Date(Date.now() + 60 * 60 * 1000) },
                  { label: 'In 2 hours', value: new Date(Date.now() + 2 * 60 * 60 * 1000) },
                  { label: 'In 4 hours', value: new Date(Date.now() + 4 * 60 * 60 * 1000) },
                  { label: 'Tomorrow 9 AM', value: (() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    return tomorrow;
                  })() },
                  { label: 'Tomorrow 2 PM', value: (() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(14, 0, 0, 0);
                    return tomorrow;
                  })() },
                  { label: 'This Weekend', value: (() => {
                    const weekend = new Date();
                    const daysUntilSaturday = (6 - weekend.getDay()) % 7;
                    weekend.setDate(weekend.getDate() + daysUntilSaturday);
                    weekend.setHours(10, 0, 0, 0);
                    return weekend;
                  })() }
                ].map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickTimeOption}
                    onPress={() => setScheduledDate(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickTimeOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Schedule Info */}
              <View style={styles.scheduleInfoContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.scheduleInfoText}>
                  Scheduled deliveries can be modified up to 30 minutes before pickup time.
                </Text>
              </View>
            </ScrollView>
            
            {/* Confirm Button */}
            <TouchableOpacity 
              style={styles.scheduleConfirmButton}
              onPress={handleScheduleConfirm}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#007BFF', '#0056B3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scheduleConfirmButtonGradient}
              >
                <Ionicons name="calendar" size={18} color="#FFFFFF" />
                <Text style={styles.scheduleConfirmButtonText}>Confirm Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Date Picker Modal */}
            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} // 7 days from now
              />
            )}
            
            {/* Time Picker Modal */}
            {showTimePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minuteInterval={15}
              />
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FBFF',
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#007BFF',
    marginTop: 16,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: 'rgba(0, 123, 255, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 2,
  },
  subGreeting: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  notificationButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  
  // Location Section Styles
  locationSection: {
    marginHorizontal: 32,
    marginBottom: 24,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9EF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: 'rgba(0, 123, 255, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  locationLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  locationValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  locationPlaceholder: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#9CA3AF',
  },
  loadingLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingLocationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  locationBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Hero Banner Styles
  heroBanner: {
    marginHorizontal: 16,
    height: 174,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 25,
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 19,
    lineHeight: 24,
    color: '#FFFFFF',
    width: 143,
    marginBottom: 50,
    marginTop: -20,
  },
  
  // Goodies Section Styles
  goodiesSection: {
    marginBottom: 24,
  },
  goodiesTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 19,
    color: '#000000',
    marginLeft: 21,
    marginBottom: 16,
  },
  goodiesGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 16,
  },
  fastDeliveryCard: {
    width: 167,
    height: 212,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  fastDeliveryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rightColumn: {
    flex: 1,
    gap: 16,
  },
  madeEasyCard: {
    height: 98,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendlyRiderCard: {
    height: 98,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
    justifyContent: 'center',
  },
  lightOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  fastDeliveryText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 17,
    color: '#FFFFFF',
    marginTop: -100,
    marginBottom: 40,
  },
  madeEasyText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#000000',
    textAlign: 'right',
    marginBottom: 33,
    marginRight: -11.5, 
  },
  friendlyRiderText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 39,
    marginLeft: -11.5,
  },
  
  // Recent Orders Section Styles
  recentOrdersSection: {
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  seeAllText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#007BFF',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 123, 255, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderContent: {
    flex: 1,
  },
  orderRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderLocationIcon: {
    marginRight: 6,
  },
  orderLocationText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  orderArrow: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginRight: 16,
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderStatusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 100,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  modalBackButton: {
    padding: 8,
    marginRight: 8,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: height * 0.6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  campusTag: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  campusTagText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#007BFF',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  locationInfoSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  locationInfoTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 4,
  },
  locationInfoAddress: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  confirmLocationButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmLocationText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  mapPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  mapPin: {
    marginBottom: 40,
  },
  mapPinShadow: {
    position: 'absolute',
    width: 16,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    bottom: 40,
  },
  mapPinText: {
    position: 'absolute',
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
  },
  customMarkerPickup: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  customMarkerDropoff: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFA31A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Price Sheet Styles
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  priceSheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  priceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  priceSheetScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mapPreviewContainer: {
    height: 150,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDistanceText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
  },
  routeTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTimeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
  },
  calculatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  calculatingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#007BFF',
    marginLeft: 8,
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scheduledText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  changeScheduleText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#007BFF',
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  deliveryOptionsContainer: {
    marginBottom: 20,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  selectedDeliveryOption: {
    borderColor: '#007BFF',
    backgroundColor: '#F0F7FF',
  },
  deliveryOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedDeliveryOptionIcon: {
    backgroundColor: '#007BFF',
  },
  deliveryOptionInfo: {
    flex: 1,
  },
  deliveryOptionName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  deliveryOptionDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  deliveryOptionEta: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#007BFF',
  },
  packageDetailsContainer: {
    marginBottom: 20,
  },
  packageSizeContainer: {
    marginBottom: 20,
  },
  packageDetailLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  packageSizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  packageSizeOption: {
    width: (width - 80) / 3,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  selectedPackageOption: {
    borderColor: '#007BFF',
    backgroundColor: '#F0F7FF',
  },
  packageSizeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#4B5563',
  },
  selectedPackageOptionText: {
    color: '#007BFF',
  },
  packageWeightContainer: {
    marginBottom: 8,
  },
  sliderContainer: {
    marginTop: 12,
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  sliderLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  activeSliderLabel: {
    fontFamily: 'Poppins-SemiBold',
    color: '#007BFF',
  },
  noteContainer: {
    marginBottom: 20,
  },
  noteInput: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  selectedPaymentMethod: {
    borderColor: '#007BFF',
    backgroundColor: '#F0F7FF',
  },
  paymentMethodText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
  },
  selectedPaymentMethodText: {
    color: '#007BFF',
  },
  promoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  promoInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  promoButton: {
    backgroundColor: '#007BFF',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  disabledPromoButton: {
    backgroundColor: '#9CA3AF',
  },
  promoButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  priceBreakdownContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  priceValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  discountValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#10B981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
  },
  totalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#007BFF',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  scheduleButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 8,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  
  // Schedule Sheet Styles
  scheduleSheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  scheduleSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  scheduleSheetScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scheduleSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scheduleBackButton: {
    padding: 8,
    marginRight: 8,
  },
  scheduleSheetTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
  },
  scheduleDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  scheduleSectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  datePickerText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  timePickerText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  quickTimeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  quickTimeOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickTimeOptionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#4B5563',
  },
  scheduleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scheduleInfoText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 18,
    flex: 1,
  },
  scheduleConfirmButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scheduleConfirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
  },
  scheduleConfirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
