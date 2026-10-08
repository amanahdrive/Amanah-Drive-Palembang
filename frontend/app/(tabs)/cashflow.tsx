import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, CalendarDays } from "lucide-react-native";

import { AppHeader } from "@/src/components/app-header";
import { FilterChips } from "@/src/components/filter-chips";
import { api, Transaction } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { formatRupiah, formatDateTimeID } from "@/src/lib/format";
import { toast } from "@/src/components/toast";
import { usesNativeTabs } from "@/src/navigation";

const CHIPS = [
  { key: "semua", label: "Semua" },
  { key: "masuk", label: "Kas Masuk" },
  { key: "keluar", label: "Kas Keluar" },
  { key: "bulan_ini", label: "Bulan Ini" },
];

export default function CashflowScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("semua");
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const { data = [], isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ["transactions", filter],
    queryFn: () =>
      api.listTransactions({
        jenis: filter === "masuk" || filter === "keluar" ? filter : undefined,
        bulan_ini: filter === "bulan_ini",
      }),
  });

  const totals = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    for (const t of data) {
      if (t.jenis === "masuk") masuk += t.jumlah;
      else keluar += t.jumlah;
    }
    return { masuk, keluar, sisa: masuk - keluar };
  }, [data]);

  const delMut = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Transaksi dihapus", "success");
    },
    onError: () => toast("Gagal menghapus transaksi", "error"),
  });

  const confirmDelete = (t: Transaction) => {
    Alert.alert("Hapus Transaksi", `Hapus "${t.keterangan || t.kategori}"?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => delMut.mutate(t.id) },
    ]);
  };

  return (
    <View style={styles.screen} testID="cashflow-screen">
      <AppHeader title="Cashflow" subtitle="Kas masuk & keluar" />

      <View style={styles.totalsRow}>
        <TotalCard label="Kas Masuk" value={totals.masuk} color={colors.success} icon={<ArrowDownCircle color={colors.success} size={18} />} testID="totals-masuk" />
        <TotalCard label="Kas Keluar" value={totals.keluar} color={colors.error} icon={<ArrowUpCircle color={colors.error} size={18} />} testID="totals-keluar" />
      </View>
      <View style={styles.sisaCard} testID="totals-sisa">
        <Text style={styles.sisaLabel}>Sisa Kas</Text>
        <Text style={[styles.sisaValue, { color: totals.sisa >= 0 ? colors.brandPrimary : colors.error }]}>
          {formatRupiah(totals.sisa)}
        </Text>
      </View>

      <FilterChips chips={CHIPS} active={filter} onChange={setFilter} testIDPrefix="cashflow-chip" />

      <FlatList
        data={data}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: (bottomChrome || 0) + 96,
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.brandPrimary} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brandPrimary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>Gagal memuat transaksi</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyDesc}>Tap tombol + untuk mencatat transaksi.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <TxRow tx={item} onDelete={() => confirmDelete(item)} />}
      />

      <View style={[styles.fabRow, { bottom: bottomChrome + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/transaction-form", params: { jenis: "masuk" } })}
          style={[styles.fab, { backgroundColor: colors.success }]}
          testID="cashflow-fab-masuk"
        >
          <Plus color={colors.onBrand} size={18} />
          <Text style={styles.fabText}>Masuk</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/transaction-form", params: { jenis: "keluar" } })}
          style={[styles.fab, { backgroundColor: colors.error }]}
          testID="cashflow-fab-keluar"
        >
          <Plus color={colors.onBrand} size={18} />
          <Text style={styles.fabText}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TotalCard({
  label,
  value,
  color,
  icon,
  testID,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={[styles.totalCard]} testID={testID}>
      <View style={styles.totalHead}>
        {icon}
        <Text style={styles.totalLabel}>{label}</Text>
      </View>
      <Text style={[styles.totalValue, { color }]} numberOfLines={1}>
        {formatRupiah(value)}
      </Text>
    </View>
  );
}

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const isMasuk = tx.jenis === "masuk";
  return (
    <View style={styles.tx} testID={`tx-${tx.id}`}>
      <View style={[styles.txIcon, { backgroundColor: (isMasuk ? colors.success : colors.error) + "18" }]}>
        {isMasuk ? (
          <ArrowDownCircle color={colors.success} size={22} />
        ) : (
          <ArrowUpCircle color={colors.error} size={22} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txKategori} numberOfLines={1}>
          {tx.kategori}
        </Text>
        {tx.keterangan ? (
          <Text style={styles.txKet} numberOfLines={1}>
            {tx.keterangan}
          </Text>
        ) : null}
        <View style={styles.txMeta}>
          <CalendarDays color={colors.muted} size={11} />
          <Text style={styles.txDate}>{formatDateTimeID(tx.tanggal)}</Text>
          {tx.siswa_nama ? <Text style={styles.txDate}>• {tx.siswa_nama}</Text> : null}
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={[styles.txAmount, { color: isMasuk ? colors.success : colors.error }]}>
          {isMasuk ? "+" : "-"}
          {formatRupiah(tx.jumlah)}
        </Text>
        <TouchableOpacity onPress={onDelete} testID={`tx-delete-${tx.id}`} hitSlop={10}>
          <Trash2 color={colors.muted} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceSecondary },

  totalsRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  totalCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  totalHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  totalLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  totalValue: { fontSize: 16, fontWeight: "800" },

  sisaCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary + "0A",
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brandPrimary + "22",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sisaLabel: { fontSize: 13, fontWeight: "700", color: colors.brandPrimary },
  sisaValue: { fontSize: 20, fontWeight: "900" },

  center: { paddingTop: spacing.xxxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  emptyDesc: { fontSize: 13, color: colors.muted, textAlign: "center" },
  errorText: { color: colors.error, fontWeight: "600" },
  retry: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.brandPrimary, borderRadius: radius.pill, marginTop: spacing.sm,
  },
  retryText: { color: colors.onBrand, fontWeight: "700" },

  tx: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  txIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
  },
  txKategori: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  txKet: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 1 },
  txMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  txDate: { fontSize: 11, color: colors.muted, fontWeight: "500" },
  txAmount: { fontSize: 14, fontWeight: "800" },

  fabRow: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },
  fab: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  fabText: { color: colors.onBrand, fontWeight: "800", fontSize: 14 },
});
