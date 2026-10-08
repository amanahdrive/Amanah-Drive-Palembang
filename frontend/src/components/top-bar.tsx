import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { RefreshCw, UserCircle2, Volume2 } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { colors, radius, spacing } from "@/src/theme";

function greeting(hour: number): string {
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 19) return "Selamat Sore";
  return "Selamat Malam";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function TopBar() {
  const router = useRouter();
  const qc = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;

  return (
    <View style={styles.topbar} testID="desktop-topbar">
      <View style={styles.left}>
        <View style={styles.syncDot} />
        <Text style={styles.syncLabel}>SYNC:</Text>
        <Text style={styles.syncTime}>{timeStr}</Text>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.iconBtn} hitSlop={8} testID="topbar-mute">
        <Volume2 color={colors.muted} size={18} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.syncBtn}
        onPress={() => qc.invalidateQueries()}
        activeOpacity={0.8}
        testID="topbar-sync"
      >
        <RefreshCw color={colors.brandSecondary} size={14} />
        <Text style={styles.syncBtnText}>SYNC</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/profil")}
        activeOpacity={0.85}
        style={styles.userRow}
        testID="topbar-user"
      >
        <UserCircle2 color={colors.brandPrimary} size={32} />
        <View>
          <Text style={styles.userGreeting}>{greeting(now.getHours())}, Admin</Text>
          <Text style={styles.userRole}>KEUANGAN · Pengaturan</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 6 },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  syncLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 },
  syncTime: { fontSize: 13, fontWeight: "800", color: colors.onSurface, fontVariant: ["tabular-nums"] },

  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  syncBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary + "22",
  },
  syncBtnText: { color: colors.brandSecondary, fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },

  userRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md,
  },
  userGreeting: { fontSize: 13, fontWeight: "800", color: colors.onSurface },
  userRole: {
    fontSize: 10, fontWeight: "700", color: colors.brandSecondary,
    marginTop: 2, letterSpacing: 0.4,
  },
});
