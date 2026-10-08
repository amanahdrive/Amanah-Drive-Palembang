import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Plus,
  Clock,
  UserRound,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react-native";

import { AppHeader } from "@/src/components/app-header";
import { api, Schedule } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { toast } from "@/src/components/toast";
import { useIsDesktop } from "@/src/hooks/use-breakpoint";
import { usesNativeTabs } from "@/src/navigation";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export default function JadwalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const isDesktop = useIsDesktop();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => toDateKey(new Date()));

  const week = useMemo(() => {
    // 7 days centered around anchor-start-of-week (Monday)
    const base = new Date(anchor);
    const dayOfWeek = (base.getDay() + 6) % 7; // Monday=0
    const monday = addDays(base, -dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [anchor]);

  const { data = [], isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ["schedules", selected],
    queryFn: () => api.listSchedules({ tanggal: selected }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Jadwal dihapus", "success");
    },
    onError: () => toast("Gagal menghapus jadwal", "error"),
  });

  const confirmDelete = (s: Schedule) => {
    Alert.alert("Hapus Jadwal", `Hapus jadwal ${s.instruktur} ${s.jam_mulai}?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => delMut.mutate(s.id) },
    ]);
  };

  const selectedDate = new Date(`${selected}T00:00:00`);
  const headerDate = `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  // Build conflict index (same instruktur overlapping times)
  const conflicts = useMemo(() => {
    const map = new Map<string, boolean>();
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const a = data[i];
        const b = data[j];
        if (a.instruktur && a.instruktur === b.instruktur) {
          const [as, ae] = [a.jam_mulai, a.jam_selesai];
          const [bs, be] = [b.jam_mulai, b.jam_selesai];
          if (as < be && bs < ae) {
            map.set(a.id, true);
            map.set(b.id, true);
          }
        }
      }
    }
    return map;
  }, [data]);

  return (
    <View style={styles.screen} testID="jadwal-screen">
      {isDesktop ? (
        <View style={styles.deskTitleBar}>
          <Text style={styles.deskTitle}>Jadwal Kursus</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/schedule-form", params: { tanggal: selected } })}
            style={styles.deskPrimaryBtn}
            activeOpacity={0.85}
            testID="jadwal-add-desk"
          >
            <Plus color={colors.onBrand} size={16} />
            <Text style={styles.deskPrimaryBtnText}>Tambah Jadwal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <AppHeader title="Jadwal Instruktur" subtitle="Atur jam mengajar harian" />
      )}

      <View style={styles.weekBar}>
        <TouchableOpacity
          onPress={() => setAnchor(addDays(anchor, -7))}
          style={styles.weekBtn}
          testID="jadwal-prev"
          hitSlop={8}
        >
          <ChevronLeft color={colors.brandPrimary} size={18} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {week.map((d) => {
            const key = toDateKey(d);
            const active = key === selected;
            const isToday = key === toDateKey(new Date());
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setSelected(key)}
                activeOpacity={0.85}
                style={[styles.dayCell, active && styles.dayCellActive]}
                testID={`jadwal-day-${key}`}
              >
                <Text style={[styles.dayDow, active && styles.dayDowActive]}>
                  {DAYS_SHORT[d.getDay()]}
                </Text>
                <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                  {d.getDate()}
                </Text>
                {isToday && !active ? <View style={styles.todayDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          onPress={() => setAnchor(addDays(anchor, 7))}
          style={styles.weekBtn}
          testID="jadwal-next"
          hitSlop={8}
        >
          <ChevronRight color={colors.brandPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>{headerDate}</Text>
        <Text style={styles.dayHeaderCount}>{data.length} jadwal</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: (bottomChrome || 0) + 96,
          gap: spacing.md,
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
              <Text style={styles.errorText}>Gagal memuat jadwal</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retry} testID="jadwal-retry">
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Belum ada jadwal</Text>
              <Text style={styles.emptyDesc}>Tap tombol + untuk menambah jadwal mengajar.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ScheduleCard
            item={item}
            isConflict={!!conflicts.get(item.id)}
            onEdit={() => router.push({ pathname: "/schedule-form", params: { id: item.id, tanggal: item.tanggal } })}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />

      {!isDesktop ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/schedule-form", params: { tanggal: selected } })}
          style={[styles.fab, { bottom: bottomChrome + 16 }]}
          testID="jadwal-fab-add"
        >
          <Plus color={colors.onBrand} size={22} />
          <Text style={styles.fabText}>Tambah Jadwal</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ScheduleCard({
  item,
  isConflict,
  onEdit,
  onDelete,
}: {
  item: Schedule;
  isConflict: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={[styles.card, isConflict && styles.cardConflict]}
      testID={`schedule-card-${item.id}`}
    >
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{item.jam_mulai}</Text>
        <View style={styles.timeLine} />
        <Text style={styles.timeTextSmall}>{item.jam_selesai}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <View style={styles.instrChip}>
            <UserRound color={colors.brandPrimary} size={12} />
            <Text style={styles.instrText}>{item.instruktur}</Text>
          </View>
          {isConflict ? (
            <View style={styles.conflictBadge}>
              <Text style={styles.conflictText}>Bentrok</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.siswaText} numberOfLines={1}>
          {item.siswa_nama || "Tanpa siswa"}
        </Text>
        {item.catatan ? (
          <Text style={styles.catText} numberOfLines={2}>
            {item.catatan}
          </Text>
        ) : null}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onEdit}
            activeOpacity={0.8}
            style={[styles.cardBtn, styles.editBtn]}
            testID={`schedule-edit-${item.id}`}
          >
            <Pencil color={colors.brandPrimary} size={13} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.8}
            style={[styles.cardBtn, styles.deleteBtn]}
            testID={`schedule-delete-${item.id}`}
          >
            <Trash2 color={colors.error} size={13} />
            <Text style={styles.deleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceSecondary },

  weekBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  weekBtn: {
    width: 32, height: 44, alignItems: "center", justifyContent: "center",
  },
  weekRow: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  dayCell: {
    width: 44, height: 60, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border,
    flexShrink: 0,
  },
  dayCellActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  dayDow: { fontSize: 10, color: colors.muted, fontWeight: "700", marginBottom: 2 },
  dayDowActive: { color: colors.onBrand },
  dayNum: { fontSize: 16, color: colors.onSurface, fontWeight: "800" },
  dayNumActive: { color: colors.onBrand },
  todayDot: {
    position: "absolute", bottom: 6, width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.brandTertiary,
  },

  dayHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  dayHeaderText: { fontSize: 15, fontWeight: "800", color: colors.onSurface },
  dayHeaderCount: { fontSize: 12, color: colors.muted, fontWeight: "600" },

  center: { paddingTop: spacing.xxxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  emptyDesc: { fontSize: 13, color: colors.muted, textAlign: "center" },
  errorText: { color: colors.error, fontWeight: "600" },
  retry: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.brandPrimary, borderRadius: radius.pill, marginTop: spacing.sm,
  },
  retryText: { color: colors.onBrand, fontWeight: "700" },

  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardConflict: {
    borderColor: colors.error,
    backgroundColor: colors.error + "08",
  },
  timeCol: {
    width: 56, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.brandPrimary + "0D", borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  timeText: { fontSize: 14, fontWeight: "900", color: colors.brandPrimary },
  timeTextSmall: { fontSize: 11, color: colors.muted, fontWeight: "700" },
  timeLine: { width: 20, height: 1, backgroundColor: colors.border, marginVertical: 4 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  instrChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.brandTertiary + "33",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill,
  },
  instrText: { color: colors.brandPrimary, fontWeight: "800", fontSize: 11 },
  conflictBadge: {
    backgroundColor: colors.error, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  conflictText: { color: colors.onError, fontSize: 10, fontWeight: "800" },

  siswaText: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginTop: 2 },
  catText: { fontSize: 12, color: colors.muted, marginTop: 2 },

  cardActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  cardBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1,
  },
  editBtn: { borderColor: colors.brandPrimary, backgroundColor: colors.surface },
  editText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 12 },
  deleteBtn: { borderColor: colors.error, backgroundColor: colors.surface },
  deleteText: { color: colors.error, fontWeight: "700", fontSize: 12 },

  fab: {
    position: "absolute",
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandPrimary,
    ...Platform.select({
      ios: { shadowColor: colors.brandPrimary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  fabText: { color: colors.onBrand, fontWeight: "800", fontSize: 14 },

  deskTitleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  deskTitle: { fontSize: 22, fontWeight: "900", color: colors.onSurface, letterSpacing: 0.2 },
  deskPrimaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.pill, backgroundColor: colors.brandPrimary,
  },
  deskPrimaryBtnText: { color: colors.onBrand, fontWeight: "800", fontSize: 12 },
});
