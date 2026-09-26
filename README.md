# Amanah Drive Console

Starter project untuk membangun panel operasional Amanah Drive dengan Next.js, Supabase, GitHub, dan Vercel.

## 1. Instalasi

Pastikan Node.js terpasang, lalu:

```bash
npm install
```

## 2. Supabase

Buat project baru di Supabase, kemudian ambil:

- Project URL
- anon/public key

Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi kedua variabel tersebut.

## 3. Buat user admin

Di Supabase buka Authentication > Users lalu buat user email/password untuk admin.

## 4. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000

## 5. GitHub

```bash
git init
git add .
git commit -m "Initial Amanah Drive Console"
git branch -M main
git remote add origin https://github.com/USERNAME/amanah-drive-console.git
git push -u origin main
```

## 6. Vercel

Import repository GitHub ini ke Vercel.

Tambahkan Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Setelah deploy, tambahkan domain `panel.amanahdrive.my.id` di Vercel.

## Tahap berikutnya

Starter ini sudah mempunyai:

- Login Supabase
- Proteksi route dengan middleware
- Sidebar responsif
- Dashboard
- Kerangka modul Siswa
- Pendaftaran
- Jadwal
- Instruktur
- Armada
- Keuangan
- Pengaturan

Database dan CRUD belum dibuat. Itu sengaja dipisahkan sebagai tahap berikutnya agar struktur database bisa disesuaikan dengan alur bisnis Amanah Drive.
