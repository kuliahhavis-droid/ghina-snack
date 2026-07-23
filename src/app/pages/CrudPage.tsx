import { motion } from 'motion/react';
import {
  ArrowRight,
  ClipboardList,
  Database,
  Eye,
  FileText,
  PencilLine,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';

const modules = [
  {
    title: 'Data Pemasukan',
    description: 'Kelola transaksi masuk dari marketplace dan pemasukan lain.',
    path: '/pemasukan',
    color: 'from-[#65C466] to-[#1F6B3A]',
  },
  {
    title: 'Data Pengeluaran',
    description: 'Atur biaya operasional, bahan baku, pengemasan, dan lainnya.',
    path: '/pengeluaran',
    color: 'from-[#EF4444] to-[#DC2626]',
  },
  {
    title: 'Laporan',
    description: 'Pantau ringkasan data yang sudah diproses dari CRUD.',
    path: '/laporan',
    color: 'from-[#3B82F6] to-[#1D4ED8]',
  },
];

const operations = [
  { icon: Plus, label: 'Create', detail: 'Tambah data baru ke sistem' },
  { icon: Eye, label: 'Read', detail: 'Lihat daftar dan detail data' },
  { icon: PencilLine, label: 'Update', detail: 'Ubah data yang sudah tersimpan' },
  { icon: Trash2, label: 'Delete', detail: 'Hapus data yang tidak diperlukan' },
];

export default function CrudPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-[#65C466]/10 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(101,196,102,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(31,107,58,0.08),_transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F0FDF4] px-3 py-1 text-sm font-medium text-[#1F6B3A]">
              <Database className="h-4 w-4" />
              Akses Logika CRUD
            </div>
            <h1 className="mb-3 text-3xl font-bold text-[#1F6B3A] md:text-4xl">
              Pusat akses untuk create, read, update, dan delete data.
            </h1>
            <p className="text-base leading-relaxed text-[#6B7280] md:text-lg">
              Halaman ini menjadi pintu masuk ke semua alur pengelolaan data. Pilih modul yang
              ingin diakses untuk membuka tampilan input, daftar data, dan pengelolaan record.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[380px]">
            {operations.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
                  className="rounded-2xl border border-[#65C466]/10 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4]">
                    <Icon className="h-5 w-5 text-[#1F6B3A]" />
                  </div>
                  <p className="font-semibold text-[#1F2937]">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{item.detail}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {modules.map((item, index) => (
          <motion.button
            key={item.title}
            type="button"
            onClick={() => navigate(item.path)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
            className="group block rounded-3xl border border-[#65C466]/10 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-md`}>
              <ClipboardList className="h-7 w-7 text-white" />
            </div>

            <div className="mt-5 space-y-3">
              <h2 className="text-xl font-bold text-[#1F2937]">{item.title}</h2>
              <p className="text-sm leading-relaxed text-[#6B7280]">{item.description}</p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F5F7FA] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1F6B3A]">
                <Settings2 className="h-4 w-4" />
                Buka modul
              </div>
              <ArrowRight className="h-5 w-5 text-[#1F6B3A] transition-transform group-hover:translate-x-1" />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
      >
        <div className="rounded-3xl border border-[#65C466]/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0FDF4]">
              <FileText className="h-5 w-5 text-[#1F6B3A]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1F2937]">Alur kerja CRUD</h3>
              <p className="text-sm text-[#6B7280]">Urutan umum yang dipakai pada modul data</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              'Tambahkan data baru dari form input yang terhubung ke logika create.',
              'Tampilkan daftar record agar user bisa melakukan review cepat.',
              'Sediakan aksi edit untuk memperbarui data tanpa keluar dari modul.',
              'Sertakan aksi hapus dengan konfirmasi sebelum data dihapus permanen.',
            ].map((text, index) => (
              <div key={text} className="flex gap-3 rounded-2xl bg-[#F5F7FA] p-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#65C466] text-xs font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-[#4B5563]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#1F6B3A] to-[#0F3D22] p-6 text-white shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Settings2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Shortcut akses cepat</h3>
              <p className="text-sm text-white/75">Navigasi langsung ke modul CRUD utama</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {modules.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-left transition-colors hover:bg-white/15"
              >
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-white/70">Masuk ke tampilan pengelolaan data</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/90" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}