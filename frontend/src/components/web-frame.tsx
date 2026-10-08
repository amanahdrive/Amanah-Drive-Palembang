import React from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";

import { colors } from "@/src/theme";

// On web and larger tablets we constrain the app content to a
// phone-like width so the UI stays usable. On actual phones this
// is a transparent passthrough.
export function WebFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width > 520;

  if (!isWide) return <>{children}</>;

  return (
    <View style={styles.outer}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 440,
    height: "100%",
    maxHeight: 920,
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderRadius: 32,
    // Soft shadow around the "phone"
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
});
