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
import {
  Plus,
  Phone,
  CheckCircle2,
  Clock,
  Circle,
  Pencil,
  Trash2,
  MessageCircle,
  Award,
  Star,
  Upload,
} from "lucide-react-native";

import { AppHeader } from "@/src/components/app-header";
import { FilterChips } from "@/src/components/filter-chips";
import { api, Student } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { formatDateID, formatRupiah } from "@/src/lib/format";
import { toast } from "@/src/components/toast";
import { openWhatsApp } from "@/src/lib/whatsapp";
import { downloadSertifikat } from "@/src/lib/pdf";
import { useIsDesktop } from "@/src/hooks/use-breakpoint";
import { usesNativeTabs } from "@/src/navigation";

const CHIPS = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "on_progress", label: "On Progress" },
  { key: "selesai", label: "Selesai" },
];

export default function SiswaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState("semua");
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const { data = [], isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ["students", filter],
    queryFn: () => api.listStudents(filter),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.deleteStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Siswa dihapus", "success");
    },
    onError: () => toast("Gagal menghapus siswa", "error"),
  });

  const confirmDelete = (s: Student) => {
    Alert.alert("Hapus Siswa", `Hapus ${s.nama}?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => delMut.mutate(s.id) },
    ]);
  };

  return (
    <View style={styles.screen} testID="siswa-screen">
      {isDesktop ? (
        <View style={styles.deskTitleBar}>
          <Text style={styles.deskTitle}>Manajemen Siswa</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push("/import-siswa")}
              style={styles.deskSecondaryBtn}
              activeOpacity={0.85}
              testID="siswa-import-desk"
            >
              <Upload color={colors.brandPrimary} size={14} />
              <Text style={styles.deskSecondaryBtnText}>Impor Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/student-form")}
              style={styles.deskPrimaryBtn}
              activeOpacity={0.85}
              testID="siswa-add-desk"
            >
              <Plus color={colors.onBrand} size={16} />
              <Text style={styles.deskPrimaryBtnText}>Tambah Siswa</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <AppHeader
          title="Data Siswa"
          subtitle="Kelola siswa kursus"
          right={
            <TouchableOpacity
              onPress={() => router.push("/import-siswa")}
              style={styles.importBtn}
              activeOpacity={0.85}
              testID="siswa-import"
              hitSlop={6}
            >
              <Upload color={colors.brandPrimary} size={14} />
              <Text style={styles.importText}>Impor</Text>
            </TouchableOpacity>
          }
        />
      )}
      <FilterChips chips={CHIPS} active={filter} onChange={setFilter} testIDPrefix="siswa-chip" />

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
              <Text style={styles.errorText}>Gagal memuat data</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retry} testID="siswa-retry">
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Belum ada data siswa</Text>
              <Text style={styles.emptyDesc}>Tap tombol + untuk menambah siswa pertama.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <StudentCard student={item} onEdit={() => router.push({ pathname: "/student-form", params: { id: item.id } })} onDelete={() => confirmDelete(item)} />
        )}
      />

      {!isDesktop ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/student-form")}
          style={[styles.fab, { bottom: bottomChrome + 16 }]}
          testID="siswa-fab-add"
        >
          <Plus color={colors.onBrand} size={22} />
          <Text style={styles.fabText}>Tambah Siswa</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
}: {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = useMemo(() => {
    if (!student.total_pertemuan) return 0;
    return Math.min(1, student.pertemuan_selesai / student.total_pertemuan);
  }, [student]);

  return (
    <View style={styles.card} testID={`student-card-${student.id}`}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.nama.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {student.nama}
          </Text>
          <View style={styles.subRow}>
            <Phone color={colors.muted} size={12} />
            <Text style={styles.sub}>{student.telepon || "-"}</Text>
          </View>
        </View>
        <StatusBadge status={student.status} />
      </View>

      <View style={styles.metaRow}>
        <MetaCell label="Paket" value={student.paket} />
        <MetaCell label="Instruktur" value={student.instruktur || "-"} />
      </View>
      <View style={styles.metaRow}>
        <MetaCell label="Daftar" value={formatDateID(student.tanggal_daftar)} />
        <MetaCell label="Harga" value={formatRupiah(student.harga_paket)} />
      </View>
      <View style={styles.metaRow}>
        <MetaCell label="Dibayar" value={formatRupiah(student.sudah_dibayar || 0)} />
        <View style={{ flex: 1 }}>
          <Text style={styles.metaLabel}>Sisa Tagihan</Text>
          <Text
            style={[
              styles.metaValue,
              {
                color:
                  (student.harga_paket - (student.sudah_dibayar || 0)) > 0
                    ? colors.error
                    : colors.success,
              },
            ]}
            numberOfLines={1}
          >
            {formatRupiah(student.harga_paket - (student.sudah_dibayar || 0))}
          </Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>Progres Pertemuan</Text>
          <Text style={styles.progressValue}>
            {student.pertemuan_selesai}/{student.total_pertemuan}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            const sisa = student.harga_paket - (student.sudah_dibayar || 0);
            const paymentLine =
              sisa > 0
                ? `• Sisa tagihan: *${formatRupiah(sisa)}*`
                : `• Status pembayaran: *LUNAS* ✅`;
            const msg =
              `Halo ${student.nama}, 🙏\n\n` +
              `Berikut info progres kursus di *Amanah Drive*:\n` +
              `• Paket: ${student.paket}\n` +
              `• Pertemuan: ${student.pertemuan_selesai}/${student.total_pertemuan}\n` +
              `• Instruktur: ${student.instruktur || "-"}\n` +
              `${paymentLine}\n\n` +
              `Terima kasih 🚗`;
            openWhatsApp(student.telepon, msg);
          }}
          style={[styles.cardBtn, styles.waBtn]}
          testID={`student-wa-${student.id}`}
        >
          <MessageCircle color={colors.onBrand} size={14} />
          <Text style={styles.waText}>WA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onEdit}
          style={[styles.cardBtn, styles.editBtn]}
          testID={`student-edit-${student.id}`}
        >
          <Pencil color={colors.brandPrimary} size={14} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onDelete}
          style={[styles.cardBtn, styles.deleteBtn]}
          testID={`student-delete-${student.id}`}
        >
          <Trash2 color={colors.error} size={14} />
          <Text style={styles.deleteText}>Hapus</Text>
        </TouchableOpacity>
      </View>

      {student.status === "selesai" ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => downloadSertifikat(student.id, student.nama)}
            style={[styles.cardBtn, styles.sertifikatBtn]}
            testID={`student-sertifikat-${student.id}`}
          >
            <Award color={colors.onBrand} size={14} />
            <Text style={styles.sertifikatText}>Sertifikat PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              const msg =
                `Halo ${student.nama}, 🎉\n\n` +
                `Selamat atas kelulusan Anda dari *Amanah Drive*!\n` +
                `Kami sangat menghargai apabila Anda berkenan membagikan pengalaman:\n\n` +
                `⭐ *Review Google*: https://g.page/r/amanahdrive_plg/review\n` +
                `📸 *Follow Instagram*: https://instagram.com/amanahdrive_plg\n` +
                `🎵 *TikTok*: https://tiktok.com/@amanahdrive_plg\n` +
                `📘 *Facebook*: https://facebook.com/amanahdrive_plg\n\n` +
                `Terima kasih sudah belajar bersama kami. Tetap aman di jalan! 🚗`;
              openWhatsApp(student.telepon, msg);
            }}
            style={[styles.cardBtn, styles.testimoniBtn]}
            testID={`student-testimoni-${student.id}`}
          >
            <Star color={colors.onBrand} size={14} />
            <Text style={styles.testimoniText}>Minta Testimoni</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function StatusBadge({ status }: { status: Student["status"] }) {
  const map = {
    aktif: { label: "Aktif", bg: colors.brandTertiary, fg: colors.onBrandTertiary, Icon: Circle },
    on_progress: { label: "On Progress", bg: colors.warning + "22", fg: colors.warning, Icon: Clock },
    selesai: { label: "Selesai", bg: colors.success + "22", fg: colors.success, Icon: CheckCircle2 },
  } as const;
  const m = map[status];
  const Icon = m.Icon;
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Icon color={m.fg} size={12} />
      <Text style={[styles.badgeText, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceSecondary },
  center: { paddingTop: spacing.xxxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  emptyDesc: { fontSize: 13, color: colors.muted, textAlign: "center" },
  errorText: { color: colors.error, fontWeight: "600" },
  retry: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  retryText: { color: colors.onBrand, fontWeight: "700" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.onBrand, fontWeight: "800", fontSize: 16 },
  name: { fontSize: 15, fontWeight: "800", color: colors.onSurface },
  subRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  sub: { fontSize: 12, color: colors.muted, fontWeight: "500" },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  metaRow: { flexDirection: "row", gap: spacing.md },
  metaLabel: { fontSize: 11, color: colors.muted, fontWeight: "600", marginBottom: 2 },
  metaValue: { fontSize: 13, color: colors.onSurface, fontWeight: "600" },

  progressWrap: { marginTop: spacing.xs },
  progressHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  progressValue: { fontSize: 12, color: colors.brandPrimary, fontWeight: "800" },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.brandTertiary },

  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  cardBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1,
  },
  editBtn: { borderColor: colors.brandPrimary, backgroundColor: colors.surface },
  editText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 13 },
  deleteBtn: { borderColor: colors.error, backgroundColor: colors.surface },
  deleteText: { color: colors.error, fontWeight: "700", fontSize: 13 },
  waBtn: { borderColor: "#25D366", backgroundColor: "#25D366" },
  waText: { color: colors.onBrand, fontWeight: "800", fontSize: 13 },

  sertifikatBtn: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
  sertifikatText: { color: colors.onBrand, fontWeight: "800", fontSize: 13 },
  testimoniBtn: { borderColor: colors.warning, backgroundColor: colors.warning },
  testimoniText: { color: colors.onBrand, fontWeight: "800", fontSize: 13 },

  importBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.brandPrimary,
  },
  importText: { color: colors.brandPrimary, fontWeight: "800", fontSize: 11 },

  deskSecondaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  deskSecondaryBtnText: { color: colors.brandPrimary, fontWeight: "800", fontSize: 12 },

  deskTitleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  deskTitle: {
    fontSize: 22, fontWeight: "900", color: colors.onSurface, letterSpacing: 0.2,
  },
  deskPrimaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.pill, backgroundColor: colors.brandPrimary,
  },
  deskPrimaryBtnText: { color: colors.onBrand, fontWeight: "800", fontSize: 12 },

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
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  fabText: { color: colors.onBrand, fontWeight: "800", fontSize: 14 },
});
