# DOKUMENTASI LENGKAP & SPESIFIKASI SISTEM - GHINA SNACK FINANCE

Dokumentasi resmi ini menjelaskan secara menyeluruh arsitektur sistem, skema database relasional, alur kerja bisnis (end-to-end user flow), sistem keamanan (RLS), visualisasi analitik, serta panduan deployment untuk **Ghina Snack Finance System**.

---

## 📋 DAFTAR ISI
1. [Ikhtisar Sistem](#1-ikhtisar-sistem)
2. [Arsitektur & Spesifikasi Teknologi](#2-arsitektur--spesifikasi-teknologi)
3. [Skema Database & Pemetaan Tabel (ERD)](#3-skema-database--pemetaan-tabel-erd)
4. [Logika Bisnis & Alur Kerja Sistem (End-to-End Flow)](#4-logika-bisnis--alur-kerja-sistem-end-to-end-flow)
   - [A. Autentikasi Pengguna & Pembatasan Akses](#a-autentikasi-pengguna--pembatasan-akses)
   - [B. Manajemen Pemasukan, HPP & Update Stok Otomatis](#b-manajemen-pemasukan-hpp--update-stok-otomatis)
   - [C. Manajemen Pengeluaran Operasional](#c-manajemen-pengeluaran-operasional)
   - [D. Sistem Piutang Tempo & Pelunasan Cicilan Reseller](#d-sistem-piutang-tempo--pelunasan-cicilan-reseller)
   - [E. Analisis Finansial Lanjutan & Cash Flow Forecasting](#e-analisis-finansial-lanjutan--cash-flow-forecasting)
   - [F. Ekspor Laporan Keuangan (PDF & CSV)](#f-ekspor-laporan-keuangan-pdf--csv)
5. [Desain Antarmuka & Layar Responsif (UI/UX)](#5-desain-antarmuka--layar-responsif-uiux)
6. [Keamanan, RLS, & Audit Trail](#6-keamanan-rls--audit-trail)
7. [Panduan Instalasi & Deployment (Vercel & Supabase)](#7-panduan-instalasi--deployment-vercel--supabase)

---

## 1. IKHTISAR SISTEM

**Ghina Snack Finance** adalah platform sistem pembukuan dan analisis keuangan terintegrasi yang dirancang khusus untuk usaha Manufaktur & Distribusi Makanan Ringan (*Snack*). Sistem ini memfasilitasi pencatatan arus kas (*cash flow*), perhitungan **Harga Pokok Penjualan (HPP)** otomatis per unit produk, pembaruan stok produk secara real-time, manajemen piutang tempo reseller, pelunasan cicilan, serta laporan laba rugi bulanan.

---

## 2. ARSITEKTUR & SPESIFIKASI TEKNOLOGI

Sistem menggunakan arsitektur **Client-Cloud Decoupled Architecture**:

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

| Layer / Komponen | Teknologi | Fungsi Utama |
|---|---|---|
| **Frontend Framework** | React 18.3.1 (TypeScript) | Interface aplikasi single-page (SPA) cepat & responsif |
| **Build Tool & Bundler** | Vite 6.3.5 | Server pengembang cepat dan pengkompilasi kode produksi |
| **Routing** | React Router v7 | Manajemen navigasi halaman & pembatasan rute terproteksi |
| **Styling & UI** | Tailwind CSS v4 + Radix UI + Lucide Icons | Sistem desain modern dengan estetika visual tinggi |
| **Visualisasi Data** | Recharts v2 | Rendering grafik tren harian, bar chart, area chart, Pareto |
| **Database Cloud** | Supabase PostgreSQL Cloud | Penyimpanan data relasional cloud terpusat |
| **Autentikasi & RLS** | Supabase Auth + Postgres RLS | Keamanan autentikasi user dan Row Level Security |
| **ORM & Migrasi** | Prisma ORM v7 | Pengelolaan skema database & data seeding |

---

## 3. SKEMA DATABASE & PEMETAAN TABEL (ERD)

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

### Rincian 9 Tabel Utama:
1. **`users`**: Data pengguna sistem (Admin & Staff) beserta role-nya.
2. **`categories`**: Kategori transaksi keuangan (`INCOME` atau `EXPENSE`).
3. **`products`**: Master data produk snack (Stok, HPP/Modal per bungkus, dan Harga Jual).
4. **`suppliers`**: Master data supplier bahan baku (Buah, Minyak, Gas, Plastik Kemasan).
5. **`customers`**: Master data pelanggan & reseller grosir.
6. **`income`**: Catatan transaksi pemasukan uang kas/bank.
7. **`expense`**: Catatan transaksi pengeluaran operasional & belanja modal.
8. **`receivables`**: Pencatatan piutang tempo reseller (Jumlah Piutang, Terbayar, Status).
9. **`audit_logs`**: Log rekam jejak aktivitas perubahan data pengguna (*audit trail*).

---

## 4. LOGIKA BISNIS & ALUR KERJA SISTEM (END-TO-END FLOW)

### A. Autentikasi Pengguna & Pembatasan Akses
- Pengguna wajib login dengan email & password yang terverifikasi di Supabase Auth.
- Rute terproteksi (`RequireAuth`) memastikan hanya user berstatus terautentikasi yang dapat mengakses dashboard dan menu transaksi.

### B. Manajemen Pemasukan, HPP & Update Stok Otomatis
Ketika transaksi **Pemasukan (Income)** dicatat:
1. **Perhitungan HPP & Laba Bersih Transaksi**:
   $$\text{HPP Cost} = \text{HPP Produk per Unit} \times \text{Kuantitas (Qty)}$$
   $$\text{Profit Bersih} = \text{Total Nominal Pemasukan} - \text{HPP Cost}$$
2. **Pengurangan Stok Otomatis**:
   Stok produk di tabel `products` otomatis berkurang sejumlah kuantitas yang dijual.
3. **Penjualan Tempo (Piutang)**:
   Jika pembayaran dipilih `UNPAID` (Tempo), sistem otomatis membuat data piutang baru di tabel `receivables`.

### C. Manajemen Pengeluaran Operasional
- Mencatat biaya bahan baku, minyak, gas, gaji karyawan, listrik, packaging, dan transport.
- Opsional menghubungkan transaksi dengan Supplier dan Produk terkait.

### D. Sistem Piutang Tempo & Pelunasan Cicilan Reseller
- Ketika reseller membayar cicilan/pelunasan:
  - Sistem memperbarui `paidAmount` di `receivables`.
  - Jika `paidAmount` $\ge$ `amount`, status piutang berubah otomatis menjadi **`PAID`**.
  - Sistem secara otomatis mencatatkan transaksi **Pemasukan Baru** di tabel `income` sebagai pelunasan piutang.

### E. Analisis Finansial Lanjutan & Cash Flow Forecasting
- **KPI Utama**: Total Pemasukan, Total Pengeluaran, Profit Bersih, dan Jumlah Transaksi.
- **Grafik Tren Harian**: Area Chart visualisasi fluktuasi pemasukan vs pengeluaran harian.
- **Cash Flow Forecasting**: Proyeksi estimasi pemasukan, pengeluaran, dan net cash bulan depan menggunakan rata-rata tren 3 bulan terakhir.
- **Analisis Pareto (Hukum 80/20)**: Urutan kategori pengeluaran terbesar secara kumulatif untuk membantu efisiensi biaya.

### F. Ekspor Laporan Keuangan (PDF & CSV)
- **Ekspor CSV / Excel**: Mengunduh rincian data harian periode terpilih ke file CSV.
- **Ekspor PDF Cetak**: Mengaktifkan jendela cetak (*window print*) yang diformat dengan CSS cetak profesional, kop nama usaha, ringkasan KPI, dan tabel harian.

---

## 5. DESAIN ANTARMUKA & LAYAR RESPONSIF (UI/UX)

- **Mode Desktop (≥ 768px):** Sidebar Kiri permanen (dapat di-expand/collapse), Header Atas, dan layout workspace 2-kolom.
- **Mode Mobile (< 768px):**
  - Header Atas Ringkas tanpa tombol hamburger.
  - **Fixed Horizontal Scrollable Bottom Bar:** Navigasi bawah berbentuk chip/pill yang berisi seluruh 8 menu utama yang dapat di-scroll kesamping.
  - **Terkuci Permanen (Fixed & Stuck):** Dilengkapi `fixed bottom-0 inset-x-0 z-50` dan `touch-pan-x` agar bar navigasi bawah tidak pernah bergeser atau ikut terangkat saat halaman di-scroll.

---

## 6. KEAMANAN, RLS, & AUDIT TRAIL

- **Row Level Security (RLS):** Seluruh 9 tabel dilindungi policy `SELECT`, `INSERT`, `UPDATE`, `DELETE` untuk role `authenticated`.
- **Audit Logs:** Setiap perubahan data mencatat entri otomatis ke tabel `audit_logs` berisi `userId`, `action`, `entity`, `details`, dan timestamp.

---

## 7. PANDUAN INSTALASI & DEPLOYMENT (VERCEL & SUPABASE)

```powershell
# 1. Install dependencies
npm install

# 2. Setup Environment Variables (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# 3. Jalankan server lokal
npm run dev

# 4. Push kode ke GitHub (Auto Deploy Vercel)
git add .
git commit -m "Deploy update"
git push origin main
```

---
*© 2026 Ghina Snack Finance System. All rights reserved.*
