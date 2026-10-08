// Lightweight API client for Amanah Drive backend.
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type Student = {
  id: string;
  nama: string;
  telepon: string;
  paket: string;
  instruktur?: string;
  total_pertemuan: number;
  pertemuan_selesai: number;
  tanggal_daftar: string;
  status: "aktif" | "on_progress" | "selesai";
  harga_paket: number;
  sudah_dibayar: number;
  catatan?: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  jenis: "masuk" | "keluar";
  kategori: string;
  jumlah: number;
  keterangan?: string;
  tanggal: string;
  siswa_id?: string;
  siswa_nama?: string;
  created_at: string;
};

export type Package = {
  id: string;
  nama: string;
  harga: number;
  total_pertemuan: number;
  deskripsi: string;
};

export type Schedule = {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jam_mulai: string; // HH:MM
  jam_selesai: string; // HH:MM
  instruktur: string;
  siswa_id?: string;
  siswa_nama?: string;
  catatan?: string;
  created_at: string;
};

export type PaymentReminder = {
  siswa_id: string;
  nama: string;
  telepon: string;
  paket: string;
  harga_paket: number;
  sudah_dibayar: number;
  sisa_bayar: number;
  status: string;
};

export type DashboardSummary = {
  total_siswa: number;
  siswa_aktif: number;
  siswa_on_progress: number;
  siswa_selesai: number;
  kas_masuk_bulan: number;
  kas_keluar_bulan: number;
  sisa_kas: number;
  kas_masuk_total: number;
  kas_keluar_total: number;
  chart_7hari: { tanggal: string; label: string; masuk: number; keluar: number }[];
  pengingat_pembayaran: PaymentReminder[];
  jadwal_hari_ini: Schedule[];
};

export const reportCashflowUrl = (bulan?: string) =>
  `${BASE}/api/reports/cashflow${bulan ? `?bulan=${bulan}` : ""}`;

export async function fetchReportCashflowHtml(bulan?: string): Promise<string> {
  const res = await fetch(reportCashflowUrl(bulan));
  if (!res.ok) throw new Error(`Report ${res.status}`);
  return await res.text();
}

export const api = {
  dashboard: () => request<DashboardSummary>("/dashboard"),
  packages: () => request<Package[]>("/packages"),
  categories: () =>
    request<{ masuk: string[]; keluar: string[] }>("/categories"),
  instrukturs: () => request<string[]>("/instrukturs"),

  listStudents: (status?: string) =>
    request<Student[]>(`/students${status && status !== "semua" ? `?status=${status}` : ""}`),
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  createStudent: (body: Partial<Student>) =>
    request<Student>("/students", { method: "POST", body: JSON.stringify(body) }),
  updateStudent: (id: string, body: Partial<Student>) =>
    request<Student>(`/students/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteStudent: (id: string) =>
    request<{ ok: boolean }>(`/students/${id}`, { method: "DELETE" }),

  listTransactions: (opts: { jenis?: string; bulan_ini?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (opts.jenis && opts.jenis !== "semua") params.set("jenis", opts.jenis);
    if (opts.bulan_ini) params.set("bulan_ini", "true");
    const q = params.toString();
    return request<Transaction[]>(`/transactions${q ? `?${q}` : ""}`);
  },
  createTransaction: (body: Partial<Transaction>) =>
    request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(body) }),
  updateTransaction: (id: string, body: Partial<Transaction>) =>
    request<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTransaction: (id: string) =>
    request<{ ok: boolean }>(`/transactions/${id}`, { method: "DELETE" }),

  listSchedules: (opts: { tanggal?: string; instruktur?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.tanggal) params.set("tanggal", opts.tanggal);
    if (opts.instruktur) params.set("instruktur", opts.instruktur);
    const q = params.toString();
    return request<Schedule[]>(`/schedules${q ? `?${q}` : ""}`);
  },
  createSchedule: (body: Partial<Schedule>) =>
    request<Schedule>("/schedules", { method: "POST", body: JSON.stringify(body) }),
  updateSchedule: (id: string, body: Partial<Schedule>) =>
    request<Schedule>(`/schedules/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSchedule: (id: string) =>
    request<{ ok: boolean }>(`/schedules/${id}`, { method: "DELETE" }),
};
