import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Info, ShieldCheck } from "lucide-react-native";

import { colors, radius, spacing } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { InstagramIcon, TikTokIcon, FacebookIcon } from "@/src/components/brand-icons";

const SOCIALS: {
  key: string;
  label: string;
  handle: string;
  url: string;
  color: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
}[] = [
  {
    key: "ig",
    label: "Instagram",
    handle: "@amanahdrive_plg",
    url: "https://instagram.com/amanahdrive_plg",
    color: "#E1306C",
    Icon: InstagramIcon,
  },
  {
    key: "tt",
    label: "TikTok",
    handle: "@amanahdrive_plg",
    url: "https://tiktok.com/@amanahdrive_plg",
    color: "#111111",
    Icon: TikTokIcon,
  },
  {
    key: "fb",
    label: "Facebook",
    handle: "amanahdrive_plg",
    url: "https://facebook.com/amanahdrive_plg",
    color: "#1877F2",
    Icon: FacebookIcon,
  },
];

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.screen} testID="profil-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: (bottomChrome || 0) + spacing.xxl }}
      >
        <View style={[styles.banner, { paddingTop: insets.top + spacing.xl }]}>
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary, colors.brandTertiary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.logoWrap}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              source={require("../../assets/images/logo.jpeg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>Amanah Drive</Text>
          <Text style={styles.tagline}>Terampil Mengemudi, Aman di Jalan.</Text>
        </View>

        <Text style={styles.sectionTitle}>Media Sosial</Text>
        <View style={styles.list}>
          {SOCIALS.map(({ key, label, handle, url, color, Icon }) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.85}
              onPress={() => open(url)}
              style={styles.row}
              testID={`social-${key}`}
            >
              <View style={[styles.rowIcon, { backgroundColor: color + "18" }]}>
                <Icon color={color} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowHandle}>{handle}</Text>
              </View>
              <Text style={styles.rowCta}>Buka</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
        <View style={styles.list}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.brandPrimary + "18" }]}>
              <Info color={colors.brandPrimary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Versi Aplikasi</Text>
              <Text style={styles.rowHandle}>1.0.0 (MVP)</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.success + "18" }]}>
              <ShieldCheck color={colors.success} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Mode</Text>
              <Text style={styles.rowHandle}>Internal — tanpa login</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} Amanah Drive Palembang</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceSecondary },
  banner: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
    overflow: "hidden",
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  logo: { width: 84, height: 84 },
  brand: { fontSize: 22, fontWeight: "900", color: colors.onBrand, letterSpacing: 0.5 },
  tagline: { marginTop: 4, fontSize: 12, color: colors.onBrand, opacity: 0.9, fontWeight: "500" },

  sectionTitle: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  list: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  rowHandle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rowCta: { fontSize: 12, fontWeight: "700", color: colors.brandSecondary },

  footer: {
    textAlign: "center",
    marginTop: spacing.xl,
    fontSize: 11,
    color: colors.muted,
  },
});
