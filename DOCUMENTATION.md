# Dokumentasi Logika & Sistem Aplikasi - Ghina Snack Finance

Dokumentasi resmi ini menjelaskan secara menyeluruh arsitektur sistem, skema database, logika bisnis, alur kerja transaksi, sistem keamanan (RLS), serta endpoint API untuk **Ghina Snack Finance System**.

---

## 📋 Daftar Isi
1. [Ikhtisar Sistem](#1-ikhtisar-sistem)
2. [Arsitektur & Spesifikasi Teknologi](#2-arsitektur--spesifikasi-teknologi)
3. [Skema Database & Pemetaan Tabel](#3-skema-database--pemetaan-tabel)
4. [Logika Bisnis & Fitur Utama](#4-logika-bisnis--fitur-utama)
   - [A. Manajemen Pemasukan & Perhitungan HPP](#a-manajemen-pemasukan--perhitungan-hpp)
   - [B. Manajemen Pengeluaran](#b-manajemen-pengeluaran)
   - [C. Sistem Piutang & Pelunasan Cicilan](#c-sistem-piutang--pelunasan-cicilan)
   - [D. Analisis Finansial & Dashboard](#d-analisis-finansial--dashboard)
   - [E. Laporan Keuangan & Ekspor (PDF/Excel)](#e-laporan-keuangan--ekspor-pdfexcel)
   - [F. Keamanan & Row Level Security (RLS)](#f-keamanan--row-level-security-rls)
5. [Struktur Folder & Komponen](#5-struktur-folder--komponen)
6. [Audit Log & Tracing](#6-audit-log--tracing)
7. [Panduan Instalasi & Maintenance](#7-panduan-instalasi--maintenance)

---

## 1. Ikhtisar Sistem

**Ghina Snack Finance** adalah platform sistem pembukuan dan analisis keuangan terintegrasi yang dirancang khusus untuk usaha Manufaktur & Distribusi Makanan Ringan (Snack). Sistem ini memfasilitasi pencatatan arus kas (*cash flow*), perhitungan Harga Pokok Penjualan (HPP) otomatis, penyesuaian stok produk secara real-time, manajemen piutang tempo reseller, serta laporan laba rugi bulanan.

---

## 2. Arsitektur & Spesifikasi Teknologi

Sistem menggunakan arsitektur **Client-Cloud Architecture**:

```mermaid
graph TD
    Client["React 18 + Vite (TypeScript)"]
    API["API Layer (api.ts / Supabase Client)"]
    SupaAuth["Supabase Auth (JWT & Session)"]
    SupaDB[("Supabase Cloud PostgreSQL DB")]
    Prisma["Prisma ORM (Schema & Seed)"]

    Client -->|User Interaction| API
    API -->|Auth State| SupaAuth
    API -->|Realtime SQL / PostgREST| SupaDB
    Prisma -.->|Direct DB Migration| SupaDB
```

| Layer | Teknologi / Library | Fungsi Utama |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript + Vite | Interface aplikasi single-page (SPA) cepat & responsif |
| **Routing** | React Router v7 | Manajemen navigasi halaman & pembatasan rute terproteksi |
| **Styling & UI** | Tailwind CSS v4 + Radix UI + Lucide Icons | Sistem desain modern dengan estetika visual tinggi |
| **Animasi** | Motion (Framer Motion) | Transisi halaman, skeleton loader & micro-animations |
| **Visualisasi Data** | Recharts v2 | Rendering grafik tren harian, bar chart, area chart, Pareto |
| **Database Cloud** | Supabase PostgreSQL Cloud | Penyimpanan data relasional cloud terpusat |
| **Autentikasi & RLS** | Supabase Auth + Postgres RLS | Keamanan autentikasi user dan Row Level Security |
| **ORM & Migrasi** | Prisma ORM v7 | Pengelolaan skema database & data seeding |

---

## 3. Skema Database & Pemetaan Tabel

Database PostgreSQL di Supabase terdiri dari **9 tabel relasional utama**:

```mermaid
erDiagram
    users ||--o{ income : "mencatat"
    users ||--o{ expense : "mencatat"
    users ||--o{ audit_logs : "melakukan"
    
    categories ||--o{ income : "mengkategorikan"
    categories ||--o{ expense : "mengkategorikan"
    
    products ||--o{ income : "dijual"
    products ||--o{ expense : "bahan_baku"
    
    suppliers ||--o{ expense : "pemasok"
    customers ||--o{ income : "pembeli"
    customers ||--o{ receivables : "memiliki_piutang"
    
    income ||--o| receivables : "menghasilkan_piutang"
```

### Penjelasan Tabel:

1. **`users`**: Data pengguna sistem (Admin & Staff) beserta role-nya.
2. **`categories`**: Kategori transaksi keuangan, dipisah berdasarkan tipe `INCOME` (Pemasukan) atau `EXPENSE` (Pengeluaran).
3. **`products`**: Master data produk snack (Stok, HPP/Modal per bungkus, dan Harga Jual).
4. **`suppliers`**: Master data supplier bahan baku (Buah, Minyak, Gas, Plastik Kemasan).
5. **`customers`**: Master data pelanggan & reseller grosir.
6. **`income`**: Catatan transaksi pemasukan uang kas/bank.
7. **`expense`**: Catatan transaksi pengeluaran operasional & belanja modal.
8. **`receivables`**: Pencatatan piutang tempo reseller (Jumlah Piutang, Terbayar, Status).
9. **`audit_logs`**: Log rekam jejak aktivitas perubahan data pengguna (*audit trail*).

---

## 4. Logika Bisnis & Fitur Utama

### A. Manajemen Pemasukan & Perhitungan HPP
Ketika transaksi **Pemasukan (Income)** dicatat:
1. **Perhitungan HPP & Laba Bersih Transaksi**:
   $$\text{HPP Cost} = \text{HPP Produk per Unit} \times \text{Jumlah Kuantitas Dijual}$$
   $$\text{Profit Bersih} = \text{Total Nominal Pemasukan} - \text{HPP Cost}$$
2. **Pengurangan Stok Otomatis**:
   Jika transaksi berkaitan dengan produk tertentu, stok produk di tabel `products` akan otomatis berkurang sejumlah kuantitas yang dijual.
3. **Sistem Penjualan Tempo (Piutang)**:
   Jika status pembayaran dipilih `UNPAID` (Tempo) dan ada data `customerId`, sistem otomatis membuat record baru di tabel `receivables` dengan status `UNPAID`.
4. **Pembalikan Stok Saat Hapus**:
   Jika transaksi pemasukan dihapus, stok produk otomatis dikembalikan (*reverted*) dan record piutang terkait akan dihapus.

### B. Manajemen Pengeluaran
Pencatatan **Pengeluaran (Expense)** mencakup:
- Pemilihan kategori biaya (Biaya Bahan Baku, Minyak, Gas, Gaji Karyawan, Listrik, Packaging, Ongkir).
- Opsional menghubungkan dengan Supplier dan Produk yang diproduksi.
- Pengunggahan foto bukti nota/transfer (`proofUrl`).

### C. Sistem Piutang & Pelunasan Cicilan
- Halaman **Pelanggan & Piutang** mengelola reseller yang mengambil produk secara tempo.
- **Logika Cicilan (Pelunasan Piutang)**:
  - Ketika reseller membayar cicilan/pelunasan, sistem memperbarui `paidAmount` di `receivables`.
  - Jika `paidAmount` $\ge$ `amount`, status piutang berubah otomatis dari `PARTIAL` / `UNPAID` menjadi **`PAID`**.
  - Sistem secara otomatis mencatatkan transaksi **Pemasukan Baru** di tabel `income` sebagai pelunasan piutang.

### D. Analisis Finansial & Dashboard
Dashboard menyajikan metrik bisnis tingkat tinggi:
- **KPI Utama**: Total Pemasukan, Total Pengeluaran, Profit Bersih, dan Jumlah Transaksi.
- **Grafik Tren Harian**: Area Chart visualisasi fluktuasi pemasukan vs pengeluaran harian.
- **Breakdown Kategori**: Bar Chart pengeluaran berdasarkan kategori biaya.
- **Laba Kotor vs Profit Bersih**: Tren komparatif 6 bulan terakhir.
- **Cash Flow Forecasting**: Proyeksi estimasi pemasukan, pengeluaran, dan net cash bulan depan menggunakan rata-rata tren 3 bulan terakhir.
- **Analisis Pareto (Hukum 80/20)**: Urutan kategori pengeluaran terbesar secara kumulatif untuk membantu efisiensi biaya.

### E. Laporan Keuangan & Ekspor (PDF/Excel)
- **Visualisasi Berdampingan**: Grafik Tren Profit (Line Chart) dan Perbandingan Pemasukan vs Pengeluaran (Bar Chart) disusun 2-kolom berdampingan di layar desktop.
- **Formatter Sumbu Y Ringkas**: Format angka ribuan (`rb`) dan jutaan (`jt`) serta margin yang presisi agar label tidak terpotong.
- **Ekspor CSV / Excel**: Mengunduh data rincian harian periode terpilih ke format CSV.
- **Ekspor PDF Cetak**: Membuka jendela cetak (*print window*) yang diformat dengan CSS cetak profesional, kop nama usaha, ringkasan KPI, dan tabel harian.

### F. Keamanan & Row Level Security (RLS)
Seluruh 9 tabel PostgreSQL di Supabase dilindungi oleh **Row Level Security (RLS)** dengan Policy aktif:
- Izin operasi `SELECT`, `INSERT`, `UPDATE`, `DELETE` dikonfigurasi untuk peranan `authenticated` dan `anon`.
- Menggunakan query `.maybeSingle()` pada client API untuk menangani kondisi data kosong tanpa memicu HTTP 406 (*Not Acceptable*).

---

## 5. Struktur Folder & Komponen

```text
Ghina-Snack/
├── src/
│   ├── app/
│   │   ├── components/      # Komponen Layout, Navbar, Sidebar & Mobile UI
│   │   ├── context/         # AuthContext (Sesi Supabase Auth & User State)
│   │   ├── lib/
│   │   │   ├── api.ts       # Central API Client & Supabase Data Handler
│   │   │   ├── export.ts    # Handler Ekspor PDF & CSV
│   │   │   ├── format.ts    # Formatter Mata Uang (Rupiah) & Tanggal
│   │   │   └── supabase.ts  # Inisialisasi Supabase JS Client
│   │   └── pages/           # Komponen Halaman Utama:
│   │       ├── DashboardPage.tsx
│   │       ├── PemasukanPage.tsx
│   │       ├── PengeluaranPage.tsx
│   │       ├── ProductsPage.tsx
│   │       ├── CustomersPage.tsx
│   │       ├── SuppliersPage.tsx
│   │       ├── LaporanPage.tsx
│   │       ├── ProfilePage.tsx
│   │       └── LoginPage.tsx
│   └── main.tsx             # Root Entry Point Vite & React Router
├── prisma/
│   ├── schema.prisma        # Definisi Skema Database Relasional
│   ├── seed.ts              # Script Seeding Data Awal
│   └── fix_rls.ts           # Script Otomasi Kebijakan RLS Supabase
├── DOCUMENTATION.md         # Dokumentasi Lengkap Sistem (File Ini)
└── README.md                # Panduan Memulai Cepat
```

---

## 6. Audit Log & Tracing

Setiap kali pengguna melakukan aksi perubahan data (**CREATE**, **UPDATE**, **DELETE**), sistem membuat entri log permanen di tabel `audit_logs`:

```json
{
  "userId": "user-uuid",
  "action": "CREATE",
  "entity": "Income",
  "entityId": "income-uuid",
  "details": "Mencatat pemasukan: \"Penjualan Reseller Agen Jakarta\" sebesar Rp 2.400.000",
  "createdAt": "2026-07-22T12:00:00.000Z"
}
```
Entri audit log ini dapat dipantau oleh Administrator untuk transparansi operasional.

---

## 7. Panduan Instalasi & Maintenance

### A. Persyaratan Sistem
- **Node.js**: v18.x atau yang lebih baru
- **Package Manager**: `npm` atau `pnpm`

### B. Menjalankan Aplikasi Lokal
```bash
# 1. Install dependencies
npm install

# 2. Setup Environment Variables (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://user:pass@host:5432/postgres

# 3. Menjalankan Server Development
npm run dev
```

### C. Menjalankan Seed & Fix RLS
```bash
# Seed Data Awal ke Database Supabase
npx prisma db seed

# Menerapkan Policy RLS Lengkap
npx tsx prisma/fix_rls.ts
```

---
*© 2026 Ghina Snack Finance System. All rights reserved.*
