import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  GraduationCap,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react-native";

import { AppHeader } from "@/src/components/app-header";
import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { formatRupiah, formatRupiahShort } from "@/src/lib/format";
import { usesNativeTabs } from "@/src/navigation";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
  });

  return (
    <View style={styles.screen} testID="dashboard-screen">
      <AppHeader title="Amanah Drive" subtitle="Dashboard Operasional" />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: (bottomChrome || 0) + spacing.xxl,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.brandPrimary} />
        }
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.loading}>
            <Text style={styles.errorText}>Gagal memuat dashboard</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn} testID="dashboard-retry">
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Hero: Sisa Kas */}
            <View style={styles.heroWrap}>
              <LinearGradient
                colors={[colors.brandPrimary, colors.brandSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroHead}>
                  <View style={styles.heroIcon}>
                    <Wallet color={colors.onBrand} size={18} />
                  </View>
                  <Text style={styles.heroLabel}>Sisa Kas</Text>
                </View>
                <Text style={styles.heroValue} testID="dashboard-sisa-kas">
                  {formatRupiah(data?.sisa_kas ?? 0)}
                </Text>
                <View style={styles.heroRow}>
                  <View style={styles.heroStat}>
                    <ArrowDownCircle color={colors.brandTertiary} size={16} />
                    <Text style={styles.heroStatLabel}>Masuk</Text>
                    <Text style={styles.heroStatValue}>
                      {formatRupiahShort(data?.kas_masuk_total ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStat}>
                    <ArrowUpCircle color="#FCA5A5" size={16} />
                    <Text style={styles.heroStatLabel}>Keluar</Text>
                    <Text style={styles.heroStatValue}>
                      {formatRupiahShort(data?.kas_keluar_total ?? 0)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Monthly cards */}
            <Text style={styles.sectionTitle}>Bulan Ini</Text>
            <View style={styles.gridRow}>
              <SummaryCard
                label="Kas Masuk"
                value={formatRupiah(data?.kas_masuk_bulan ?? 0)}
                color={colors.success}
                icon={<ArrowDownCircle color={colors.success} size={20} />}
                testID="card-kas-masuk-bulan"
              />
              <SummaryCard
                label="Kas Keluar"
                value={formatRupiah(data?.kas_keluar_bulan ?? 0)}
                color={colors.error}
                icon={<ArrowUpCircle color={colors.error} size={20} />}
                testID="card-kas-keluar-bulan"
              />
            </View>

            {/* 7-day chart */}
            <Text style={styles.sectionTitle}>Cashflow 7 Hari</Text>
            <View style={styles.card}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Masuk</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={styles.legendText}>Keluar</Text>
                </View>
              </View>
              <Chart7Days data={data?.chart_7hari ?? []} />
            </View>

            {/* Siswa stats */}
            <Text style={styles.sectionTitle}>Data Siswa</Text>
            <View style={styles.gridRow}>
              <SummaryCard
                label="Siswa Aktif"
                value={String(data?.siswa_aktif ?? 0)}
                color={colors.brandSecondary}
                icon={<Users color={colors.brandSecondary} size={20} />}
                testID="card-siswa-aktif"
              />
              <SummaryCard
                label="On Progress"
                value={String(data?.siswa_on_progress ?? 0)}
                color={colors.brandTertiary}
                icon={<TrendingUp color={colors.brandSecondary} size={20} />}
                testID="card-siswa-on-progress"
              />
            </View>
            <View style={styles.gridRow}>
              <SummaryCard
                label="Selesai"
                value={String(data?.siswa_selesai ?? 0)}
                color={colors.success}
                icon={<GraduationCap color={colors.success} size={20} />}
                testID="card-siswa-selesai"
              />
              <SummaryCard
                label="Total Siswa"
                value={String(data?.total_siswa ?? 0)}
                color={colors.brandPrimary}
                icon={<Users color={colors.brandPrimary} size={20} />}
                testID="card-siswa-total"
              />
            </View>

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
            <View style={styles.gridRow}>
              <ActionTile
                label="Kas Masuk"
                color={colors.success}
                onPress={() =>
                  router.push({ pathname: "/transaction-form", params: { jenis: "masuk" } })
                }
                testID="action-kas-masuk"
              />
              <ActionTile
                label="Kas Keluar"
                color={colors.error}
                onPress={() =>
                  router.push({ pathname: "/transaction-form", params: { jenis: "keluar" } })
                }
                testID="action-kas-keluar"
              />
            </View>
            <View style={styles.gridRow}>
              <ActionTile
                label="Tambah Siswa"
                color={colors.brandPrimary}
                onPress={() => router.push("/student-form")}
                testID="action-tambah-siswa"
                full
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  color,
  icon,
  testID,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={[styles.card, styles.summaryCard]} testID={testID}>
      <View style={[styles.summaryIconWrap, { backgroundColor: color + "15" }]}>
        {icon}
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionTile({
  label,
  color,
  onPress,
  testID,
  full,
}: {
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
  full?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.actionTile,
        { backgroundColor: color },
        full && { flex: 1 },
      ]}
      testID={testID}
    >
      <Plus color={colors.onBrand} size={18} />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Chart7Days({ data }: { data: { label: string; masuk: number; keluar: number }[] }) {
  if (data.length === 0) {
    return <Text style={styles.emptyMuted}>Belum ada data transaksi.</Text>;
  }
  const max = Math.max(1, ...data.map((d) => Math.max(d.masuk, d.keluar)));
  const H = 110;
  return (
    <View style={styles.chartWrap}>
      {data.map((d, idx) => {
        const inH = Math.max(2, (d.masuk / max) * H);
        const outH = Math.max(2, (d.keluar / max) * H);
        return (
          <View key={idx} style={styles.chartCol} testID={`chart-col-${idx}`}>
            <View style={styles.chartBars}>
              <View
                style={[
                  styles.bar,
                  { height: inH, backgroundColor: colors.success },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  { height: outH, backgroundColor: colors.error, marginLeft: 2 },
                ]}
              />
            </View>
            <Text style={styles.chartLabel}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loading: { padding: spacing.xxl, alignItems: "center", gap: spacing.md },
  errorText: { color: colors.error, fontSize: 14, fontWeight: "600" },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
  },
  retryText: { color: colors.onBrand, fontWeight: "700" },

  heroWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.brandPrimary,
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  heroHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    color: colors.onBrand,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    opacity: 0.9,
  },
  heroValue: {
    marginTop: spacing.md,
    color: colors.onBrand,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  heroRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  heroStat: { flex: 1, flexDirection: "column", gap: 2 },
  heroStatLabel: { color: colors.onBrand, opacity: 0.75, fontSize: 11, fontWeight: "600", marginTop: 2 },
  heroStatValue: { color: colors.onBrand, fontSize: 15, fontWeight: "700" },
  heroDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.25)" },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.2,
  },

  gridRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 0,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
  },

  actionTile: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionText: { color: colors.onBrand, fontWeight: "700", fontSize: 14 },

  chartLegend: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  chartWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
  },
  chartCol: { alignItems: "center", flex: 1 },
  chartBars: { flexDirection: "row", alignItems: "flex-end", height: 110 },
  bar: { width: 10, borderRadius: 4 },
  chartLabel: { marginTop: spacing.sm, fontSize: 10, color: colors.muted, fontWeight: "600" },

  emptyMuted: { color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: spacing.lg },
});
