import { Platform } from "react-native";

// Gate for iOS 26+ NativeTabs. Older iOS / Android / web use the classic
// JS tab bar fallback.
export const usesNativeTabs =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;
