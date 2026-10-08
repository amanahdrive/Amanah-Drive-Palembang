import React from "react";
import { View, StyleSheet } from "react-native";

import { colors } from "@/src/theme";
import { useIsDesktop, useIsTabletFrame } from "@/src/hooks/use-breakpoint";
import { Sidebar } from "@/src/components/sidebar";
import { TopBar } from "@/src/components/top-bar";

/**
 * Decides the outer shell:
 *  - Desktop web (>= 1024px): sidebar + topbar + content area.
 *  - Tablet web (521–1023px): phone-sized frame on dark background.
 *  - Phone and native: passthrough.
 */
export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const isTabletFrame = useIsTabletFrame();

  if (isDesktop) {
    return (
      <View style={styles.deskRoot}>
        <Sidebar />
        <View style={{ flex: 1 }}>
          <TopBar />
          <View style={styles.deskContent}>{children}</View>
        </View>
      </View>
    );
  }

  if (isTabletFrame) {
    return (
      <View style={styles.frameOuter}>
        <View style={styles.frame}>{children}</View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  deskRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
  },
  deskContent: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  frameOuter: {
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
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
});
