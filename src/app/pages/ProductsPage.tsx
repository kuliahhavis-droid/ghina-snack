import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  Loader2,
  DollarSign,
  Tag,
  X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { currency } from '../lib/format';
import { useIsMobile } from '../components/ui/use-mobile';
import { Skeleton } from '../components/ui/skeleton';

type Product = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: string;
  hpp: string;
  createdAt: string;
};

export default function ProductsPage() {
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [price, setPrice] = useState('');
  const [hpp, setHpp] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: Product[] }>('/products');
      setProducts(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setStock('0');
    setPrice('');
    setHpp('');
    setIsOpen(true);
  };

  const openEdit = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setSku(prod.sku || '');
    setStock(String(prod.stock));
    setPrice(String(Number(prod.price)));
    setHpp(String(Number(prod.hpp)));
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/products/${editingId}` : '/products';
      const method = editingId ? 'PUT' : 'POST';
      await apiRequest(url, {
        method,
        body: {
          name,
          sku: sku || undefined,
          stock: Number(stock),
          price: Number(price),
          hpp: Number(hpp),
        },
      });
      setIsOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const totalAsset = products.reduce((sum, p) => sum + p.stock * Number(p.price), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F6B3A] mb-1">Produk &amp; Stok</h1>
            <p className="text-sm text-[#6B7280]">Kelola stok barang, harga jual, dan HPP untuk perhitungan laba bersih otomatis.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#65C466] to-[#1F6B3A] text-white rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto shrink-0"
          >
            <Plus className="w-5 h-5" />
            Tambah Produk
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-[0.1em] mb-1">Estimasi Aset Stok</p>
              <h3 className="text-2xl font-bold text-[#1F2937]">{currency(totalAsset)}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#65C466] to-[#1F6B3A] text-white shadow-sm">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-[0.1em] mb-1">Total Kuantitas Stok</p>
              <h3 className="text-2xl font-bold text-[#1F2937]">{totalItems} Units</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-semibold uppercase tracking-[0.1em] mb-1">Restock Diperlukan (Stok &lt; 10)</p>
              <h3 className="text-2xl font-bold text-red-600">
                {products.filter((p) => p.stock < 10).length} Items
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#65C466]/10 bg-white px-4 py-3 shadow-sm max-w-md">
        <Search className="h-5 w-5 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Cari produk berdasarkan nama atau SKU..."
          className="w-full text-sm text-[#1F2937] outline-none placeholder-[#94A3B8]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main List */}
      {loading ? (
        isMobile ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-2/3" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3 border-b border-slate-50">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/6" />
                  <Skeleton className="h-5 w-1/6" />
                  <Skeleton className="h-5 w-1/6" />
                  <Skeleton className="h-5 w-1/12 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#65C466]/10 bg-white text-[#6B7280]">
          <Package className="h-12 w-12 text-[#94A3B8] mb-2" />
          <p className="text-sm">Tidak ada produk ditemukan.</p>
        </div>
      ) : isMobile ? (
        /* Mobile Card View */
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((prod) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#65C466]/10 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{prod.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {prod.sku || '-'}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    prod.stock < 10 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                  }`}
                >
                  {prod.stock} Units
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
                <div>
                  <p className="text-slate-400">Harga Jual</p>
                  <p className="font-bold text-[#1F6B3A] text-sm">{currency(Number(prod.price))}</p>
                </div>
                <div>
                  <p className="text-slate-400">HPP</p>
                  <p className="font-bold text-amber-600 text-sm">{currency(Number(prod.hpp))}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-2">
                <button
                  onClick={() => openEdit(prod)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(prod.id)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-hidden rounded-2xl border border-[#65C466]/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-[#1F2937]">
              <thead className="border-b border-[#F3F4F6] bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                <tr>
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Harga Jual</th>
                  <th className="px-6 py-4">HPP</th>
                  <th className="px-6 py-4">Stok</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-[#1F2937]">{prod.name}</td>
                    <td className="px-6 py-4 text-[#6B7280] font-mono">{prod.sku || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-[#1F6B3A]">{currency(Number(prod.price))}</td>
                    <td className="px-6 py-4 text-amber-600 font-semibold">{currency(Number(prod.hpp))}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          prod.stock < 10
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}
                      >
                        {prod.stock} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(prod)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: Keripik Pisang Cokelat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: KPC-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Harga Jual *</label>
                    <input
                      type="number"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                      placeholder="Harga Jual"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6B7280]">HPP *</label>
                    <input
                      type="number"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                      placeholder="Harga Pokok"
                      value={hpp}
                      onChange={(e) => setHpp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Stok Awal *</label>
                    <input
                      type="number"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                      placeholder="Stok"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] px-6 py-2.5 text-sm font-semibold text-white shadow-md"
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
