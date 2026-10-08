import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";

import { colors, radius, spacing } from "@/src/theme";
import { importSiswaTemplateUrl, uploadImportSiswa } from "@/src/api/client";
import { toast } from "@/src/components/toast";

export default function ImportSiswaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();

  const [picked, setPicked] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!picked) throw new Error("Pilih file terlebih dahulu");
      return uploadImportSiswa({
        uri: picked.uri,
        name: picked.name,
        mimeType: picked.mimeType ?? undefined,
      });
    },
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(`${r.created} siswa diimpor`, "success");
    },
    onError: (e: Error) => {
      toast(e.message || "Gagal impor", "error");
    },
  });

  const pickFile = async () => {
    setResult(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setPicked(res.assets[0]);
    }
  };

  const downloadTemplate = () => {
    const url = importSiswaTemplateUrl();
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.screen} testID="import-siswa-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} testID="import-close" hitSlop={10}>
          <X color={colors.onSurface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impor Siswa dari Excel</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.lg }}>
        {/* Steps */}
        <View style={styles.stepCard}>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Unduh template XLSX</Text>
              <Text style={styles.stepDesc}>Isi dengan data siswa, satu baris per siswa.</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={downloadTemplate}
              style={styles.outlineBtn}
              testID="download-template"
            >
              <Download color={colors.brandPrimary} size={14} />
              <Text style={styles.outlineBtnText}>Template</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Pilih file XLSX</Text>
              <Text style={styles.stepDesc}>
                {picked ? picked.name : "Belum ada file dipilih"}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={pickFile}
              style={[styles.outlineBtn, styles.outlinePrimary]}
              testID="pick-file"
            >
              <FileSpreadsheet color={colors.onBrand} size={14} />
              <Text style={styles.outlinePrimaryText}>Pilih</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Unggah & impor</Text>
              <Text style={styles.stepDesc}>Siswa yang berhasil akan muncul di daftar.</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => uploadMut.mutate()}
              disabled={!picked || uploadMut.isPending}
              style={[
                styles.primaryBtn,
                (!picked || uploadMut.isPending) && { opacity: 0.5 },
              ]}
              testID="upload-import"
            >
              {uploadMut.isPending ? (
                <ActivityIndicator color={colors.onBrand} />
              ) : (
                <>
                  <Upload color={colors.onBrand} size={14} />
                  <Text style={styles.primaryBtnText}>Impor</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Column reference */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kolom yang Dibutuhkan</Text>
          <Text style={styles.cardDesc}>
            Header baris pertama (urutan bebas, nama kolom case-insensitive):
          </Text>
          <View style={styles.colsWrap}>
            {[
              ["nama *", colors.error],
              ["telepon *", colors.error],
              ["paket", colors.muted],
              ["instruktur", colors.muted],
              ["total_pertemuan", colors.muted],
              ["pertemuan_selesai", colors.muted],
              ["harga_paket", colors.muted],
              ["sudah_dibayar", colors.muted],
              ["status", colors.muted],
              ["catatan", colors.muted],
            ].map(([label, color]) => (
              <View key={label as string} style={styles.colTag}>
                <Text style={[styles.colTagText, { color: color as string }]}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.helperText}>
            Status valid: <Text style={styles.mono}>aktif</Text> ·{" "}
            <Text style={styles.mono}>on_progress</Text> ·{" "}
            <Text style={styles.mono}>selesai</Text>. Bila kolom status kosong, otomatis diisi dari jumlah pertemuan.
          </Text>
        </View>

        {/* Result */}
        {result ? (
          <View style={styles.resultCard} testID="import-result">
            <View style={styles.resultHead}>
              <CheckCircle2 color={colors.success} size={22} />
              <Text style={styles.resultTitle}>Impor Selesai</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Berhasil</Text>
              <Text style={[styles.resultValue, { color: colors.success }]}>
                {result.created}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Dilewati</Text>
              <Text style={[styles.resultValue, { color: colors.warning }]}>
                {result.skipped}
              </Text>
            </View>
            {result.errors.length > 0 ? (
              <View style={styles.errBox}>
                <View style={styles.errHead}>
                  <AlertCircle color={colors.error} size={16} />
                  <Text style={styles.errTitle}>Catatan ({result.errors.length}):</Text>
                </View>
                {result.errors.map((e, i) => (
                  <Text key={i} style={styles.errItem}>• {e}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.onSurface },

  stepCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.divider, overflow: "hidden",
  },
  stepRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brandPrimary + "15",
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { color: colors.brandPrimary, fontWeight: "900", fontSize: 13 },
  stepTitle: { fontSize: 14, fontWeight: "800", color: colors.onSurface },
  stepDesc: { fontSize: 11, color: colors.muted, marginTop: 2 },

  outlineBtn: {
    flexDirection: "row", gap: 6, alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.brandPrimary, backgroundColor: colors.surface,
  },
  outlineBtnText: { color: colors.brandPrimary, fontWeight: "800", fontSize: 12 },
  outlinePrimary: { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary },
  outlinePrimaryText: { color: colors.onBrand, fontWeight: "800", fontSize: 12 },
  primaryBtn: {
    flexDirection: "row", gap: 6, alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  primaryBtnText: { color: colors.onBrand, fontWeight: "800", fontSize: 12 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.lg,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: colors.onSurface },
  cardDesc: { fontSize: 12, color: colors.muted, marginTop: 4 },
  colsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.md },
  colTag: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
  },
  colTagText: { fontSize: 11, fontWeight: "800" },
  helperText: { fontSize: 11, color: colors.muted, marginTop: spacing.md, lineHeight: 16 },
  mono: { fontFamily: "monospace", color: colors.brandPrimary, fontWeight: "800" },

  resultCard: {
    backgroundColor: colors.success + "0D",
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.success + "44",
    padding: spacing.lg, gap: spacing.sm,
  },
  resultHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  resultTitle: { fontSize: 15, fontWeight: "800", color: colors.success },
  resultRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 4,
  },
  resultLabel: { fontSize: 13, color: colors.onSurfaceSecondary, fontWeight: "600" },
  resultValue: { fontSize: 17, fontWeight: "900" },

  errBox: {
    marginTop: spacing.sm, backgroundColor: colors.error + "0D",
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.error + "33",
    padding: spacing.md,
  },
  errHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  errTitle: { fontSize: 12, color: colors.error, fontWeight: "800" },
  errItem: { fontSize: 11, color: colors.onSurfaceSecondary, marginTop: 2 },
});
