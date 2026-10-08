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
import { X, ChevronDown, Check, ArrowDownCircle, ArrowUpCircle } from "lucide-react-native";

import { api, Transaction } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { toast } from "@/src/components/toast";
import { parseNumberInput, formatRupiah } from "@/src/lib/format";

type Jenis = "masuk" | "keluar";

type Form = {
  jenis: Jenis;
  kategori: string;
  jumlah: string;
  keterangan: string;
  siswa_id: string;
  siswa_nama: string;
};

export default function TransactionFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ jenis?: Jenis }>();
  const initialJenis: Jenis = (params.jenis as Jenis) ?? "masuk";

  const [form, setForm] = useState<Form>({
    jenis: initialJenis,
    kategori: "",
    jumlah: "",
    keterangan: "",
    siswa_id: "",
    siswa_nama: "",
  });
  const [catOpen, setCatOpen] = useState(false);
  const [siswaOpen, setSiswaOpen] = useState(false);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const { data: students = [] } = useQuery({ queryKey: ["students-all"], queryFn: () => api.listStudents() });

  const activeCategories = form.jenis === "masuk" ? categories?.masuk ?? [] : categories?.keluar ?? [];

  // When jenis changes, reset kategori if it is not in the new list
  useEffect(() => {
    if (form.kategori && !activeCategories.includes(form.kategori)) {
      setForm((f) => ({ ...f, kategori: "" }));
    }
  }, [form.jenis]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMut = useMutation({
    mutationFn: (body: Partial<Transaction>) => api.createTransaction(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(form.jenis === "masuk" ? "Kas masuk dicatat" : "Kas keluar dicatat", "success");
      router.back();
    },
    onError: () => toast("Gagal menyimpan transaksi", "error"),
  });

  const jumlahNum = parseNumberInput(form.jumlah);
  const canSave = form.kategori !== "" && jumlahNum > 0;

  const onSave = () => {
    createMut.mutate({
      jenis: form.jenis,
      kategori: form.kategori,
      jumlah: jumlahNum,
      keterangan: form.keterangan.trim(),
      siswa_id: form.siswa_id || undefined,
      siswa_nama: form.siswa_nama || undefined,
    });
  };

  const accent = form.jenis === "masuk" ? colors.success : colors.error;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} testID="tx-form-close" hitSlop={10}>
          <X color={colors.onSurface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Transaksi</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.lg }}
      >
        {/* Toggle jenis */}
        <View style={styles.toggle}>
          <ToggleBtn
            active={form.jenis === "masuk"}
            label="Kas Masuk"
            color={colors.success}
            icon={<ArrowDownCircle color={form.jenis === "masuk" ? colors.onBrand : colors.success} size={16} />}
            onPress={() => setForm((f) => ({ ...f, jenis: "masuk" }))}
            testID="tx-toggle-masuk"
          />
          <ToggleBtn
            active={form.jenis === "keluar"}
            label="Kas Keluar"
            color={colors.error}
            icon={<ArrowUpCircle color={form.jenis === "keluar" ? colors.onBrand : colors.error} size={16} />}
            onPress={() => setForm((f) => ({ ...f, jenis: "keluar" }))}
            testID="tx-toggle-keluar"
          />
        </View>

        {/* Jumlah hero */}
        <View style={[styles.amountCard, { borderColor: accent + "33" }]}>
          <Text style={styles.amountLabel}>Jumlah</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountCurrency, { color: accent }]}>Rp</Text>
            <TextInput
              value={jumlahNum > 0 ? formatRupiah(jumlahNum).replace("Rp ", "") : ""}
              onChangeText={(v) => setForm((f) => ({ ...f, jumlah: v.replace(/[^\d]/g, "") }))}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: accent }]}
              testID="input-jumlah"
            />
          </View>
        </View>

        {/* Kategori */}
        <View>
          <Text style={styles.label}>Kategori *</Text>
          <TouchableOpacity
            onPress={() => setCatOpen((v) => !v)}
            style={styles.selectBtn}
            activeOpacity={0.8}
            testID="select-kategori"
          >
            <Text style={[styles.selectText, !form.kategori && { color: colors.muted }]}>
              {form.kategori || "Pilih kategori"}
            </Text>
            <ChevronDown color={colors.muted} size={18} />
          </TouchableOpacity>
          {catOpen ? (
            <View style={styles.dropdown}>
              {activeCategories.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setForm((f) => ({ ...f, kategori: c }));
                    setCatOpen(false);
                  }}
                  style={styles.dropdownItem}
                  testID={`kategori-${c}`}
                >
                  <Text style={[styles.dropdownLabel, { flex: 1 }]}>{c}</Text>
                  {form.kategori === c ? <Check color={colors.brandPrimary} size={18} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* Siswa (opsional) - utama untuk kas masuk pembayaran kursus */}
        {form.jenis === "masuk" ? (
          <View>
            <Text style={styles.label}>Siswa (opsional)</Text>
            <TouchableOpacity
              onPress={() => setSiswaOpen((v) => !v)}
              style={styles.selectBtn}
              activeOpacity={0.8}
              testID="select-siswa"
            >
              <Text style={[styles.selectText, !form.siswa_nama && { color: colors.muted }]}>
                {form.siswa_nama || "Pilih siswa"}
              </Text>
              <ChevronDown color={colors.muted} size={18} />
            </TouchableOpacity>
            {siswaOpen ? (
              <View style={[styles.dropdown, { maxHeight: 220 }]}>
                <TouchableOpacity
                  onPress={() => {
                    setForm((f) => ({ ...f, siswa_id: "", siswa_nama: "" }));
                    setSiswaOpen(false);
                  }}
                  style={styles.dropdownItem}
                  testID="siswa-none"
                >
                  <Text style={[styles.dropdownLabel, { flex: 1, color: colors.muted }]}>Tanpa siswa</Text>
                </TouchableOpacity>
                {students.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      setForm((f) => ({ ...f, siswa_id: s.id, siswa_nama: s.nama }));
                      setSiswaOpen(false);
                    }}
                    style={styles.dropdownItem}
                    testID={`siswa-${s.id}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownLabel}>{s.nama}</Text>
                      <Text style={styles.dropdownSub}>{s.paket}</Text>
                    </View>
                    {form.siswa_id === s.id ? <Check color={colors.brandPrimary} size={18} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View>
          <Text style={styles.label}>Keterangan</Text>
          <TextInput
            value={form.keterangan}
            onChangeText={(v) => setForm((f) => ({ ...f, keterangan: v }))}
            placeholder="Catatan transaksi"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
            testID="input-keterangan"
          />
        </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          onPress={onSave}
          disabled={!canSave || createMut.isPending}
          activeOpacity={0.85}
          style={[
            styles.saveBtn,
            { backgroundColor: accent },
            (!canSave || createMut.isPending) && { opacity: 0.5 },
          ]}
          testID="tx-form-save"
        >
          {createMut.isPending ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Text style={styles.saveText}>Simpan Transaksi</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ToggleBtn({
  active,
  label,
  color,
  icon,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  color: string;
  icon: React.ReactNode;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.toggleBtn,
        { backgroundColor: active ? color : colors.surfaceSecondary, borderColor: active ? color : colors.border },
      ]}
      activeOpacity={0.85}
      testID={testID}
    >
      {icon}
      <Text style={[styles.toggleText, { color: active ? colors.onBrand : color }]}>{label}</Text>
    </TouchableOpacity>
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

  toggle: { flexDirection: "row", gap: spacing.md },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  toggleText: { fontWeight: "800", fontSize: 13 },

  amountCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: "center",
  },
  amountLabel: { fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 0.4 },
  amountRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.sm, gap: 6 },
  amountCurrency: { fontSize: 20, fontWeight: "900" },
  amountInput: {
    fontSize: 32,
    fontWeight: "900",
    minWidth: 160,
    textAlign: "center",
    paddingVertical: 0,
  },

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
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.onBrand, fontSize: 15, fontWeight: "800" },
});
