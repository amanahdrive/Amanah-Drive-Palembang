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

import { api, Schedule } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme";
import { toast } from "@/src/components/toast";

type Form = {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  instruktur: string;
  siswa_id: string;
  siswa_nama: string;
  catatan: string;
};

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

export default function ScheduleFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { id, tanggal: initTanggal } = useLocalSearchParams<{ id?: string; tanggal?: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Form>({
    tanggal: initTanggal || new Date().toISOString().slice(0, 10),
    jam_mulai: "08:00",
    jam_selesai: "09:30",
    instruktur: "",
    siswa_id: "",
    siswa_nama: "",
    catatan: "",
  });
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [siswaOpen, setSiswaOpen] = useState(false);
  const [instrOpen, setInstrOpen] = useState(false);

  const { data: students = [] } = useQuery({ queryKey: ["students-all"], queryFn: () => api.listStudents() });
  const { data: instrukturs = [] } = useQuery({ queryKey: ["instrukturs"], queryFn: api.instrukturs });

  // Load existing schedule when editing
  const { data: existingList } = useQuery({
    queryKey: ["schedule-edit", id, initTanggal],
    queryFn: () => api.listSchedules({ tanggal: initTanggal }),
    enabled: !!id && !!initTanggal,
  });
  useEffect(() => {
    if (!id || !existingList) return;
    const found = existingList.find((s) => s.id === id);
    if (found) {
      setForm({
        tanggal: found.tanggal,
        jam_mulai: found.jam_mulai,
        jam_selesai: found.jam_selesai,
        instruktur: found.instruktur,
        siswa_id: found.siswa_id ?? "",
        siswa_nama: found.siswa_nama ?? "",
        catatan: found.catatan ?? "",
      });
    }
  }, [id, existingList]);

  const saveMut = useMutation({
    mutationFn: (body: Partial<Schedule>) =>
      isEdit ? api.updateSchedule(id as string, body) : api.createSchedule(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["instrukturs"] });
      toast(isEdit ? "Jadwal diperbarui" : "Jadwal ditambahkan", "success");
      router.back();
    },
    onError: () => toast("Gagal menyimpan jadwal", "error"),
  });

  const canSave =
    form.instruktur.trim() !== "" &&
    form.tanggal.trim() !== "" &&
    form.jam_mulai < form.jam_selesai;

  const onSave = () => {
    saveMut.mutate({
      tanggal: form.tanggal,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
      instruktur: form.instruktur.trim(),
      siswa_id: form.siswa_id || undefined,
      siswa_nama: form.siswa_nama || undefined,
      catatan: form.catatan.trim(),
    });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} testID="schedule-form-close" hitSlop={10}>
          <X color={colors.onSurface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Jadwal" : "Tambah Jadwal"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}
      >
        <Field label="Tanggal (YYYY-MM-DD) *">
          <TextInput
            value={form.tanggal}
            onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))}
            placeholder="2026-02-15"
            placeholderTextColor={colors.muted}
            style={styles.input}
            testID="input-tanggal"
          />
        </Field>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Jam Mulai *">
              <TouchableOpacity
                onPress={() => { setStartOpen(!startOpen); setEndOpen(false); }}
                style={styles.selectBtn}
                activeOpacity={0.8}
                testID="select-jam-mulai"
              >
                <Text style={styles.selectText}>{form.jam_mulai}</Text>
                <ChevronDown color={colors.muted} size={18} />
              </TouchableOpacity>
              {startOpen ? (
                <View style={[styles.dropdown, { maxHeight: 180 }]}>
                  <KeyboardAwareScrollView contentContainerStyle={{ paddingVertical: 4 }}>
                    {TIME_SLOTS.map((t) => (
                      <TouchableOpacity
                        key={`sm-${t}`}
                        onPress={() => { setForm((f) => ({ ...f, jam_mulai: t })); setStartOpen(false); }}
                        style={styles.dropdownItem}
                        testID={`jam-mulai-${t}`}
                      >
                        <Text style={[styles.dropdownLabel, { flex: 1 }]}>{t}</Text>
                        {form.jam_mulai === t ? <Check color={colors.brandPrimary} size={16} /> : null}
                      </TouchableOpacity>
                    ))}
                  </KeyboardAwareScrollView>
                </View>
              ) : null}
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Jam Selesai *">
              <TouchableOpacity
                onPress={() => { setEndOpen(!endOpen); setStartOpen(false); }}
                style={styles.selectBtn}
                activeOpacity={0.8}
                testID="select-jam-selesai"
              >
                <Text style={styles.selectText}>{form.jam_selesai}</Text>
                <ChevronDown color={colors.muted} size={18} />
              </TouchableOpacity>
              {endOpen ? (
                <View style={[styles.dropdown, { maxHeight: 180 }]}>
                  <KeyboardAwareScrollView contentContainerStyle={{ paddingVertical: 4 }}>
                    {TIME_SLOTS.map((t) => (
                      <TouchableOpacity
                        key={`se-${t}`}
                        onPress={() => { setForm((f) => ({ ...f, jam_selesai: t })); setEndOpen(false); }}
                        style={styles.dropdownItem}
                        testID={`jam-selesai-${t}`}
                      >
                        <Text style={[styles.dropdownLabel, { flex: 1 }]}>{t}</Text>
                        {form.jam_selesai === t ? <Check color={colors.brandPrimary} size={16} /> : null}
                      </TouchableOpacity>
                    ))}
                  </KeyboardAwareScrollView>
                </View>
              ) : null}
            </Field>
          </View>
        </View>

        <Field label="Instruktur *">
          <View style={styles.selectBtn}>
            <TextInput
              value={form.instruktur}
              onChangeText={(v) => setForm((f) => ({ ...f, instruktur: v }))}
              placeholder="cth. Pak Agus"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.onSurface, fontSize: 14, fontWeight: "600", paddingVertical: 0 }}
              testID="input-instruktur"
            />
            {instrukturs.length > 0 ? (
              <TouchableOpacity onPress={() => setInstrOpen(!instrOpen)} hitSlop={8}>
                <ChevronDown color={colors.muted} size={18} />
              </TouchableOpacity>
            ) : null}
          </View>
          {instrOpen && instrukturs.length > 0 ? (
            <View style={styles.dropdown}>
              {instrukturs.map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setForm((f) => ({ ...f, instruktur: i })); setInstrOpen(false); }}
                  style={styles.dropdownItem}
                  testID={`instr-${i}`}
                >
                  <Text style={[styles.dropdownLabel, { flex: 1 }]}>{i}</Text>
                  {form.instruktur === i ? <Check color={colors.brandPrimary} size={16} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Field>

        <Field label="Siswa (opsional)">
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
                  onPress={() => { setForm((f) => ({ ...f, siswa_id: s.id, siswa_nama: s.nama })); setSiswaOpen(false); }}
                  style={styles.dropdownItem}
                  testID={`siswa-${s.id}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownLabel}>{s.nama}</Text>
                    <Text style={styles.dropdownSub}>{s.paket}</Text>
                  </View>
                  {form.siswa_id === s.id ? <Check color={colors.brandPrimary} size={16} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Field>

        <Field label="Catatan">
          <TextInput
            value={form.catatan}
            onChangeText={(v) => setForm((f) => ({ ...f, catatan: v }))}
            placeholder="Materi, lokasi, dsb (opsional)"
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
          disabled={!canSave || saveMut.isPending}
          activeOpacity={0.85}
          style={[styles.saveBtn, (!canSave || saveMut.isPending) && { opacity: 0.5 }]}
          testID="schedule-form-save"
        >
          {saveMut.isPending ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Text style={styles.saveText}>{isEdit ? "Simpan Perubahan" : "Tambah Jadwal"}</Text>
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
