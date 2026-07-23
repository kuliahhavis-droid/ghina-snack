import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  TrendingDown,
  Apple,
  Package,
  Flame,
  Users,
  Truck,
  Zap,
  Droplet,
  X,
  UserCheck,
  Search,
  Calendar,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiRequest } from '../lib/api';
import { currency, formatDateId } from '../lib/format';
import { useIsMobile } from '../components/ui/use-mobile';
import { useLocation, useNavigate } from 'react-router';
import { Skeleton } from '../components/ui/skeleton';
// @ts-ignore
import confetti from 'canvas-confetti';

type ExpenseItem = {
  id: string;
  title: string;
  note: string | null;
  amount: string;
  transactionDate: string;
  proofUrl: string | null;
  category: { id: string; name: string; slug: string };
  product?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
};

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  type?: 'EXPENSE' | 'INCOME';
};

type ProductItem = {
  id: string;
  name: string;
};

type SupplierItem = {
  id: string;
  name: string;
};

const categoryStyles: Record<string, { icon: typeof Apple; color: string }> = {
  Buah: { icon: Apple, color: '#EF4444' },
  Minyak: { icon: Droplet, color: '#F97316' },
  Packaging: { icon: Package, color: '#F59E0B' },
  Gas: { icon: Flame, color: '#10B981' },
  Gaji: { icon: Users, color: '#3B82F6' },
  Ongkir: { icon: Truck, color: '#8B5CF6' },
  Listrik: { icon: Zap, color: '#EC4899' },
};

const palette = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const PengeluaranSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>

    {/* Distribution and Stats */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pie Chart Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <Skeleton className="h-44 w-44 rounded-full shrink-0" />
        <div className="flex-1 space-y-3.5 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-14 w-14 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>

    {/* Table List */}
    <div className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
      <div className="space-y-3.5">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2 border-b border-slate-50">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const triggerConfetti = () => {
  const duration = 1.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    const colors = ['#1F6B3A', '#65C466', '#D4AF37', '#FFDF00', '#8ADE1B'];

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors,
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors,
    });
  }, 250);
};

export default function PengeluaranPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    note: '',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    categoryId: '',
    productId: '',
    supplierId: '',
  });

  const loadExpenses = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest<{ success: boolean; data: ExpenseItem[] }>('/expenses');
      setExpenseData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [catRes, prodRes, suppRes] = await Promise.all([
        apiRequest<{ success: boolean; data: CategoryItem[] }>('/categories'),
        apiRequest<{ success: boolean; data: ProductItem[] }>('/products'),
        apiRequest<{ success: boolean; data: SupplierItem[] }>('/suppliers'),
      ]);

      const expenseCategories = catRes.data.filter((category) => category.type !== 'INCOME');
      setCategories(expenseCategories);
      setProducts(prodRes.data);
      setSuppliers(suppRes.data);

      if (!addForm.categoryId && expenseCategories.length > 0) {
        setAddForm((prev) => ({ ...prev, categoryId: expenseCategories[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat metadata');
    }
  };

  useEffect(() => {
    void loadExpenses();
    void loadMetadata();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === '1') {
      setIsAddOpen(true);
    }
  }, [location.search]);

  const closeAddModal = () => {
    setIsAddOpen(false);
    if (new URLSearchParams(location.search).get('add') === '1') {
      navigate('/pengeluaran', { replace: true });
    }
  };

  const handleAddExpense = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: addForm.title,
          note: addForm.note || undefined,
          amount: Number(addForm.amount),
          transactionDate: `${addForm.transactionDate}T00:00:00.000Z`,
          categoryId: addForm.categoryId,
          productId: addForm.productId || undefined,
          supplierId: addForm.supplierId || undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      setIsAddOpen(false);
      setAddForm({
        title: '',
        note: '',
        amount: '',
        transactionDate: new Date().toISOString().slice(0, 10),
        categoryId: categories[0]?.id ?? '',
        productId: '',
        supplierId: '',
      });
      await loadExpenses();
      triggerConfetti();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah pengeluaran');
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenseData.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category.id === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      if (filterPeriod === 'this-month') {
        const tDate = new Date(item.transactionDate);
        const today = new Date();
        matchesDate = tDate.getFullYear() === today.getFullYear() && tDate.getMonth() === today.getMonth();
      } else if (filterPeriod === 'last-month') {
        const tDate = new Date(item.transactionDate);
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        matchesDate = tDate.getFullYear() === lastMonth.getFullYear() && tDate.getMonth() === lastMonth.getMonth();
      } else if (filterPeriod === 'custom') {
        if (startDate || endDate) {
          const tDateTime = new Date(item.transactionDate).getTime();
          const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : -Infinity;
          const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Infinity;
          matchesDate = tDateTime >= start && tDateTime <= end;
        }
      }
      
      return matchesCategory && matchesSearch && matchesDate;
    });
  }, [expenseData, selectedCategory, searchQuery, filterPeriod, startDate, endDate]);

  const totalExpense = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const groupedCategories = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();

    for (const item of expenseData) {
      const current = map.get(item.category.id) ?? { name: item.category.name, value: 0 };
      current.value += Number(item.amount);
      map.set(item.category.id, current);
    }

    return Array.from(map.entries()).map(([id, item]) => ({ id, ...item }));
  }, [expenseData]);

  if (loading) {
    return <PengeluaranSkeleton />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#1F6B3A] mb-2">Pengeluaran</h1>
          <p className="text-[#6B7280]">Kelola dan analisis pos pengeluaran operasional usaha.</p>
        </div>
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Tambah Pengeluaran
          </motion.button>
        )}
      </motion.div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Total Pengeluaran</p>
                  <h3 className="text-2xl font-bold text-[#1F2937]">{currency(totalExpense)}</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Total Transaksi</p>
                  <h3 className="text-2xl font-bold text-[#1F2937]">{filteredExpenses.length}</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-[#65C466]/10"
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#1F6B3A] text-white border-transparent shadow-sm'
                    : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F0FDF4]'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#1F6B3A] text-white border-transparent shadow-sm'
                      : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F0FDF4]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10 flex flex-col justify-between"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#1F2937]">Proporsi Kategori</h3>
            <p className="text-sm text-[#6B7280]">Distribusi pengeluaran saat ini</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={groupedCategories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
              >
                {groupedCategories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1F2937]">Riwayat Pengeluaran</h3>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-sm text-[#65C466] hover:text-[#1F6B3A] font-medium"
            >
              Tampilkan Semua
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-slate-100 pb-5">
          <div className="flex-1 min-w-[260px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari deskripsi, catatan, kategori..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6B7280]" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2.5 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors text-sm text-[#1F2937]"
            >
              <option value="all">Semua Periode</option>
              <option value="this-month">Bulan Ini</option>
              <option value="last-month">Bulan Lalu</option>
              <option value="custom">Kustom Tanggal</option>
            </select>
          </div>

          {filterPeriod === 'custom' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors text-sm text-[#1F2937]"
              />
              <span className="text-xs text-[#6B7280]">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors text-sm text-[#1F2937]"
              />
            </motion.div>
          )}
        </div>

        <div className="space-y-3">
          {filteredExpenses.map((expense, index) => {
            const categoryData = categoryStyles[expense.category.name] ?? {
              icon: Package,
              color: '#6B7280',
            };
            const Icon = categoryData.icon;
            const color = categoryData.color;

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-[#F0FDF4] transition-colors border border-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1F2937]">{expense.title}</p>
                    {expense.note && <p className="text-xs text-[#6B7280]">{expense.note}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {expense.category.name}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{formatDateId(expense.transactionDate)}</span>
                      {expense.supplier && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          Pemasok: {expense.supplier.name}
                        </span>
                      )}
                      {expense.product && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-sky-50 border border-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                          Produksi: {expense.product.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-red-600">- {currency(Number(expense.amount))}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 overflow-y-auto py-8">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1F2937]">Tambah Pengeluaran</h3>
              <button
                onClick={closeAddModal}
                className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F5F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Kategori Pengeluaran *</label>
                  <select
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Tujuan Supplier / Pemasok</label>
                  <select
                    value={addForm.supplierId}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                  >
                    <option value="">-- Tanpa Supplier --</option>
                    {suppliers.map((supp) => (
                      <option key={supp.id} value={supp.id}>
                        {supp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Biaya Produksi Produk? (Opsional)</label>
                <select
                  value={addForm.productId}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, productId: e.target.value }))}
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                >
                  <option value="">-- Bukan Biaya Produksi Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#6B7280] mt-1">Hubungkan ke produk jika pengeluaran ini dibelanjakan khusus untuk produksi/HPP produk tertentu.</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Judul Pengeluaran *</label>
                <input
                  value={addForm.title}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                  placeholder="Contoh: Belanja Minyak Goreng"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Catatan Tambahan</label>
                <textarea
                  value={addForm.note}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                  rows={2}
                  placeholder="Opsional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nominal Belanja (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.amount}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    value={addForm.transactionDate}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, transactionDate: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#EF4444] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-xl border border-[#D1D5DB] px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
