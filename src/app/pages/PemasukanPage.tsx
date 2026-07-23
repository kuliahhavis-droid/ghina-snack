import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  ShoppingBag,
  Calendar,
  X,
  Tag,
  User,
  Package,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { currency, formatDateId, formatMonthId } from '../lib/format';
import { exportCsv } from '../lib/export';
import { useIsMobile } from '../components/ui/use-mobile';
import { Skeleton } from '../components/ui/skeleton';
// @ts-ignore
import confetti from 'canvas-confetti';

type IncomeItem = {
  id: string;
  source: string;
  description: string | null;
  amount: string;
  transactionDate: string;
  proofUrl: string | null;
  category?: { name: string } | null;
  product?: { name: string } | null;
  customer?: { name: string } | null;
  receivable?: { status: string; dueDate: string } | null;
};

type Category = {
  id: string;
  name: string;
  type: string;
};

type Product = {
  id: string;
  name: string;
  price: string;
  stock: number;
};

type Customer = {
  id: string;
  name: string;
};

const PemasukanSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

    {/* Table list */}
    <div className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
      <div className="space-y-3.5 pt-4">
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

export default function PemasukanPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [incomeData, setIncomeData] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Advanced Form State
  const [addForm, setAddForm] = useState({
    source: '',
    description: '',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    categoryId: '',
    productId: '',
    quantity: '',
    customerId: '',
    paymentStatus: 'PAID', // "PAID" or "UNPAID" / "TEMPO"
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Default 7 days from now
  });

  const loadIncomes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest<{ success: boolean; data: IncomeItem[] }>('/incomes');
      setIncomeData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data pemasukan');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [catRes, prodRes, custRes] = await Promise.all([
        apiRequest<{ success: boolean; data: Category[] }>('/categories'),
        apiRequest<{ success: boolean; data: Product[] }>('/products'),
        apiRequest<{ success: boolean; data: Customer[] }>('/customers'),
      ]);
      // Filter category type INCOME only
      setCategories(catRes.data.filter((c) => c.type === 'INCOME'));
      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error('Failed to load master metadata:', err);
    }
  };

  useEffect(() => {
    void loadIncomes();
    void loadMetadata();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === '1') {
      setIsAddOpen(true);
    }
  }, [location.search]);

  // Autofill amount when product & quantity are updated
  useEffect(() => {
    if (addForm.productId && addForm.quantity) {
      const prod = products.find((p) => p.id === addForm.productId);
      if (prod) {
        const calculated = Number(prod.price) * parseInt(addForm.quantity, 10);
        setAddForm((prev) => ({ ...prev, amount: String(calculated) }));
      }
    }
  }, [addForm.productId, addForm.quantity, products]);

  const closeAddModal = () => {
    setIsAddOpen(false);
    if (new URLSearchParams(location.search).get('add') === '1') {
      navigate('/pemasukan', { replace: true });
    }
  };

  const sources = useMemo(() => {
    const uniqueSources = Array.from(new Set(incomeData.map((item) => item.source)));
    return ['all', ...uniqueSources];
  }, [incomeData]);

  const matchesPeriod = (transactionDateStr: string) => {
    if (filterPeriod === 'all') return true;
    
    const tDate = new Date(transactionDateStr);
    const today = new Date();
    
    if (filterPeriod === 'this-month') {
      return tDate.getFullYear() === today.getFullYear() && tDate.getMonth() === today.getMonth();
    }
    
    if (filterPeriod === 'last-month') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return tDate.getFullYear() === lastMonth.getFullYear() && tDate.getMonth() === lastMonth.getMonth();
    }
    
    if (filterPeriod === 'custom') {
      if (!startDate && !endDate) return true;
      const tDateTime = tDate.getTime();
      
      const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : -Infinity;
      const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Infinity;
      
      return tDateTime >= start && tDateTime <= end;
    }
    
    return true;
  };

  const filteredData = incomeData.filter((item) => {
    const matchesSearch =
      (item.description ?? item.source).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category?.name && item.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.customer?.name && item.customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    const matchesDate = matchesPeriod(item.transactionDate);
    return matchesSearch && matchesSource && matchesDate;
  });

  const totalIncome = filteredData.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalTransactions = filteredData.length;

  const handleExport = () => {
    if (filteredData.length === 0) {
      setError('Tidak ada data pemasukan untuk diexport');
      return;
    }

    exportCsv({
      filename: `pemasukan-${new Date().toISOString().slice(0, 10)}.csv`,
      rows: filteredData,
      columns: [
        { key: 'transactionDate', label: 'Tanggal', format: (value) => formatDateId(value as string) },
        { key: 'source', label: 'Sumber' },
        { key: 'description', label: 'Deskripsi' },
        { key: 'amount', label: 'Nominal', format: (value) => currency(value as string) },
        { key: 'proofUrl', label: 'Bukti', format: (value) => (value ? 'Ada' : 'Tidak ada') },
      ],
    });
  };

  const handleAddIncome = async (event: FormEvent) => {
    event.preventDefault();

    // Stock validation check frontend side
    if (addForm.productId && addForm.quantity) {
      const prod = products.find((p) => p.id === addForm.productId);
      const qtyInt = parseInt(addForm.quantity, 10);
      if (prod && prod.stock < qtyInt) {
        alert(`Gagal: Stok tidak mencukupi. Stok "${prod.name}" saat ini adalah ${prod.stock}.`);
        return;
      }
    }

    setSaving(true);

    try {
      const payload: any = {
        source: addForm.source,
        description: addForm.description || undefined,
        amount: Number(addForm.amount),
        transactionDate: `${addForm.transactionDate}T00:00:00.000Z`,
        categoryId: addForm.categoryId || undefined,
        productId: addForm.productId || undefined,
        quantity: addForm.quantity ? parseInt(addForm.quantity, 10) : undefined,
        customerId: addForm.customerId || undefined,
        paymentStatus: addForm.paymentStatus,
        dueDate:
          addForm.paymentStatus === 'UNPAID'
            ? `${addForm.dueDate}T23:59:59.000Z`
            : undefined,
      };

      await apiRequest('/incomes', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      setIsAddOpen(false);
      setAddForm({
        source: '',
        description: '',
        amount: '',
        transactionDate: new Date().toISOString().slice(0, 10),
        categoryId: '',
        productId: '',
        quantity: '',
        customerId: '',
        paymentStatus: 'PAID',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
      await loadIncomes();
      await loadMetadata(); // Reload stocks count
      triggerConfetti();
    } catch (err: any) {
      setError(err.message || 'Gagal menambah pemasukan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PemasukanSkeleton />;
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
          <h1 className="text-3xl font-bold text-[#1F6B3A] mb-2">Pemasukan</h1>
          <p className="text-[#6B7280]">Kelola dan analisis arus kas masuk usaha Ghina Snack.</p>
        </div>
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#65C466] to-[#1F6B3A] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Tambah Pemasukan
          </motion.button>
        )}
      </motion.div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Total Pemasukan</p>
              <h3 className="text-2xl font-bold text-[#1F2937]">{currency(totalIncome)}</h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#65C466] to-[#1F6B3A] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
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
              <h3 className="text-2xl font-bold text-[#1F2937]">{totalTransactions}</h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Periode</p>
              <h3 className="text-base font-bold text-[#1F2937] truncate max-w-[160px]">
                {filterPeriod === 'all'
                  ? 'Semua'
                  : filterPeriod === 'this-month'
                    ? formatMonthId(new Date().toISOString().slice(0, 7))
                    : filterPeriod === 'last-month'
                      ? formatMonthId(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7))
                      : `${startDate || '?'} s/d ${endDate || '?'}`}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#A3E635] to-[#65C466] rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-[#65C466]/10"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sumber, deskripsi, kategori, reseller..."
                className="w-full pl-12 pr-4 py-3 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#6B7280]" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-3 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors text-sm text-[#1F2937]"
            >
              <option value="all">Semua Sumber</option>
              {sources
                .filter((item) => item !== 'all')
                .map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6B7280]" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-3 bg-[#F5F7FA] border-2 border-transparent rounded-xl focus:border-[#65C466] focus:outline-none transition-colors text-sm text-[#1F2937]"
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-3 bg-[#F5F7FA] text-[#1F2937] rounded-xl hover:bg-[#E5E7EB] transition-colors text-sm"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-[#65C466]/10 overflow-hidden"
      >
        {isMobile ? (
          <div className="space-y-3 p-4">
            {filteredData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-2xl border border-[#65C466]/10 bg-[#F8FAFC] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65C466]">{formatDateId(item.transactionDate)}</p>
                    <p className="mt-1 text-base font-semibold text-[#1F2937] truncate">{item.source}</p>
                    {item.category && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-[#1F6B3A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                        <Tag className="h-3 w-3" />
                        {item.category.name}
                      </span>
                    )}
                    <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">{item.description ?? 'Tidak ada deskripsi'}</p>
                    {item.customer && (
                      <p className="mt-1.5 text-xs text-slate-500 font-medium">Reseller: {item.customer.name}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-[#1F2937]">{currency(Number(item.amount))}</p>
                    {item.receivable ? (
                      <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                        item.receivable.status === 'PAID'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        {item.receivable.status === 'PAID' ? 'Lunas' : 'Tempo'}
                      </span>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-[#6B7280]">Lunas</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F0FDF4] border-b border-[#65C466]/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F6B3A]">Tanggal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F6B3A]">Sumber &amp; Kategori</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F6B3A]">Detail Transaksi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F6B3A]">Reseller / Produk</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#1F6B3A]">Nominal</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#1F6B3A]">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#65C466]/10">
                {filteredData.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-[#F0FDF4] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#6B7280]">{formatDateId(item.transactionDate)}</td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-[#1F2937]">{item.source}</p>
                      {item.category && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-[#1F6B3A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                          <Tag className="h-2.5 w-2.5" />
                          {item.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">{item.description ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">
                      {item.customer && (
                        <p className="flex items-center gap-1 text-[#1F2937] font-medium">
                          <User className="h-3.5 w-3.5 text-[#94A3B8]" />
                          {item.customer.name}
                        </p>
                      )}
                      {item.product && (
                        <p className="flex items-center gap-1 text-[11px] mt-0.5">
                          <Package className="h-3 w-3 text-[#94A3B8]" />
                          {item.product.name}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-[#1F2937]">{currency(Number(item.amount))}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      {item.receivable ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                          item.receivable.status === 'PAID'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                        }`}>
                          {item.receivable.status === 'PAID' ? 'Lunas' : 'Tempo'}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                          Cash (Lunas)
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 overflow-y-auto py-8">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1F6B3A]">Tambah Pemasukan</h3>
              <button
                onClick={closeAddModal}
                className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F5F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Kategori Pemasukan</label>
                  <select
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Pelanggan / Reseller</label>
                  <select
                    value={addForm.customerId}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, customerId: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                  >
                    <option value="">-- Umum (Eceran) --</option>
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Sumber Pemasukan *</label>
                <input
                  value={addForm.source}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                  placeholder="Contoh: Penjualan Keripik Pisang"
                  required
                />
              </div>

              {/* Product Sale Toggle Form */}
              <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 space-y-3">
                <p className="text-xs font-bold text-[#1F6B3A]">Apakah ini penjualan Produk dari Stok?</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-[#6B7280]">Pilih Produk</label>
                    <select
                      value={addForm.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setAddForm((prev) => ({
                          ...prev,
                          productId: pid,
                          quantity: pid ? '1' : '',
                          source: pid
                            ? `Penjualan ${products.find((p) => p.id === pid)?.name || ''}`
                            : prev.source,
                        }));
                      }}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs focus:border-[#65C466] focus:outline-none"
                    >
                      <option value="">-- Bukan Penjualan Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-[#6B7280]">Kuantitas Terjual</label>
                    <input
                      type="number"
                      min="1"
                      disabled={!addForm.productId}
                      value={addForm.quantity}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs focus:border-[#65C466] focus:outline-none disabled:opacity-50"
                      placeholder="Qty"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Deskripsi Pemasukan</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                  rows={2}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nominal Pembayaran (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.amount}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    value={addForm.transactionDate}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, transactionDate: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Debt payment terms */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Metode Pembayaran</label>
                  <select
                    value={addForm.paymentStatus}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                  >
                    <option value="PAID">Cash (Lunas)</option>
                    <option value="UNPAID">Tempo (Piutang)</option>
                  </select>
                </div>

                {addForm.paymentStatus === 'UNPAID' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Jatuh Tempo *</label>
                    <input
                      type="date"
                      required
                      value={addForm.dueDate}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm focus:border-[#65C466] focus:outline-none"
                    />
                  </div>
                )}
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
                  className="rounded-xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] px-6 py-2.5 text-sm font-semibold text-white shadow-md"
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
