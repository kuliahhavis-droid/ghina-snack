import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Phone,
  User,
  MapPin,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Skeleton } from '../components/ui/skeleton';

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: Supplier[] }>('/suppliers');
      setSuppliers(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data supplier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setContact('');
    setPhone('');
    setAddress('');
    setIsOpen(true);
  };

  const openEdit = (supp: Supplier) => {
    setEditingId(supp.id);
    setName(supp.name);
    setContact(supp.contact || '');
    setPhone(supp.phone || '');
    setAddress(supp.address || '');
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name,
        contact: contact || null,
        phone: phone || null,
        address: address || null,
      };

      if (editingId) {
        await apiRequest(`/suppliers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await apiRequest('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      setIsOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) return;
    try {
      await apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus supplier');
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F6B3A]">Manajemen Supplier</h1>
          <p className="text-sm text-[#6B7280]">Kelola data pemasok bahan baku, packaging, dan kelengkapan produksi lainnya.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] px-5 py-3 text-sm font-semibold text-white shadow-md"
        >
          <Plus className="h-4 w-4" />
          Tambah Supplier
        </motion.button>
      </div>

      {/* Filter and search */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#65C466]/10 bg-white px-4 py-3 shadow-sm max-w-md">
        <Search className="h-5 w-5 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Cari supplier berdasarkan nama..."
          className="w-full text-sm text-[#1F2937] outline-none placeholder-[#94A3B8]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#65C466]/10 bg-white text-[#6B7280]">
          <Truck className="h-12 w-12 text-[#94A3B8] mb-2" />
          <p className="text-sm">Tidak ada supplier ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supp) => (
            <motion.div
              key={supp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-[#65C466]/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#1F6B3A]">
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(supp)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supp.id)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="mb-3 text-lg font-bold text-[#1F2937]">{supp.name}</h3>

              <div className="space-y-2.5 text-sm text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#94A3B8]" />
                  <span>{supp.contact || 'No contact person'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#94A3B8]" />
                  <span>{supp.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#94A3B8] mt-0.5" />
                  <span className="line-clamp-2">{supp.address || 'No address details'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-[#65C466]/10 bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1F6B3A]">
                  {editingId ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nama Pemasok / Supplier *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: PT. Buah Nusantara"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nama Kontak (CP)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: Budi Prasetyo"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">No. Telepon / WA</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Alamat Kantor/Gudang</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Alamat lengkap supplier..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
