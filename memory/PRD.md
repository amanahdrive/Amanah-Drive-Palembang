# Amanah Drive — PRD

## Deskripsi
Aplikasi manajemen bisnis khusus kursus mengemudi "Amanah Drive". Dibangun dengan React Native (Expo) + FastAPI + MongoDB. Berjalan di handphone (iOS/Android) dan juga di web (Expo Web) dengan **dua tampilan responsif**:
- **Mobile / Expo Go**: 4 tab (Dashboard, Siswa, Cashflow, Jadwal), FAB untuk tambah data, Profil diakses lewat ikon di header.
- **Web Desktop (≥ 1024px)**: layout console admin dengan sidebar kiri (Dashboard, Manajemen Siswa, Jadwal Kursus, Kas & Keuangan, Pengaturan), top bar dengan greeting + jam, dashboard operasional multi-kolom.

## Brand
- Nama: Amanah Drive
- Tagline: "Terampil Mengemudi, Aman di Jalan."
- Warna: #00267A (deep blue), #005b93 (mid blue), #3DD0F2 (cyan accent)
- Logo: `/app/frontend/assets/images/logo.jpeg`
- Sosmed: Instagram, TikTok, Facebook — `amanahdrive_plg`

## Fitur Utama

### Dashboard Operasional
- Mobile: Sisa Kas hero, kas masuk/keluar bulan ini, Pengingat Pembayaran, Jadwal Hari Ini, chart 7 hari, siswa stats, aksi cepat.
- Desktop: 4 metric card (Kas Masuk, Saldo, On Progress, Sesi), tabel Jadwal Kursus Lapangan hari ini, Status Operasional, Pengingat Pembayaran, charts.

### Manajemen Siswa
- CRUD siswa + status aktif/on_progress/selesai (auto-update dari pertemuan)
- Field: nama, telepon, paket, instruktur, pertemuan, harga, **sudah_dibayar**, catatan
- Tiap kartu punya tombol **WA** yang auto-generate pesan WhatsApp info progres & tagihan
- Filter chips: Semua / Aktif / On Progress / Selesai

### Kas & Keuangan (Cashflow)
- CRUD transaksi masuk/keluar (soft delete)
- Totals card: Kas Masuk, Kas Keluar, Sisa Kas
- Filter chips: Semua / Masuk / Keluar / Bulan Ini
- Transaksi dengan siswa_id auto-update `sudah_dibayar` siswa
- **Download Laporan Cashflow Bulanan PDF** (via `expo-print` di native, open HTML di web)

### Jadwal Instruktur
- CRUD jadwal (tanggal, jam mulai/selesai, instruktur, siswa, catatan)
- Week navigator dengan picker tanggal
- Deteksi **bentrok otomatis** (instruktur sama, jam overlap) ditandai badge merah
- Daftar instruktur unik otomatis dari data siswa + jadwal

### Pengingat Pembayaran (Dashboard)
- Siswa dengan sisa > 0 tampil otomatis di Dashboard
- Tombol **WA** satu-tap kirim pesan tagihan ke nomor siswa

### Profil
- Logo + tagline
- Link sosmed (Instagram / TikTok / Facebook amanahdrive_plg) dengan icon SVG kustom

## Backend (FastAPI + MongoDB)
Endpoints (prefix `/api`):
- `GET /dashboard` — summary + reminders + jadwal hari ini
- `GET /packages`, `GET /categories`, `GET /instrukturs`
- `GET/POST/PUT/DELETE /students` (soft delete)
- `GET/POST/PUT/DELETE /transactions` (soft delete, auto-recompute pembayaran siswa)
- `GET/POST/PUT/DELETE /schedules` (soft delete)
- `GET /reports/cashflow?bulan=YYYY-MM` — HTML siap print PDF

## Platform
- Mobile: Expo Go / build native (iOS/Android)
- Web: desktop admin console di ≥ 1024px, phone-frame di 521-1023px, full-width di ≤ 520px
