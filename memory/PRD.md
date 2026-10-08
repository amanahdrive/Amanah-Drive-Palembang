# Amanah Drive — PRD

## Deskripsi
Aplikasi manajemen bisnis khusus kursus mengemudi "Amanah Drive". Dibangun dengan React Native (Expo) + FastAPI + MongoDB. Berjalan di handphone (iOS/Android) dan juga di web (Expo Web).

## Brand
- Nama: Amanah Drive
- Tagline: "Terampil Mengemudi, Aman di Jalan."
- Warna: #00267A (deep blue), #005b93 (mid blue), #3DD0F2 (cyan accent)
- Logo: `/app/frontend/assets/images/logo.jpeg`
- Sosmed: Instagram, TikTok, Facebook — `amanahdrive_plg`

## Navigasi (4 tab)
1. Dashboard — ringkasan sisa kas, kas masuk/keluar bulan ini, chart 7 hari, statistik siswa, aksi cepat.
2. Siswa — list siswa dengan filter status (Semua/Aktif/On Progress/Selesai), progress bar pertemuan, tambah/edit/hapus.
3. Cashflow — total kas masuk/keluar/sisa, filter (Semua/Masuk/Keluar/Bulan Ini), list transaksi, dua FAB (Masuk & Keluar).
4. Profil — logo, tagline, tautan sosmed, info aplikasi.

## Backend (FastAPI + MongoDB)
Endpoints (prefix `/api`):
- `GET /dashboard` — ringkasan + chart 7 hari
- `GET /packages` — paket default (Mobil Manual, Mobil Matic, Motor)
- `GET /categories` — kategori transaksi masuk/keluar
- `GET/POST /students`, `GET/PUT/DELETE /students/{id}` (soft delete)
- `GET/POST /transactions`, `GET/PUT/DELETE /transactions/{id}` (soft delete)

Auto-status siswa: ketika pertemuan_selesai == total_pertemuan ⇒ `selesai`; > 0 ⇒ `on_progress`.

## Default Paket (seed otomatis saat startup)
- Mobil Manual — Rp 1.500.000 (10x pertemuan)
- Mobil Matic — Rp 1.400.000 (8x pertemuan)
- Motor — Rp 500.000 (6x pertemuan)

## Kategori Transaksi
- Masuk: Pembayaran Kursus, Pendaftaran, Lainnya
- Keluar: Gaji Instruktur, BBM, Maintenance Kendaraan, Operasional, Lainnya

## Platform
- Mobile: Expo Go / build native (iOS/Android)
- Web: tampilan responsif (frame ala ponsel di layar lebar > 520px)
