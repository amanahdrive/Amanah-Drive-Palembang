import { Platform, useWindowDimensions } from "react-native";

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= 1024;
}

export function useIsTabletFrame(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width > 520 && width < 1024;
}
