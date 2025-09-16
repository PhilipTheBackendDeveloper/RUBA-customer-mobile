// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   StatusBar,
//   Animated,
//   Dimensions,
// } from 'react-native';
// import Easing from 'react-native/Libraries/Animated/Easing';
// import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
// import * as SplashScreen from 'expo-splash-screen';
// import * as Asset from 'expo-asset';
// import { router } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width, height } = Dimensions.get('window');

// SplashScreen.preventAutoHideAsync();

// export default function Index() {
//   const [isReady, setIsReady] = useState(false);

//   const [fontsLoaded] = useFonts({
//     'Montserrat-Regular': Montserrat_400Regular,
//     'Montserrat-Medium': Montserrat_500Medium,
//     'Montserrat-SemiBold': Montserrat_600SemiBold,
//   });

//   const logoImage = require('../assets/images/ruba-logo.png');

//   // Animation values
//   const logoScale = useRef(new Animated.Value(0)).current;
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const textOpacity = useRef(new Animated.Value(0)).current;
//   const textTranslateY = useRef(new Animated.Value(30)).current;
//   const taglineOpacity = useRef(new Animated.Value(0)).current;
//   const taglineTranslateY = useRef(new Animated.Value(20)).current;
//   const backgroundScale = useRef(new Animated.Value(1.2)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     async function prepare() {
//       try {
//         await Asset.Asset.fromModule(logoImage).downloadAsync();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsReady(true);
//       }
//     }
//     prepare();
//   }, []);

//   useEffect(() => {
//     if (fontsLoaded && isReady) {
//       startAnimations();
//       SplashScreen.hideAsync();
//     }
//   }, [fontsLoaded, isReady]);

//   const startAnimations = () => {
//     Animated.timing(backgroundScale, {
//       toValue: 1,
//       duration: 2000,
//       easing: Easing.out(Easing.quad),
//       useNativeDriver: true,
//     }).start();

//     Animated.sequence([
//       Animated.delay(300),
//       Animated.parallel([
//         Animated.spring(logoScale, {
//           toValue: 1,
//           tension: 50,
//           friction: 7,
//           useNativeDriver: true,
//         }),
//         Animated.timing(logoOpacity, {
//           toValue: 1,
//           duration: 800,
//           easing: Easing.out(Easing.quad),
//           useNativeDriver: true,
//         }),
//       ]),
//     ]).start();

//     Animated.sequence([
//       Animated.delay(800),
//       Animated.parallel([
//         Animated.timing(textOpacity, {
//           toValue: 1,
//           duration: 600,
//           easing: Easing.out(Easing.quad),
//           useNativeDriver: true,
//         }),
//         Animated.timing(textTranslateY, {
//           toValue: 0,
//           duration: 600,
//           easing: Easing.out(Easing.back(1.2)),
//           useNativeDriver: true,
//         }),
//       ]),
//     ]).start();

//     Animated.sequence([
//       Animated.delay(1200),
//       Animated.parallel([
//         Animated.timing(taglineOpacity, {
//           toValue: 1,
//           duration: 600,
//           easing: Easing.out(Easing.quad),
//           useNativeDriver: true,
//         }),
//         Animated.timing(taglineTranslateY, {
//           toValue: 0,
//           duration: 600,
//           easing: Easing.out(Easing.back(1.1)),
//           useNativeDriver: true,
//         }),
//       ]),
//     ]).start();

//     Animated.loop(
//       Animated.sequence([
//         Animated.delay(1500),
//         Animated.timing(pulseAnim, {
//           toValue: 1.05,
//           duration: 1000,
//           easing: Easing.inOut(Easing.sin),
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1000,
//           easing: Easing.inOut(Easing.sin),
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();

//     setTimeout(() => {
//       router.replace('/auth/signup');
//     }, 3500);
//   };

//   if (!fontsLoaded || !isReady) return null;

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007BFF" translucent />
//       <Animated.View
//         style={[
//           styles.backgroundContainer,
//           {
//             transform: [{ scale: backgroundScale }],
//           },
//         ]}
//       >
//         <LinearGradient
//           colors={['#007BFF', '#0056D6', '#003D9A']}
//           style={styles.gradient}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//         />
//       </Animated.View>

//       <View style={styles.floatingElements}>
//         <View style={[styles.floatingCircle, styles.circle1]} />
//         <View style={[styles.floatingCircle, styles.circle2]} />
//         <View style={[styles.floatingCircle, styles.circle3]} />
//       </View>

//       <View style={styles.contentContainer}>
//         <Animated.View
//           style={[
//             styles.logoContainer,
//             {
//               opacity: logoOpacity,
//               transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
//             },
//           ]}
//         >
//           <View style={styles.logoWrapper}>
//             <Image source={logoImage} style={styles.logo} resizeMode="contain" />
//           </View>
//         </Animated.View>

//         <Animated.View
//           style={[
//             styles.textContainer,
//             {
//               opacity: textOpacity,
//               transform: [{ translateY: textTranslateY }],
//             },
//           ]}
//         >
//           <Text style={styles.brandText}>ruba</Text>
//         </Animated.View>

//         <Animated.View
//           style={[
//             styles.taglineContainer,
//             {
//               opacity: taglineOpacity,
//               transform: [{ translateY: taglineTranslateY }],
//             },
//           ]}
//         >
//           <Text style={styles.taglineText}>Your Campus Connection</Text>
//           <Text style={styles.subtitleText}>Connect • Learn • Grow</Text>
//         </Animated.View>
//       </View>

//       <View style={styles.loadingContainer}>
//         <View style={styles.loadingDots}>
//           <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
//           <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
//           <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#007BFF' },
//   backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
//   gradient: { flex: 1 },
//   floatingElements: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
//   floatingCircle: {
//     position: 'absolute',
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 50,
//   },
//   circle1: { width: 100, height: 100, top: height * 0.15, right: -50 },
//   circle2: { width: 60, height: 60, top: height * 0.7, left: -30 },
//   circle3: { width: 80, height: 80, top: height * 0.25, left: width * 0.1 },
//   contentContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   logoContainer: { marginBottom: 20 },
//   logoWrapper: {
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderRadius: 25,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   logo: { width: 100, height: 100 },
//   textContainer: { marginBottom: 30 },
//   brandText: {
//     fontSize: 48,
//     color: '#FFFFFF',
//     fontFamily: 'Montserrat-SemiBold',
//     letterSpacing: 2,
//     textAlign: 'center',
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 4,
//   },
//   taglineContainer: { alignItems: 'center' },
//   taglineText: {
//     fontSize: 18,
//     color: 'rgba(255, 255, 255, 0.9)',
//     fontFamily: 'Montserrat-Medium',
//     textAlign: 'center',
//     marginBottom: 8,
//     letterSpacing: 0.5,
//   },
//   subtitleText: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.7)',
//     fontFamily: 'Montserrat-Regular',
//     textAlign: 'center',
//     letterSpacing: 1,
//   },
//   loadingContainer: {
//     position: 'absolute',
//     bottom: 80,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   loadingDots: { flexDirection: 'row', alignItems: 'center' },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.6)',
//     marginHorizontal: 4,
//   },
// });
