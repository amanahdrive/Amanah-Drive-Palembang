import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { X, ChevronDown, Check } from "lucide-react-native";

import { api, Student, Package } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { toast } from "@/src/components/toast";
import { parseNumberInput, formatRupiah } from "@/src/lib/format";

const STATUSES: { key: Student["status"]; label: string }[] = [
  { key: "aktif", label: "Aktif" },
  { key: "on_progress", label: "On Progress" },
  { key: "selesai", label: "Selesai" },
];

type Form = {
  nama: string;
  telepon: string;
  paket: string;
  instruktur: string;
  total_pertemuan: string;
  pertemuan_selesai: string;
  harga_paket: string;
  catatan: string;
  status: Student["status"];
};

const DEFAULT_FORM: Form = {
  nama: "",
  telepon: "",
  paket: "",
  instruktur: "",
  total_pertemuan: "10",
  pertemuan_selesai: "0",
  harga_paket: "0",
  catatan: "",
  status: "aktif",
};

export default function StudentFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [paketOpen, setPaketOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const { data: packages = [] } = useQuery({ queryKey: ["packages"], queryFn: api.packages });

  const { data: existing } = useQuery({
    queryKey: ["student", id],
    queryFn: () => api.getStudent(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        nama: existing.nama,
        telepon: existing.telepon,
        paket: existing.paket,
        instruktur: existing.instruktur ?? "",
        total_pertemuan: String(existing.total_pertemuan),
        pertemuan_selesai: String(existing.pertemuan_selesai),
        harga_paket: String(existing.harga_paket),
        catatan: existing.catatan ?? "",
        status: existing.status,
      });
    }
  }, [existing]);

  const createMut = useMutation({
    mutationFn: (body: Partial<Student>) =>
      isEdit ? api.updateStudent(id as string, body) : api.createStudent(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(isEdit ? "Siswa diperbarui" : "Siswa ditambahkan", "success");
      router.back();
    },
    onError: () => toast("Gagal menyimpan siswa", "error"),
  });

  const canSave = form.nama.trim().length > 0 && form.telepon.trim().length > 0 && form.paket.trim().length > 0;

  const onSave = () => {
    const body: Partial<Student> = {
      nama: form.nama.trim(),
      telepon: form.telepon.trim(),
      paket: form.paket,
      instruktur: form.instruktur.trim(),
      total_pertemuan: parseNumberInput(form.total_pertemuan) || 0,
      pertemuan_selesai: parseNumberInput(form.pertemuan_selesai) || 0,
      harga_paket: parseNumberInput(form.harga_paket) || 0,
      catatan: form.catatan.trim(),
      status: form.status,
    };
    createMut.mutate(body);
  };

  const selectPaket = (p: Package) => {
    setForm((f) => ({
      ...f,
      paket: p.nama,
      harga_paket: String(p.harga),
      total_pertemuan: String(p.total_pertemuan),
    }));
    setPaketOpen(false);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} testID="student-form-close" hitSlop={10}>
          <X color={colors.onSurface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Siswa" : "Tambah Siswa"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}
      >
        <Field label="Nama Siswa *">
          <TextInput
            value={form.nama}
            onChangeText={(v) => setForm((f) => ({ ...f, nama: v }))}
            placeholder="cth. Budi Santoso"
            placeholderTextColor={colors.muted}
            style={styles.input}
            testID="input-nama"
          />
        </Field>

        <Field label="No. Telepon *">
          <TextInput
            value={form.telepon}
            onChangeText={(v) => setForm((f) => ({ ...f, telepon: v }))}
            placeholder="08xxxxxxxxxx"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={styles.input}
            testID="input-telepon"
          />
        </Field>

        <Field label="Paket Kursus *">
          <TouchableOpacity
            onPress={() => setPaketOpen((v) => !v)}
            style={styles.selectBtn}
            activeOpacity={0.8}
            testID="select-paket"
          >
            <Text style={[styles.selectText, !form.paket && { color: colors.muted }]}>
              {form.paket || "Pilih paket"}
            </Text>
            <ChevronDown color={colors.muted} size={18} />
          </TouchableOpacity>
          {paketOpen ? (
            <View style={styles.dropdown}>
              {packages.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => selectPaket(p)}
                  style={styles.dropdownItem}
                  testID={`paket-${p.id}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownLabel}>{p.nama}</Text>
                    <Text style={styles.dropdownSub}>
                      {formatRupiah(p.harga)} • {p.total_pertemuan}x pertemuan
                    </Text>
                  </View>
                  {form.paket === p.nama ? <Check color={colors.brandPrimary} size={18} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Field>

        <Field label="Instruktur">
          <TextInput
            value={form.instruktur}
            onChangeText={(v) => setForm((f) => ({ ...f, instruktur: v }))}
            placeholder="Nama instruktur"
            placeholderTextColor={colors.muted}
            style={styles.input}
            testID="input-instruktur"
          />
        </Field>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Total Pertemuan">
              <TextInput
                value={form.total_pertemuan}
                onChangeText={(v) => setForm((f) => ({ ...f, total_pertemuan: v.replace(/[^\d]/g, "") }))}
                keyboardType="number-pad"
                style={styles.input}
                testID="input-total-pertemuan"
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Pertemuan Selesai">
              <TextInput
                value={form.pertemuan_selesai}
                onChangeText={(v) => setForm((f) => ({ ...f, pertemuan_selesai: v.replace(/[^\d]/g, "") }))}
                keyboardType="number-pad"
                style={styles.input}
                testID="input-pertemuan-selesai"
              />
            </Field>
          </View>
        </View>

        <Field label="Harga Paket (Rp)">
          <TextInput
            value={formatRupiah(parseNumberInput(form.harga_paket)).replace("Rp ", "")}
            onChangeText={(v) => setForm((f) => ({ ...f, harga_paket: v.replace(/[^\d]/g, "") }))}
            keyboardType="number-pad"
            style={styles.input}
            testID="input-harga"
          />
        </Field>

        <Field label="Status">
          <TouchableOpacity
            onPress={() => setStatusOpen((v) => !v)}
            style={styles.selectBtn}
            activeOpacity={0.8}
            testID="select-status"
          >
            <Text style={styles.selectText}>
              {STATUSES.find((s) => s.key === form.status)?.label}
            </Text>
            <ChevronDown color={colors.muted} size={18} />
          </TouchableOpacity>
          {statusOpen ? (
            <View style={styles.dropdown}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => {
                    setForm((f) => ({ ...f, status: s.key }));
                    setStatusOpen(false);
                  }}
                  style={styles.dropdownItem}
                  testID={`status-${s.key}`}
                >
                  <Text style={[styles.dropdownLabel, { flex: 1 }]}>{s.label}</Text>
                  {form.status === s.key ? <Check color={colors.brandPrimary} size={18} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Field>

        <Field label="Catatan">
          <TextInput
            value={form.catatan}
            onChangeText={(v) => setForm((f) => ({ ...f, catatan: v }))}
            placeholder="Catatan tambahan (opsional)"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
            testID="input-catatan"
          />
        </Field>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          onPress={onSave}
          disabled={!canSave || createMut.isPending}
          activeOpacity={0.85}
          style={[styles.saveBtn, (!canSave || createMut.isPending) && { opacity: 0.5 }]}
          testID="student-form-save"
        >
          {createMut.isPending ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Text style={styles.saveText}>{isEdit ? "Simpan Perubahan" : "Tambah Siswa"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.onSurface },

  label: { fontSize: 12, fontWeight: "700", color: colors.onSurfaceSecondary, marginBottom: 6, letterSpacing: 0.2 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }),
    fontSize: 14,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row2: { flexDirection: "row", gap: spacing.md },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectText: { flex: 1, fontSize: 14, color: colors.onSurface, fontWeight: "600" },

  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  dropdownLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  dropdownSub: { fontSize: 12, color: colors.muted, marginTop: 2 },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    height: 52,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.onBrand, fontSize: 15, fontWeight: "800" },
});
