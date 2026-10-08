import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  Wallet,
  Users,
  CalendarDays,
  RefreshCw,
  UserPlus,
  CalendarPlus,
  Receipt,
  CreditCard,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
} from "lucide-react-native";

import { api, PaymentReminder, Schedule } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { formatRupiah } from "@/src/lib/format";
import { downloadCashflowPdf } from "@/src/lib/pdf";
import { openWhatsApp } from "@/src/lib/whatsapp";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const DAYS_ID = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function todayLabel(): string {
  const d = new Date();
  return `${DAYS_ID[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function DesktopDashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
  });

  if (isLoading) {
    return (
      <View style={styles.loading} testID="desktop-dashboard">
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const kasMasuk = data?.kas_masuk_bulan ?? 0;
  const kasKeluar = data?.kas_keluar_bulan ?? 0;
  const netBulan = kasMasuk - kasKeluar;
  const sisaKas = data?.sisa_kas ?? 0;
  const onProgress = data?.siswa_on_progress ?? 0;
  const selesai = data?.siswa_selesai ?? 0;
  const jadwalToday = data?.jadwal_hari_ini ?? [];
  const reminders = data?.pengingat_pembayaran ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="desktop-dashboard"
    >
      {/* Title row with actions */}
      <View style={styles.titleRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Dashboard Operasional</Text>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{todayLabel()}</Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <ActionBtn
            label="Sinkronkan Data"
            Icon={RefreshCw}
            onPress={() => { qc.invalidateQueries(); refetch(); }}
            testID="action-sync"
          />
          <ActionBtn
            label="+ Siswa Baru"
            Icon={UserPlus}
            onPress={() => router.push("/student-form")}
            primary
            testID="action-siswa-baru"
          />
          <ActionBtn
            label="+ Jadwal"
            Icon={CalendarPlus}
            onPress={() => router.push("/schedule-form")}
            testID="action-jadwal"
          />
          <ActionBtn
            label="Catat Kas"
            Icon={Receipt}
            onPress={() => router.push({ pathname: "/transaction-form", params: { jenis: "masuk" } })}
            testID="action-catat-kas"
          />
          <ActionBtn
            label="Laporan PDF"
            Icon={BarChart3}
            onPress={() => downloadCashflowPdf()}
            testID="action-pdf"
          />
        </View>
      </View>

      {/* Metric cards */}
      <View style={styles.metricsRow}>
        <MetricCard
          label="KAS MASUK (BULAN INI)"
          value={formatRupiah(kasMasuk)}
          valueColor={colors.brandPrimary}
          Icon={TrendingUp}
          iconTint={colors.success}
          footerLeft={`Keluar: ${formatRupiah(kasKeluar)}`}
          footerRight={`Net: ${netBulan >= 0 ? "+" : "–"}${formatRupiah(Math.abs(netBulan))}`}
          footerRightColor={netBulan >= 0 ? colors.success : colors.error}
          testID="metric-kas-masuk"
        />
        <MetricCard
          label="SALDO KAS LIKUID"
          value={formatRupiah(sisaKas)}
          valueColor={colors.success}
          Icon={Wallet}
          iconTint={colors.brandSecondary}
          footerLeft="Kas Tunai & Rekening"
          testID="metric-saldo"
        />
        <MetricCard
          label="SISWA ON PROGRESS"
          value={String(onProgress)}
          suffix="Siswa"
          valueColor={colors.brandPrimary}
          Icon={Users}
          iconTint={colors.brandPrimary}
          footerLeft={`+${(data?.siswa_aktif ?? 0)} Aktif`}
          footerRight={`${selesai} Lulus`}
          footerRightColor={colors.success}
          testID="metric-on-progress"
        />
        <MetricCard
          label="SESI HARI INI"
          value={String(jadwalToday.length)}
          suffix="Sesi"
          valueColor={"#7C3AED"}
          Icon={CalendarDays}
          iconTint={"#7C3AED"}
          footerLeft="0 Selesai"
          footerRight={`${jadwalToday.length} Terjadwal`}
          footerRightColor={colors.warning}
          testID="metric-sesi-hari-ini"
        />
      </View>

      {/* Two column: left big (jadwal), right (status/analytics) */}
      <View style={styles.twoCol}>
        <View style={styles.leftCol}>
          <JadwalTable items={jadwalToday} />
          <View style={styles.chartsRow}>
            <ChartCard title="Tren Pendaftaran Siswa" subtitle="Hitungan transaksi masuk tipe pendaftaran">
              <BarsChart data={data?.chart_7hari ?? []} />
            </ChartCard>
            <ChartCard title="Cashflow (Masuk vs Keluar)" subtitle="7 hari terakhir">
              <LinesChart data={data?.chart_7hari ?? []} />
            </ChartCard>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.statusCard} testID="status-card">
            <Text style={styles.statusTitle}>STATUS OPERASIONAL</Text>
            <StatusRow
              title="Siswa Siap Diluluskan"
              sub={`${selesai} siswa sudah selesai paket`}
              bg={colors.brandTertiary + "22"}
              fg={colors.brandSecondary}
              Icon={CreditCard}
              onPress={() => router.push("/(tabs)/siswa")}
            />
            <StatusRow
              title="Follow Up Pelunasan"
              sub={`${reminders.length} siswa belum lunas`}
              bg={colors.warning + "22"}
              fg={colors.warning}
              Icon={AlertCircle}
              onPress={() => router.push("/(tabs)/siswa")}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/cashflow")}
            activeOpacity={0.9}
            style={styles.analyticsCard}
            testID="analytics-card"
          >
            <View style={styles.analyticsHead}>
              <BarChart3 color={colors.brandSecondary} size={18} />
              <Text style={styles.analyticsTitle}>Pusat Analitik & Performa</Text>
            </View>
            <Text style={styles.analyticsSub}>Laporan keuangan, siswa & jadwal</Text>
            <ChevronRight color={colors.muted} size={18} style={{ position: "absolute", right: 16, top: 20 }} />
          </TouchableOpacity>

          {/* Reminders quick */}
          {reminders.length > 0 ? (
            <View style={styles.remindersCard}>
              <Text style={styles.statusTitle}>PENGINGAT PEMBAYARAN</Text>
              {reminders.slice(0, 4).map((r) => (
                <ReminderRow key={r.siswa_id} r={r} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function ActionBtn({
  label,
  Icon,
  onPress,
  primary,
  testID,
}: {
  label: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
  onPress: () => void;
  primary?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.actionBtn, primary && styles.actionBtnPrimary]}
      testID={testID}
    >
      <Icon color={primary ? colors.onBrand : colors.onSurfaceSecondary} size={14} />
      <Text style={[styles.actionBtnText, primary && styles.actionBtnTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  valueColor,
  Icon,
  iconTint,
  footerLeft,
  footerRight,
  footerRightColor,
  testID,
}: {
  label: string;
  value: string;
  suffix?: string;
  valueColor: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
  iconTint: string;
  footerLeft?: string;
  footerRight?: string;
  footerRightColor?: string;
  testID?: string;
}) {
  return (
    <View style={styles.metricCard} testID={testID}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Icon color={iconTint} size={16} />
      </View>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
        {suffix ? <Text style={styles.metricSuffix}>{suffix}</Text> : null}
      </View>
      <View style={styles.metricFooter}>
        {footerLeft ? <Text style={styles.metricFooterText}>{footerLeft}</Text> : null}
        <View style={{ flex: 1 }} />
        {footerRight ? (
          <Text style={[styles.metricFooterRight, footerRightColor && { color: footerRightColor }]}>
            {footerRight}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function JadwalTable({ items }: { items: Schedule[] }) {
  const d = new Date();
  const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return (
    <View style={styles.tableCard} testID="jadwal-table">
      <View style={styles.tableHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <CalendarDays color={colors.brandSecondary} size={16} />
          <Text style={styles.tableTitle}>Jadwal Kursus Lapangan ({dateStr})</Text>
        </View>
        <View style={styles.tabs}>
          <View style={[styles.tabPill, styles.tabPillActive]}>
            <Text style={styles.tabPillTextActive}>Semua ({items.length})</Text>
          </View>
          <View style={styles.tabPill}>
            <Text style={styles.tabPillText}>Terjadwal ({items.length})</Text>
          </View>
          <View style={styles.tabPill}>
            <Text style={styles.tabPillText}>Selesai (0)</Text>
          </View>
        </View>
      </View>
      <View style={styles.tableHeadRow}>
        <Text style={[styles.th, { flex: 1.1 }]}>SLOT WAKTU</Text>
        <Text style={[styles.th, { flex: 1.3 }]}>NAMA SISWA</Text>
        <Text style={[styles.th, { flex: 0.7 }]}>SESI</Text>
        <Text style={[styles.th, { flex: 1 }]}>INSTRUKTUR</Text>
        <Text style={[styles.th, { flex: 1 }]}>CATATAN</Text>
        <Text style={[styles.th, { flex: 0.8 }]}>STATUS</Text>
        <Text style={[styles.th, { flex: 0.6, textAlign: "right" }]}>KONTAK</Text>
      </View>
      {items.length === 0 ? (
        <View style={styles.tableEmpty}>
          <Text style={styles.tableEmptyText}>Belum ada jadwal hari ini.</Text>
        </View>
      ) : (
        items.map((it) => (
          <View key={it.id} style={styles.tableRow} testID={`jadwal-row-${it.id}`}>
            <Text style={[styles.td, styles.tdLink, { flex: 1.1 }]}>
              {it.jam_mulai} – {it.jam_selesai}
            </Text>
            <Text style={[styles.td, { flex: 1.3, fontWeight: "700", color: colors.onSurface }]}>
              {it.siswa_nama || "Tanpa siswa"}
            </Text>
            <Text style={[styles.td, { flex: 0.7, color: colors.muted }]}>1 sesi</Text>
            <Text style={[styles.td, { flex: 1 }]}>{it.instruktur}</Text>
            <Text style={[styles.td, { flex: 1, color: colors.muted }]} numberOfLines={1}>
              {it.catatan || "-"}
            </Text>
            <View style={{ flex: 0.8 }}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>TERJADWAL</Text>
              </View>
            </View>
            <View style={{ flex: 0.6, alignItems: "flex-end" }}>
              <TouchableOpacity
                onPress={() => it.siswa_nama && openWhatsApp("", `Reminder jadwal ${it.jam_mulai} dengan ${it.instruktur}`)}
                activeOpacity={0.85}
                style={styles.waPill}
                testID={`jadwal-wa-${it.id}`}
              >
                <MessageCircle color="#25D366" size={13} />
                <Text style={styles.waPillText}>WA</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chartLabelTop}>FINANSIAL OPERASIONAL</Text>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSub}>{subtitle}</Text>
        </View>
        <View style={styles.chartBadge}>
          <Text style={styles.chartBadgeText}>REALTIME</Text>
        </View>
      </View>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

function BarsChart({ data }: { data: { label: string; masuk: number; keluar: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.masuk + d.keluar));
  return (
    <View style={styles.barsWrap}>
      {data.map((d, i) => {
        const total = d.masuk + d.keluar;
        const h = Math.max(4, (total / max) * 160);
        return (
          <View key={i} style={styles.barsCol}>
            <View style={[styles.bar, { height: h }]} />
            <Text style={styles.barLabel}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function LinesChart({ data }: { data: { label: string; masuk: number; keluar: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.masuk, d.keluar)));
  const H = 160;
  const n = data.length || 1;
  const step = 100 / Math.max(1, n - 1);
  const line = (vals: number[]) =>
    vals.map((v, i) => {
      const y = H - (v / max) * (H - 10) - 5;
      return `${i === 0 ? "M" : "L"} ${(i * step).toFixed(2)}% ${y}`;
    }).join(" ");

  return (
    <View style={{ height: H + 24 }}>
      <View style={{ height: H, position: "relative" }}>
        {/* We fake "line" by drawing a series of mini bars on top of each other – a lightweight viz without react-native-svg clipping issues */}
        {data.map((d, i) => {
          const left = `${(i * step).toFixed(2)}%`;
          const inH = Math.max(2, (d.masuk / max) * (H - 10));
          const outH = Math.max(2, (d.keluar / max) * (H - 10));
          return (
            <React.Fragment key={i}>
              <View style={{ position: "absolute", left: left as unknown as number, bottom: 0, width: 8, height: inH, backgroundColor: colors.success + "AA", borderRadius: 2 }} />
              <View style={{ position: "absolute", left: left as unknown as number, bottom: 0, marginLeft: 10, width: 8, height: outH, backgroundColor: colors.error + "AA", borderRadius: 2 }} />
            </React.Fragment>
          );
        })}
      </View>
      <View style={styles.lineLegendRow}>
        {data.map((d, i) => (
          <Text key={i} style={styles.barLabel}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

function StatusRow({
  title,
  sub,
  bg,
  fg,
  Icon,
  onPress,
}: {
  title: string;
  sub: string;
  bg: string;
  fg: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.statusRow, { backgroundColor: bg }]}>
      <View style={[styles.statusIcon, { backgroundColor: fg + "22" }]}>
        <Icon color={fg} size={16} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statusRowTitle}>{title}</Text>
        <Text style={styles.statusRowSub}>{sub}</Text>
      </View>
      <ChevronRight color={colors.muted} size={16} />
    </TouchableOpacity>
  );
}

function ReminderRow({ r }: { r: PaymentReminder }) {
  const message =
    `Halo ${r.nama}, 🙏\n\n` +
    `Pengingat pembayaran kursus di *Amanah Drive*:\n` +
    `• Paket: ${r.paket}\n` +
    `• Sisa tagihan: *${formatRupiah(r.sisa_bayar)}*\n\n` +
    `Mohon konfirmasi. Terima kasih 🚗`;
  return (
    <View style={styles.remRow} testID={`desktop-reminder-${r.siswa_id}`}>
      <View style={{ flex: 1 }}>
        <Text style={styles.remName}>{r.nama}</Text>
        <Text style={styles.remSub}>Sisa {formatRupiah(r.sisa_bayar)} · {r.paket}</Text>
      </View>
      <TouchableOpacity
        onPress={() => openWhatsApp(r.telepon, message)}
        activeOpacity={0.85}
        style={styles.remWa}
        testID={`desktop-reminder-wa-${r.siswa_id}`}
      >
        <MessageCircle color={colors.onBrand} size={13} />
        <Text style={styles.remWaText}>WA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, maxWidth: 1440, alignSelf: "stretch" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: 22, fontWeight: "900", color: colors.onSurface, letterSpacing: 0.2 },
  datePill: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
  },
  datePillText: { fontSize: 11, color: colors.onSurfaceSecondary, fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" },

  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  actionBtnPrimary: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: colors.onSurfaceSecondary },
  actionBtnTextPrimary: { color: colors.onBrand },

  metricsRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  metricCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    ...Platform.select({
      web: { boxShadow: "0 1px 2px rgba(0,0,0,0.03)" } as any,
      default: {},
    }),
  },
  metricHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  metricLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, letterSpacing: 0.6 },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  metricValue: { fontSize: 24, fontWeight: "900" },
  metricSuffix: { fontSize: 13, fontWeight: "700", color: colors.muted },
  metricFooter: {
    marginTop: spacing.sm,
    flexDirection: "row", alignItems: "center",
    borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm,
  },
  metricFooterText: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  metricFooterRight: { fontSize: 11, color: colors.onSurfaceSecondary, fontWeight: "800" },

  twoCol: { flexDirection: "row", gap: spacing.lg, flexWrap: "wrap" },
  leftCol: { flex: 2.3, gap: spacing.lg, minWidth: 540 },
  rightCol: { flex: 1, gap: spacing.lg, minWidth: 280 },

  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: "hidden",
  },
  tableHead: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  tableTitle: { fontSize: 14, fontWeight: "800", color: colors.onSurface },
  tabs: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: 3 },
  tabPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md },
  tabPillActive: { backgroundColor: colors.brandPrimary },
  tabPillText: { fontSize: 11, color: colors.onSurfaceSecondary, fontWeight: "700" },
  tabPillTextActive: { fontSize: 11, color: colors.onBrand, fontWeight: "800" },
  tableHeadRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  th: { fontSize: 10, color: colors.muted, fontWeight: "800", letterSpacing: 0.6 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  td: { fontSize: 12.5, color: colors.onSurfaceSecondary, fontWeight: "600" },
  tdLink: { color: colors.brandSecondary, fontWeight: "800" },
  tableEmpty: { padding: spacing.xl, alignItems: "center" },
  tableEmptyText: { fontSize: 13, color: colors.muted },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.warning + "22",
  },
  statusBadgeText: { fontSize: 10, fontWeight: "900", color: colors.warning, letterSpacing: 0.5 },

  waPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill,
    borderWidth: 1, borderColor: "#25D366",
  },
  waPillText: { fontSize: 10, fontWeight: "800", color: "#25D366" },

  chartsRow: { flexDirection: "row", gap: spacing.lg, flexWrap: "wrap" },
  chartCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chartHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  chartLabelTop: { fontSize: 10, color: colors.muted, letterSpacing: 0.6, fontWeight: "800" },
  chartTitle: { fontSize: 14, fontWeight: "800", color: colors.onSurface, marginTop: 2 },
  chartSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  chartBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary + "33",
  },
  chartBadgeText: { fontSize: 10, color: colors.brandSecondary, fontWeight: "900", letterSpacing: 0.5 },

  barsWrap: { height: 190, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  barsCol: { flex: 1, alignItems: "center", gap: 6 },
  bar: { width: 24, borderRadius: 4, backgroundColor: colors.brandSecondary },
  barLabel: { fontSize: 10, color: colors.muted, fontWeight: "700" },

  lineLegendRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },

  statusCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm,
  },
  statusTitle: { fontSize: 10, fontWeight: "900", color: colors.muted, letterSpacing: 0.6, marginBottom: 4 },
  statusRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md,
  },
  statusIcon: {
    width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  statusRowTitle: { fontSize: 13, fontWeight: "800", color: colors.onSurface },
  statusRowSub: { fontSize: 11, color: colors.muted, marginTop: 2 },

  analyticsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.lg,
  },
  analyticsHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  analyticsTitle: { fontSize: 13, fontWeight: "800", color: colors.onSurface },
  analyticsSub: { fontSize: 11, color: colors.muted, marginTop: 4 },

  remindersCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm,
  },
  remRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  remName: { fontSize: 13, fontWeight: "800", color: colors.onSurface },
  remSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  remWa: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: "#25D366",
  },
  remWaText: { color: colors.onBrand, fontWeight: "800", fontSize: 11 },
});
