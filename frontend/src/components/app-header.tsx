import React from "react";
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { UserCircle2 } from "lucide-react-native";

import { colors, spacing } from "@/src/theme";

type Props = {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showProfil?: boolean;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, showLogo = true, showProfil = false, right }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]} testID="app-header">
      <View style={styles.row}>
        {showLogo ? (
          <Image
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={require("../../assets/images/logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : null}
        <View style={styles.titleWrap}>
          {title ? (
            <Text style={styles.title} testID="app-header-title">
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
        {showProfil ? (
          <TouchableOpacity
            onPress={() => router.push("/profil")}
            style={styles.profilBtn}
            testID="header-profil-btn"
            hitSlop={10}
          >
            <UserCircle2 color={colors.brandPrimary} size={26} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: Platform.OS === "web" ? 1 : StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  right: { marginLeft: spacing.sm },
  profilBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});
