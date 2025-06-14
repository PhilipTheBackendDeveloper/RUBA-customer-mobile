import { View } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"

export const BellIcon = () => (
  <View>
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="black"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  </View>
)

export const LocationPinBlue = () => (
  <View>
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="#3b82f6"
      stroke="#3b82f6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx={12} cy={10} r={3} fill="white" />
    </Svg>
  </View>
)

export const LocationPinOrange = () => (
  <View>
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="#f97316"
      stroke="#f97316"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx={12} cy={10} r={3} fill="white" />
    </Svg>
  </View>
)
