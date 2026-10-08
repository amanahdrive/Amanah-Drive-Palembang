import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter, useSegments } from "expo-router";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarDays,
  UserCircle2,
} from "lucide-react-native";

import { colors, radius, spacing } from "@/src/theme";

type NavItem = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
  path: "/" | "/siswa" | "/cashflow" | "/jadwal" | "/profil";
  seg: string | null;
};

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard, path: "/", seg: "index" },
  { key: "siswa", label: "Manajemen Siswa", Icon: Users, path: "/siswa", seg: "siswa" },
  { key: "jadwal", label: "Jadwal Kursus", Icon: CalendarDays, path: "/jadwal", seg: "jadwal" },
  { key: "cashflow", label: "Kas & Keuangan", Icon: Wallet, path: "/cashflow", seg: "cashflow" },
  { key: "profil", label: "Pengaturan", Icon: UserCircle2, path: "/profil", seg: "profil" },
];

export function Sidebar() {
  const router = useRouter();
  const segments = useSegments();
  // segments example: ["(tabs)"] for /  or ["(tabs)", "siswa"] for /siswa
  const current = segments[segments.length - 1] ?? "index";
  const normalized = current === "(tabs)" ? "index" : current;

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandRow}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require("../../assets/images/logo.jpeg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.brandText}>Amanah Drive</Text>
          <Text style={styles.brandSub}>Admin Console</Text>
        </View>
      </View>

      <View style={{ gap: 4, marginTop: spacing.lg }}>
        {NAV.map((item) => {
          const isActive = item.seg === normalized;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              onPress={() => router.push(item.path)}
              style={[styles.navItem, isActive && styles.navItemActive]}
              testID={`sidebar-${item.key}`}
            >
              <item.Icon
                color={isActive ? colors.onBrand : colors.onSurfaceSecondary}
                size={18}
              />
              <Text
                style={[styles.navLabel, isActive && styles.navLabelActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Amanah Drive Console</Text>
        <Text style={styles.footerSub}>Sistem Operasional & Manajemen Internal</Text>
        <Text style={styles.footerSmall}>CV AMANAH DRIVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandText: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.brandPrimary,
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
    marginTop: 2,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  navItemActive: {
    backgroundColor: colors.brandPrimary,
  },
  navLabel: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  navLabelActive: {
    color: colors.onBrand,
    fontWeight: "700",
  },

  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerTitle: { fontSize: 11, fontWeight: "800", color: colors.onSurface },
  footerSub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  footerSmall: { fontSize: 9, color: colors.muted, marginTop: 2, letterSpacing: 0.4 },
});
