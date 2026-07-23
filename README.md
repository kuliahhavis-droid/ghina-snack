
# Ghina Snack Finance

Aplikasi web untuk pencatatan pemasukan, pengeluaran, dashboard ringkasan, dan laporan keuangan untuk operasional Ghina Snack.

## Ringkasan

Repo ini berisi dua bagian utama:

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript + Prisma

Frontend dipakai untuk login, melihat dashboard, input transaksi, dan mengekspor laporan. Backend menyediakan API autentikasi, transaksi, dashboard, laporan, dan penyimpanan data ke database.

## Fitur

- Login dan autentikasi berbasis token
- Dashboard ringkasan pemasukan, pengeluaran, profit, dan jumlah transaksi
- Manajemen pemasukan dan pengeluaran
- Laporan bulanan dengan ekspor CSV dan cetak/PDF
- Halaman profil user
- UI responsif untuk desktop dan mobile

## Teknologi

- Frontend: React, TypeScript, Vite, React Router, Motion, Recharts, Tailwind CSS
- Backend: Express, TypeScript, Prisma, Zod, JWT, Multer
- Database: sesuai konfigurasi Prisma di folder backend

## Struktur Folder

```text
Ghina-Snack/
  src/                 # Frontend
    app/
    styles/
    main.tsx
  backend/             # API server
    prisma/
    src/
  README.md
```

## Prasyarat

- Node.js 18+ disarankan
- pnpm atau npm
- Database yang kompatibel dengan Prisma di backend

## Setup Cepat

### 1. Frontend

```bash
pnpm install
pnpm dev
```

Frontend akan berjalan di Vite dev server.

### 2. Backend

```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Backend default memakai base URL API di `http://localhost:3007/api/v1`.

## Environment Variable

### Frontend

Jika ingin mengubah alamat API, buat file `.env` di root project:

```bash
VITE_API_BASE_URL=http://localhost:3007/api/v1
```

### Backend

Backend memakai file `.env` di folder `backend/` untuk konfigurasi database, JWT, dan pengaturan server.

## Script

### Root Frontend

- `pnpm dev` - jalankan frontend dalam mode development
- `pnpm build` - build frontend untuk production

### Backend

- `pnpm dev` - jalankan API dalam mode watch
- `pnpm build` - compile TypeScript backend
- `pnpm start` - jalankan hasil build backend
- `pnpm prisma:generate` - generate Prisma Client
- `pnpm prisma:migrate` - jalankan migrasi database
- `pnpm prisma:seed` - seed data awal

## Alur Aplikasi

1. User login melalui halaman masuk.
2. Token dan data user disimpan di localStorage.
3. Setelah login, user masuk ke dashboard.
4. Data transaksi diambil dari backend API.
5. Laporan bulanan bisa diekspor ke CSV atau dicetak.

## Endpoint Backend Utama

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/stats?month=YYYY-MM`
- `GET /api/v1/reports/monthly?month=YYYY-MM`
- `GET /api/v1/incomes`
- `GET /api/v1/expenses`

## Catatan

- File bukti transaksi disimpan di `backend/uploads/proofs`.
- Sebagian besar endpoint transaksi dan laporan memerlukan autentikasi JWT.
- Jika backend berjalan di port lain, sesuaikan `VITE_API_BASE_URL`.
  