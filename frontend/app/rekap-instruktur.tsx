import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Clock,
  Wallet,
} from "lucide-react-native";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { formatRupiah, parseNumberInput } from "@/src/lib/format";
import { useIsDesktop } from "@/src/hooks/use-breakpoint";

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function RekapInstrukturScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rateStr, setRateStr] = useState("50000");
  const rate = parseNumberInput(rateStr) || 50000;

  const bulan = `${year}-${pad(month)}`;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rekap-instruktur", bulan, rate],
    queryFn: () => api.rekapInstrukturs({ bulan, rate_per_jam: rate }),
  });

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setMonth(m);
    setYear(y);
  };

  return (
    <View style={styles.screen} testID="rekap-instruktur-screen">
      <Stack.Screen options={{ headerShown: false }} />
      {isDesktop ? null : (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} testID="rekap-back">
            <ArrowLeft color={colors.onSurface} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rekap Instruktur</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 48, gap: spacing.lg }}>
        {isDesktop ? (
          <Text style={styles.deskTitle}>Rekap Instruktur</Text>
        ) : null}

        <View style={styles.controls}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => shift(-1)} style={styles.navBtn} testID="rekap-prev">
              <ChevronLeft color={colors.brandPrimary} size={18} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS_ID[month - 1]} {year}</Text>
            <TouchableOpacity onPress={() => shift(1)} style={styles.navBtn} testID="rekap-next">
              <ChevronRight color={colors.brandPrimary} size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.rateWrap}>
            <Text style={styles.rateLabel}>Rate / Jam</Text>
            <TextInput
              value={formatRupiah(rate).replace("Rp ", "")}
              onChangeText={(v) => setRateStr(v.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              style={styles.rateInput}
              testID="rekap-rate"
            />
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsRow}>
          <TotalCard
            icon={<UserRound color={colors.brandPrimary} size={18} />}
            label="Total Instruktur"
            value={String(data?.items.length ?? 0)}
            color={colors.brandPrimary}
          />
          <TotalCard
            icon={<Clock color={colors.brandSecondary} size={18} />}
            label="Total Jam"
            value={`${data?.total_jam ?? 0} jam`}
            color={colors.brandSecondary}
          />
          <TotalCard
            icon={<Wallet color={colors.success} size={18} />}
            label="Estimasi Bagi Hasil"
            value={formatRupiah(data?.total_bagi_hasil ?? 0)}
            color={colors.success}
          />
        </View>

        {/* List */}
        <View style={styles.listCard}>
          <View style={styles.listHead}>
            <Text style={[styles.th, { flex: 2 }]}>INSTRUKTUR</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: "right" }]}>SESI</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: "right" }]}>JAM</Text>
            <Text style={[styles.th, { flex: 1.4, textAlign: "right" }]}>BAGI HASIL</Text>
          </View>
          {isLoading ? (
            <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>
          ) : (data?.items.length ?? 0) === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Belum ada jadwal pada {MONTHS_ID[month - 1]} {year}.</Text>
              <TouchableOpacity onPress={() => router.push("/schedule-form")} style={styles.ctaBtn} testID="rekap-add-schedule">
                <Text style={styles.ctaText}>Tambah Jadwal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            data?.items.map((it) => (
              <View key={it.instruktur} style={styles.row} testID={`rekap-row-${it.instruktur}`}>
                <View style={[styles.td, { flex: 2, flexDirection: "row", alignItems: "center", gap: spacing.sm }]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{it.instruktur.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.name}>{it.instruktur}</Text>
                </View>
                <Text style={[styles.td, styles.tdNum, { flex: 0.9, textAlign: "right" }]}>{it.total_sesi}</Text>
                <Text style={[styles.td, styles.tdNum, { flex: 0.9, textAlign: "right" }]}>{it.total_jam}</Text>
                <Text style={[styles.td, styles.tdNum, { flex: 1.4, textAlign: "right", color: colors.success, fontWeight: "900" }]}>
                  {formatRupiah(it.estimasi_bagi_hasil)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function TotalCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.totalCard}>
      <View style={[styles.totalIcon, { backgroundColor: color + "18" }]}>{icon}</View>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.onSurface },
  deskTitle: { fontSize: 22, fontWeight: "900", color: colors.onSurface, letterSpacing: 0.2 },

  controls: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: spacing.md,
  },
  monthNav: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  navBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 13, fontWeight: "800", color: colors.onSurface, minWidth: 110, textAlign: "center" },

  rateWrap: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  rateLabel: { fontSize: 11, fontWeight: "800", color: colors.muted, letterSpacing: 0.4 },
  rateInput: {
    fontSize: 13, fontWeight: "800", color: colors.brandPrimary, minWidth: 90,
    paddingVertical: Platform.select({ ios: 2, default: 0 }),
  },

  totalsRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  totalCard: {
    flex: 1, minWidth: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.divider,
  },
  totalIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  totalLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.4 },
  totalValue: { fontSize: 18, fontWeight: "900", color: colors.onSurface, marginTop: 2 },

  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.divider,
    overflow: "hidden",
  },
  listHead: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  th: { fontSize: 10, color: colors.muted, fontWeight: "800", letterSpacing: 0.6 },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  td: { fontSize: 13, color: colors.onSurfaceSecondary },
  tdNum: { fontVariant: ["tabular-nums"] },
  name: { fontSize: 14, fontWeight: "800", color: colors.onSurface },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.onBrand, fontWeight: "900" },

  center: { padding: spacing.xl, alignItems: "center", gap: spacing.md },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center" },
  ctaBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderRadius: radius.pill, backgroundColor: colors.brandPrimary,
  },
  ctaText: { color: colors.onBrand, fontWeight: "800" },
});
